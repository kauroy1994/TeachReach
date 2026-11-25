import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createTutor, groundedClaims} from "./service.mjs";
import {retrieve} from "./retrieval.mjs";
import {TutorBudget} from "./budget.mjs";

const module = "ml-foundations/module-01";
const courseSite = "https://kauroy1994.github.io";
const doc = {module, title: "Slide 1 · Shapes", url: "courses/ml-foundations/module-01/slides.html#1",
  text: "A matrix has two axes: rows and columns."};
const supported = {claims: [{text: "A matrix has two axes.", evidence: [{id:"S1",quote: "A matrix has two axes"}]}]};
const base = {module, question:"How many axes does a matrix have?", history: [], token:"classroom-fixture"};

function make(options={}) {
  const calls = [], reservations = [];
  const env = {
    OPENAI_API_KEY: "test-provider", TURNSTILE_SITE_KEY: "public-site-key", TURNSTILE_SECRET_KEY: "test-verification",
    BURST: {limit: async () => ({success: options.burst !== false})},
    BUDGET: {idFromName: x => x, get: () => ({fetch: async () => {
      reservations.push(1);
      return new Response(null,{status:options.budget || 204});
    }})}
  };
  const fetcher = async (url, init) => {
    if (url.includes("siteverify")) return Response.json(options.check || {
      hostname:"kauroy1994.github.io",action:"teachreach_office",success:true});
    assert.equal(url, "https://api.openai.com/v1/chat/completions");
    assert.equal(init.headers.Authorization, "Bearer test-provider");
    const params = JSON.parse(init.body);
    calls.push(params);
    if (options.failure) return new Response(null,{status:options.failure});
    const output = calls.length === 1 ? (options.output || supported) : {supported: options.approve !== false, directAnswerId: options.direct || ""};
    return Response.json({choices:[{finish_reason:"stop",message:{content: JSON.stringify(output)}}]});
  };
  const handle = createTutor(options.docs || [doc], options.index || {axes:[0,123],matrix:[0,140]}, fetcher);
  const invoke = (path, body, headers={}, method=body ? "POST" : "GET") => handle(
    new Request("https://worker.example" + path, {method,
      headers:{Origin:courseSite,"CF-Connecting-IP":"192.0.2.1","Content-Type":"application/json",...headers},
      ...(body ? {body:JSON.stringify(body)} : {})}), env);
  return {calls, reservations, env, invoke};
}

test("Each delivered statement carries an exact quotation and the catalogue's own link", async () => {
  const run = make(), res = await run.invoke("/ask",base), answer = await res.json();
  assert.equal(answer.status, "answered");
  assert.deepEqual(answer.claims[0].references,[{title:doc.title,url:doc.url,quote:"A matrix has two axes"}]);
  assert.equal(run.calls.length,2);
  for (const call of run.calls) {
    assert.equal(call.model,"gpt-4.1-mini");
    assert.equal(call.store,false);
    assert.equal(call.response_format.json_schema.strict,true);
    assert.ok(call.max_completion_tokens < 1000);
  }
  assert.equal(run.reservations.length,1);
  assert.equal(res.headers.get("Access-Control-Allow-Origin"),courseSite);
});

test("Unknown source, unrelated quote, partial coverage, or a failed evidence check abstains", async () => {
  for (const options of [
    {output:{claims:[]}}, {output:{claims:[{text:"x",evidence:[{id:"S99",quote:doc.text}]}]}},
    {output:{claims:[{text:"x",evidence:[{id:"S1",quote:"Invented quotation"}]}]}},
    {output:{claims:[...supported.claims,{text:"Second claim",evidence:[]}]}}, {approve:false}
  ]) {
    const run=make(options);
    assert.deepEqual(await (await run.invoke("/ask",base)).json(),{status:"uncovered"});
  }
  assert.deepEqual(groundedClaims(null,[doc]),[]);
  const run=make();
  assert.deepEqual(await (await run.invoke("/ask",{...base,question:"zagreus"})).json(),{status:"uncovered"});
  assert.equal(run.calls.length,0);
});

