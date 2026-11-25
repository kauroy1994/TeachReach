const site = new URL("../../", import.meta.url);
const worker = "https://teachreach-office-hours.kauroy1994.workers.dev";
const courses = { "ml-foundations": ["CS 483/583", 16], "neurosymbolic-ai": ["CS 691", 16], "research-mentoring": ["CS 696", 8] };
const modules = Object.entries(courses).flatMap(([course, [, count]]) =>
  Array.from({ length: count }, (_, i) => course + "/module-" + String(i + 1).padStart(2, "0")));
const cache = new Map();

// Preserve operators, signs, variable case and word order when selecting an exact answer.
function exactKey(question) {
  return question.normalize("NFC").trim().replace(/[ \t\r\n]+/g, " ").replace(/\?$/, "").trim();
}

function sourceURL(path) {
  if (typeof path !== "string" || !/^courses\/(ml-foundations|neurosymbolic-ai|research-mentoring)\//.test(path)) return null;
  const link = new URL(path, site);
  return link.origin === site.origin && link.pathname.startsWith(site.pathname + "courses/") ? link.href : null;
}

function courseLabel(path) {
  const [, course, number] = path.match(/^courses\/([^/]+)\/(?:module-(\d+)\/)?/) || [];
  return courses[course] ? courses[course][0] + (number ? " · Module " + number : "") : "";
}

function prepared(module) {
  if (!cache.has(module)) {
    const url = new URL("assets/tutor/answers/" + module + ".json", site);
    cache.set(module, fetch(url, {signal: AbortSignal.timeout(8000)}).then(async response => {
      if (!response.ok) throw new Error("Lesson unavailable");
      const rows = await response.json();
      return rows.filter(row => row.module === module && row.question && row.answer && sourceURL(row.url));
    }).catch(() => {
      cache.delete(module);
      return [];
    }));
  }
  return cache.get(module);
}

function exactAnswer(rows, question) {
  const matches = rows.filter(row => exactKey(row.question) === exactKey(question));
  if (new Set(matches.map(row => row.answer)).size === 1) return matches[0];
}

const stop = new Set(("a an the i my me we it how why what is are was should can could would when where " +
  "to of from and or with without in for as if be not do did does this that these those explain please " +
  "give example examples module slide slides work").split(" "));
function terms(text) {
  return [...new Set((text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).filter(t => t.length > 1 && !stop.has(t)))];
}

function related(rows, question, module) {
  const query = terms(question);
  const scored = rows.map(row => {
    const words = new Set(terms(row.question));
    const matches = query.filter(t => words.has(t)).length;
    const score = matches ? matches / Math.sqrt(query.length * words.size) : 0;
    return {row, score: score * (row.module === module ? 1.15 : 1)};
  }).filter(x => x.score >= 0.34).sort((a,b) => b.score - a.score);
  const unique = new Map();
  for (const {row} of scored) {
    if (!unique.has(row.question)) unique.set(row.question, row);
    if (unique.size === 3) break;
  }
  return [...unique.values()];
}

function element(tag, text, css) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (css) node.className = css;
  return node;
}

function link(text, url, target = "_blank") {
  const a = element("a", text);
  a.href = url;
  a.target = target;
  a.rel = "noopener";
  return a;
}

let apiPromise;
let verificationAttempt = 0;
function loadVerification() {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const script = element("script");
    const callback = "teachReachTurnstileLoaded" + (++verificationAttempt);
    const timer = setTimeout(() => fail("The verification service took too long to start. Try again."), 30000);
    function cleanup() {
      clearTimeout(timer);
      delete window[callback];
      script.onerror = null;
    }
    function fail(message) {
      cleanup();
      script.remove();
      apiPromise = undefined;
      reject(new Error(message));
    }
    // Turnstile calls this when its asynchronous API is ready to render a widget.
    window[callback] = () => {
      if (typeof window.turnstile?.render !== "function") {
        fail("The verification service could not start. Try again.");
        return;
      }
      cleanup();
      resolve(window.turnstile);
    };
    script.onerror = () => fail("The verification service could not download from challenges.cloudflare.com. Try again.");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=" + callback;
    document.head.append(script);
  });
  return apiPromise;
}