test("A rejected paraphrase can recover an independently matched, verbatim course answer", async () => {
  const read = file => JSON.parse(readFileSync(new URL("./generated/" + file, import.meta.url)));
  const docs = read("sources.json"), index = read("search.json");
  const question = "How do tagged emails teach an inbox filter to predict whether an incoming message is spam?";
  const top = retrieve(docs, index, module, question, [])[0];
  assert.ok(top.url.endsWith("ml-foundations/module-01/slides.html#2"));
  for (const output of [{claims: []}, {claims:[{text:"A claim",evidence:[{id:"S1",quote:"Made-up evidence"}]}]}]) {
    const run = make({docs, index, output, approve:false, direct:"S1"});
    const result = await (await run.invoke("/ask", {...base, question})).json();
    assert.equal(run.calls.length, 2);
    const auditInput = JSON.parse(run.calls[1].messages[1].content);
    assert.ok(auditInput.publishedAnswers.some(p => p.id === "S1" && p.answer === top.answer));
    assert.equal(result.status, "answered");
    assert.equal(result.claims[0].text, top.answer);
    assert.equal(result.claims[0].references[0].url, top.url);
  }
  for (const direct of ["", "S999"]) {
    const run = make({docs, index, output:{claims:[]}, approve:false, direct});
    const result = await (await run.invoke("/ask", {...base,
      question: "What was this spam filter’s accuracy on my university’s email last week?"})).json();
    assert.deepEqual(result, {status:"uncovered"});
  }
});

test("Verification, quotas, prerequisites and backend error paths fail safely", async () => {
  for (const [opts, status] of [[{burst:false},429],[{budget:429},429],[{budget:503},503],[{failure:429},503],
    [{check:{success:true,hostname:"elsewhere.example",action:"teachreach_office"}},403],
    [{check:{success:true,hostname:"kauroy1994.github.io",action:"other"}},403]]) {
    const run=make(opts), res=await run.invoke("/ask",base);
    assert.equal(res.status,status);
    assert.equal((await res.json()).status,undefined);
    assert.equal(run.calls.length,opts.failure ? 1 : 0);
  }
  const run=make();
  assert.deepEqual(await (await run.invoke("/config")).json(),{siteKey:"public-site-key"});
  delete run.env.OPENAI_API_KEY;
  assert.equal((await run.invoke("/config")).status,503);
});

test("Allow only expected routes, origin, and bounded question payloads", async () => {
  const run=make();
  const forbidden=await run.invoke("/ask",base,{Origin:"https://other.example"});
  assert.equal(forbidden.status,403);
  assert.equal(forbidden.headers.get("Access-Control-Allow-Origin"),null);
  assert.equal((await run.invoke("/ask",null,{},"OPTIONS")).status,204);
  assert.equal((await run.invoke("/ask")).status,405);
  assert.equal((await run.invoke("/elsewhere")).status,404);
  assert.equal((await run.invoke("/ask",base,{"Content-Type":"text/plain"})).status,415);
  for (const overrides of [{module:"ml-foundations/module-17"},{module:"private/draft"},{module:{toString:null}},
    {question:" "},{question:"a".repeat(501)},{token:""}, {history:["a","b","c"]},{question:"a".repeat(9000)},
    {system:"use a different model"}]) {
    assert.equal((await run.invoke("/ask",{...base,...overrides})).status,400);
  }
  assert.equal(run.calls.length,0);
});

test("Real course search finds material across courses, including follow-up context and syllabi", () => {
  const read = file => JSON.parse(readFileSync(new URL("./generated/" + file,import.meta.url)));
  const docs=read("sources.json"), index=read("search.json");
  for (const [question,scope] of [
    ["How does symbolic unification use substitutions?", "neurosymbolic-ai/"],
    ["How is the machine learning course graded? in-class variants grading", "ml-foundations/syllabus"],
    ["How should I prepare my mentoring meeting evidence and decision?", "research-mentoring/"]
  ]) {
    const result=retrieve(docs,index,module,question,[]);
    assert.ok(result.some(d=>d.module.startsWith(scope)),question);
  }
  assert.ok(retrieve(docs,index,module,"What about that?",["Why do tensors have axes?"]).length);
  assert.deepEqual(retrieve(docs,index,module,"constructor __proto__",[]).filter(d=> !d.url),[]);
});

test("SQLite daily limit is shared across requests and survives object recreation", async t => {
  let DatabaseSync;
  try { ({DatabaseSync}=await import("node:sqlite")); }
  catch { t.skip("requires Node with node:sqlite"); return; }
  const db=new DatabaseSync(":memory:");
  const ctx={storage:{sql:{exec(statement,...args) {
    const rows=db.prepare(statement).all(...args);
    return {toArray:()=>rows};
  }}}};
  const counter=()=>new TutorBudget(ctx,{DAILY_QUESTIONS:"2"});
  assert.equal((await counter().fetch()).status,204);
  assert.equal((await counter().fetch()).status,204);
  assert.equal((await counter().fetch()).status,429);
  assert.equal(db.prepare("SELECT n FROM usage").get().n,2);
  db.close();
});