async function verify(container, siteKey) {
  const api = await loadVerification();
  let id, timer;
  try {
    return await new Promise((resolve, reject) => {
      const fail = () => reject(new Error("Verification did not finish. Your question is ready to try again."));
      timer = setTimeout(fail, 120000);
      id = api.render(container, {
        sitekey: siteKey, action: "teachreach_office", size: "compact", theme: "light",
        callback: resolve, "error-callback": fail, "expired-callback": fail, "timeout-callback": fail
      });
    });
  } finally {
    clearTimeout(timer);
    if (id != null) api.remove(id);
  }
}

const unavailable = "The live tutor is unavailable right now. You can register your question for the instructor.";
async function liveAnswer(module, question, history, challenge, status) {
  let config;
  try {
    const response = await fetch(worker + "/config", {signal: AbortSignal.timeout(8000)});
    if (response.ok) config = await response.json();
  } catch { /* Local office hours and the instructor form remain available. */ }
  if (!config || typeof config.siteKey !== "string" || !config.siteKey) throw new Error(unavailable);
  status.textContent = "Checking your browser…";
  const token = await verify(challenge, config.siteKey);
  status.textContent = "Looking for an answer in TeachReach…";
  const response = await fetch(worker + "/ask", {
    method: "POST", headers: {"Content-Type":"application/json"}, signal: AbortSignal.timeout(55000),
    body: JSON.stringify({module, question, history, token})
  });
  if (response.status === 429) throw new Error("The tutor has reached its question limit. Try again later or register your question.");
  if (!response.ok) throw new Error(unavailable);
  const result = await response.json();
  if (result.status === "uncovered") return result;
  const validClaim = claim => typeof claim?.text === "string" && claim.text.trim() &&
    Array.isArray(claim.references) && claim.references.length && claim.references.every(ref =>
      ref && sourceURL(ref.url) && typeof ref.title === "string" && ref.title.trim() &&
      typeof ref.quote === "string" && ref.quote.trim());
  if (result.status !== "answered" || !Array.isArray(result.claims) || !result.claims.length || !result.claims.every(validClaim)) {
    throw new Error(unavailable);
  }
  return result;
}

function drawClaims(answer, claims) {
  const sources = new Map();
  for (const claim of claims) {
    const p = element("p", claim.text, "tr-tutor-claim");
    for (const ref of claim.references) {
      const key = JSON.stringify([ref.url, ref.quote]);
      if (!sources.has(key)) sources.set(key, {ref, n: sources.size + 1});
      const n = sources.get(key).n;
      const citation = link("[" + n + "]", sourceURL(ref.url));
      citation.setAttribute("aria-label", "Reference " + n + ", " + courseLabel(ref.url) + " · " + ref.title);
      p.append(" ", citation);
    }
    answer.append(p);
  }
  const refs = element("div", "", "tr-tutor-refs");
  refs.append(element("strong", "References"));
  const ol = element("ol");
  for (const {ref} of sources.values()) {
    const li = element("li");
    const details = element("details");
    details.append(element("summary", "View source passage"), element("blockquote", ref.quote));
    li.append(link(courseLabel(ref.url) + " · " + ref.title, sourceURL(ref.url)), details);
    ol.append(li);
  }
  refs.append(ol);
  answer.append(refs);
}

function attach(host) {
  const module = host.dataset.module;
  if (!modules.includes(module)) return;
  function registration() {
    const url = host.dataset.register;
    const local = url.startsWith("#");
    const register = link("Register a new question", url, local ? "_self" : "_top");
    if (local) register.addEventListener("click", () => {
      const details = document.getElementById(url.slice(1));
      if (details?.tagName === "DETAILS") {
        details.open = true;
        details.querySelector("summary")?.focus();
      }
    });
    return register;
  }
  const heading = element("h2", "Ask the TeachReach tutor");
  const intro = element("p", "Ask about this module or another TeachReach lesson. Each answer includes links to the course material that supports it.");
  const log = element("div", "", "tr-tutor-log");
  const form = element("form");
  const label = element("label", "Your question");
  const field = element("textarea");
  field.id = "tr-tutor-question-" + module.replace("/", "-");
  field.maxLength = 500;
  field.rows = 3;
  field.required = true;
  label.htmlFor = field.id;
  const notice = element("p", "Questions requiring live AI and your two most recent answered questions are sent to OpenAI. Use only course-related information you are comfortable sharing.", "tr-tutor-notice");
  const actions = element("div", "", "tr-tutor-actions");
  const submit = element("button", "Ask question");
  submit.type = "submit";
  actions.append(submit, registration());
  const status = element("p", "", "tr-tutor-status");
  status.setAttribute("role", "status");
  const challenge = element("div", "", "tr-tutor-challenge");
  const feedback = element("div", "", "tr-tutor-feedback");
  const example = element("div", "", "tr-tutor-example");
  prepared(module).then(rows => {
    const row = rows.find(item => item.question.length <= 150 && item.answer.length >= 12);
    if (!row) return;
    const pick = element("button", row.question);
    pick.type = "button";
    pick.addEventListener("click", () => {
      if (pending) return;
      field.value = row.question;
      field.focus();
    });
    example.append("Try a question from this module: ", pick);
  });
  form.append(label, field, example, notice, actions, challenge, status);
  host.append(heading, intro, log, form, feedback);
  let pending = false;
  const history = [];

  function record(question, claims) {
    const turn = element("article", "", "tr-tutor-turn");
    turn.tabIndex = -1;
    turn.append(element("h3", question));
    drawClaims(turn, claims);
    log.append(turn);
    history.push(question);
    if (history.length > 2) history.shift();
    field.value = "";
    status.textContent = "Answer ready with references.";
    turn.focus();
  }

  function showPrepared(row) {
    record(row.question, [{text:row.answer, references:[{title:row.title, url:row.url, quote:row.answer}]}]);
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const question = field.value.trim();
    if (pending) return;
    if (!question) {
      field.setCustomValidity("Enter a question.");
      field.reportValidity();
      field.setCustomValidity("");
      return;
    }
    pending = true;
    field.readOnly = true;
    submit.disabled = true;
    feedback.replaceChildren();
    status.textContent = "Checking the course materials…";
    let rows = [];
    try {
      const local = await prepared(module);
      const match = exactAnswer(local, question);
      if (match) return showPrepared(match);
      const other = (await Promise.all(modules.filter(m => m !== module).map(prepared))).flat();
      rows = [...local, ...other];
      const cross = exactAnswer(rows, question);
      if (cross) return showPrepared(cross);
      const result = await liveAnswer(module, question, history, challenge, status);
      if (result.status === "answered") return record(question, result.claims);
      const turn = element("article", "", "tr-tutor-turn");
      turn.tabIndex = -1;
      const fallback = element("p", "The TeachReach materials do not cover this. ");
      const register = registration();
      register.textContent = "Please register a new question.";
      fallback.append(register);
      turn.append(element("h3", question), fallback);
      log.append(turn);
      field.value = "";
      status.textContent = "No supported answer found.";
      turn.focus();
    } catch (err) {
      const known = [unavailable, "Verification", "The verification service", "The tutor has reached"];
      status.textContent = known.some(prefix => err?.message?.startsWith(prefix)) ? err.message : unavailable;
      const suggestions = related(rows, question, module);
      if (suggestions.length) {
        feedback.append(element("strong", "Related questions already answered in TeachReach"));
        const list = element("ul");
        for (const row of suggestions) {
          const li = element("li");
          const pick = element("button", row.question);
          pick.type = "button";
          pick.addEventListener("click", () => {
            feedback.replaceChildren();
            showPrepared(row);
          });
          li.append(pick);
          list.append(li);
        }
        feedback.append(list);
      }
    } finally {
      pending = false;
      field.readOnly = false;
      submit.disabled = false;
    }
  });
}

document.querySelectorAll("[data-tr-tutor]").forEach(attach);
