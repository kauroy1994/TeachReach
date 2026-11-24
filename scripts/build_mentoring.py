"""Render the mentoring course and execute the worked examples used in its notebooks."""
import argparse
import contextlib
import hashlib
import io
import json
import posixpath
from html import escape
from pathlib import Path

from site_navigation import ROOT, add_navigation

SLUG = "courses/research-mentoring"
COURSE = ROOT / SLUG
STAGES = [
    ("Represent rules and their sources", "Trace a reuse decision through two versions of a regulatory filing. Build a representation that lets a reviewer inspect the decision and its source.", "An evidence table and a versioned mapping"),
    ("Answer questions with executable models", "Turn prose about a workflow into a simulation. Compare the answers you can retrieve from a document with the answers that require executing its rules.", "A process model and a paired comparison"),
    ("Test a simulator under change", "Two programs can reproduce the same recorded process and disagree when a condition changes. Design a test that tells them apart.", "A counterexample and an evaluation of when to trust an answer"),
    ("Reason from agent trajectories", "Annotate what happened in a simulated episode. Use an explicit transition model to ask what could happen under another action, then defend the limits of the answer.", "An annotated trajectory, reproducible result and oral defense"),
]
READINGS = [
    ("W3C · PROV Model Primer", "https://www.w3.org/TR/prov-primer/", "Identify an entity, an activity and a derivation in your document mapping. Which information would a second reviewer need to recover the original clause?"),
    ("SimPy · Shared Resources", "https://simpy.readthedocs.io/en/stable/simpy_intro/shared_resources.html", "Trace the waiting time of one request. Which line of the process description gives the simulator permission to start the next job?"),
    ("Robert G. Sargent · Validation and Verification of Simulation Models", "https://www.informs-sim.org/wsc04papers/004.pdf", "Choose one check of the implementation and one check of the model’s intended use. What evidence could pass the first and fail the second?"),
    ("Poole and Mackworth · Representing States, Actions, and Goals", "https://www.cs.ubc.ca/~poole/aibook/2e/html2e/ArtInt2e.Ch6.S1.html", "Write the precondition and effect of one action. Which part of the resulting state can you verify from an observation?"),
]
ACTIVITIES = [("seminar", "Worked examples"), ("workbench", "Workbench"), ("exercise", "Independent task"), ("notebook", "Notebook"), ("meeting", "Mentor review")]


def catalog():
    modules = [json.loads((COURSE / f"content/m{n:02}.json").read_text()) for n in range(1, 9)]
    if [m["n"] for m in modules] != list(range(1, 9)):
        raise ValueError("Module numbers must match their filenames")
    return [(s[0], modules[i*2:i*2+2]) for i, s in enumerate(STAGES)]


def link(url, label):
    return f'<a href="{escape(url, quote=True)}">{escape(label)}</a>'


def listed(items):
    return '<ul>' + ''.join(f'<li>{escape(x)}</li>' for x in items) + '</ul>'


def page(path, title, content, workbench=False):
    rel = posixpath.relpath(".", posixpath.dirname(path) or ".")
    site = rel + "/../.."
    lab = f'<script defer src="{rel}/assets/workbench.js"></script>' if workbench else ""
    head = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#9e1b32"><title>{escape(title)} · CS 696 · TeachReach</title><link rel="stylesheet" href="{site}/assets/portal.css"><link rel="stylesheet" href="{rel}/assets/course.css">{lab}</head>'''
    body = f'''<body class="mentoring"><a class="skip" href="#main">Skip to course content</a><div class="stripe"></div><header><a class="brand" href="{site}/"><span class="icon">TR</span><span><small>Kaushik Roy, University of Alabama</small><strong>TeachReach</strong></span></a><nav aria-label="Course navigation">{link(rel+"/index.html", "Roadmap")}{link(rel+"/syllabus.html", "Syllabus")}</nav></header><main id="main">{content}</main><footer>TeachReach · CS 696 · Kaushik Roy, University of Alabama</footer></body></html>'''
    return add_navigation(f"{SLUG}/{path}", head + body) + "\n"


def hero(kicker, title, intro, more="", figure=""):
    return f'<section class="hero research-hero"><div><span class="eyebrow">{escape(kicker)}</span><h1>{escape(title)}</h1><p>{escape(intro)}</p>{more}</div>{figure}</section>'


def trace_figure():
    return """<figure class="trace-figure"><figcaption>When one step changes</figcaption><p>A worked example with one job and two sequential steps.</p><dl><div><dt>Recorded run</dt><dd>2 min + 3 min = <strong>5 min</strong></dd></div><div><dt>Double the second step</dt><dd>2 min + 6 min = <strong>8 min</strong></dd></div></dl><p>Which rule must the simulator execute to explain the difference?</p></figure>"""


INTRO = "When can an AI system justify a decision from a document, and when does it need to run a model? Build evidence-linked rules, test what-if answers, and examine what an agent’s trajectory can actually establish."
MENTORS = '<p class="people"><strong>Mentor</strong> Kaushik Roy <span>·</span> <strong>Doctoral mentee</strong> Ashraf Abdul-Muumin</p>'


def stage_cards(groups, prefix=""):
    cards = []
    for i, (name, mods) in enumerate(groups, 1):
        rows = ''.join(f'<li>{link(prefix+"module-%02d/"%m["n"], "%02d · %s"%(m["n"],m["title"]))}</li>' for m in mods)
        cards.append(f'<article class="card stage-card"><span class="eyebrow">Stage {i:02}</span><h3>{link(prefix+f"stage-{i:02}/",name)}</h3><p>{escape(STAGES[i-1][1])}</p><ol>{rows}</ol><p class="artifact"><strong>Bring forward</strong> {escape(STAGES[i-1][2])}</p></article>')
    return '<div class="stages">' + ''.join(cards) + '</div>'


def overview(groups):
    actions = '<div class="hero-links">'+link("module-01/","Begin Module 01 →")+link("syllabus.html","Read the syllabus")+'</div>'
    return page("index.html", "Graduate Research Mentoring", hero("CS 696 · Independent study · Fall 2026", "Graduate Research Mentoring", INTRO, actions, trace_figure()) + MENTORS +
        '<section class="course-section"><h2>Course roadmap</h2><p>Start with a source clause, turn its meaning into an executable rule, and test the rule when a condition changes. The final stage asks what the same discipline can tell you about an agent’s actions. Each module uses invented records and ends with an artifact for a mentoring meeting.</p>' + stage_cards(groups) + '</section>')


def syllabus(groups):
    outcomes = ["Represent a versioned filing requirement, cite the text that authorizes a mapping, and explain when an ambiguity needs human judgment.",
                "Build an executable process model from source clauses and compare it with a retrieval baseline on the same questions.",
                "Design a controlled change that exposes a simulator error, and quantify the tradeoff between answering, withholding an answer, and the cost of checking.",
                "Distinguish observations from model-dependent predictions in a trajectory and defend an independently reproducible claim about an agent’s behavior."]
    return page("syllabus.html","Syllabus",hero("CS 696 · 3 credit hours · Fall 2026","Independent study syllabus","A one-to-one graduate research course for a beginning doctoral student with a bachelor’s degree in computer science.") + MENTORS +
        '<section class="panel"><h2>Where to start</h2><p>Bring familiarity with functions, loops, dictionaries, averages and reading short Python programs. Module 01 introduces the notation for linking a claim to evidence. Later modules introduce process simulation, experimental controls and state transitions as you need them. Every notebook uses Python’s standard library and includes the small dataset it needs.</p><h2>What you will be able to do</h2>'+listed(outcomes)+'</section>'+
        '<section class="panel"><h2>How to use a mentoring meeting</h2><p>Before the meeting, write down a prediction, run the example and keep the output that surprised you. Bring the module’s requested research artifact and one unresolved decision.</p><p>At the meeting, show a case that supports your interpretation and one that challenges it. Explain what you would change if your mentor disagreed. Afterwards, record the decision, its rationale and the next check in your research notebook.</p></section><section class="course-section"><h2>Stages and research artifacts</h2>'+
        stage_cards(groups)+'</section>')


def stage_page(i, groups):
    name, mods = groups[i-1]
    entry = "Start with your experience writing and testing small programs." if i == 1 else "Bring your work from Stage %02d · %s." % (i-1, STAGES[i-2][2].lower())
    reading, url, prompt = READINGS[i-1]
    cards = ''.join(f'<article class="card stage-card"><span class="eyebrow">Module {m["n"]:02}</span><h2>{link("../module-%02d/"%m["n"],m["title"])}</h2><p>{escape(m["goal"])}</p><p class="artifact">{escape(m["meeting"]["deliverable"])}</p></article>' for m in mods)
    return page(f"stage-{i:02}/index.html",name,hero(f"CS 696 · Stage {i:02} of 04",name,STAGES[i-1][1])+
        f'<p class="people">{entry}</p><section class="stages">{cards}</section><section class="panel"><h2>Reading for the meeting</h2><p class="source">{link(url,reading)}</p><p>{escape(prompt)}</p></section><section class="panel"><h2>Before you move on</h2><p>{escape(mods[-1]["handoff"])}</p><div class="links">'+link("../index.html","Course roadmap")+ (link(f"../stage-{i+1:02}/","Next stage →") if i<4 else link("../module-08/#meeting","Final mentor review"))+'</div></section>')


def run_code(source, namespace):
    out = io.StringIO()
    with contextlib.redirect_stdout(out):
        exec(compile(source, "<course example>", "exec"), namespace)
    return out.getvalue()


def code_block(source):
    return '<pre tabindex="0"><code>'+escape(source)+'</code></pre>'


def reveal(label, content):
    return f'<details><summary>{escape(label)}</summary>{content}</details>'


def module_resources(m):
    cells = []
    state = {"__name__": "__main__"}
    def cell(kind, value):
        ident = hashlib.sha256(f'{m["n"]}-{len(cells)}-{kind}'.encode()).hexdigest()[:12]
        item = dict(id=ident,cell_type=kind,metadata={},source=value.splitlines(keepends=True))
        output = ""
        if kind == "code":
            output = run_code(value, state)
            item["execution_count"] = sum(c["cell_type"]=="code" for c in cells)+1
            item["outputs"] = [dict(output_type="stream", name="stdout", text=output.splitlines(keepends=True))] if output else []
        cells.append(item)
        return output
    n = m["n"]
    cell("markdown",f'# CS 696 · {m["title"]}\n\n{m["goal"]}\n\n{m["bridge"]}\n\n{m["case"]}')
    lessons = []
    for i,l in enumerate(m["lessons"],1):
        cell("markdown",f'## {l["title"]}\n\n{l["prose"]}\n\n{l["formula"]}\n\n{l["symbols"]}')
        out = cell("code",l["code"])
        cell("markdown",f'**Discuss** · {l["question"]}\n\n{l["answer"]}')
        lessons.append(f'<article class="worked" id="example-{i}"><h3>{escape(l["title"])}</h3><p>{escape(l["prose"])}</p><div class="notation"><code>{escape(l["formula"])}</code><p>{escape(l["symbols"])}</p></div>'+reveal("Inspect the Python and its output",code_block(l["code"]) + '<h4>Output</h4>'+code_block(out.rstrip())) + f'<h4>Think it through</h4><p>{escape(l["question"])}</p>'+reveal("Discuss the reasoning",f'<p>{escape(l["answer"])}</p>')+'</article>')
    e, meet = m["exercise"], m["meeting"]
    cell("markdown",f'## Independent task\n\n{e["prompt"]}')
    cell("code",e["starter"])
    cell("markdown",f'## Compare your solution\n\n{e["hint"]}')
    solved = cell("code",e["solution"])
    cell("markdown",e["interpretation"]+"\n\n## Mentor review\n\n"+meet["deliverable"]+"\n\n"+"\n".join("- "+x for x in meet["criteria"]+meet["questions"])+"\n\n"+m["handoff"])
    nb = dict(cells=cells,metadata=dict(kernelspec=dict(display_name="Python 3",language="python",name="python3"),language_info=dict(name="python")),nbformat=4,nbformat_minor=5)
    stage=(n+1)//2
    local_nb="study.ipynb"
    sections='<nav class="activity-nav" aria-label="Module activities">'+''.join(link("#"+k,v) for k,v in ACTIVITIES)+'</nav>'
    seminar=f'<section class="panel" id="seminar"><h2>Worked examples</h2><p>{escape(m["case"])}</p>'+''.join(lessons)+'</section>'
    lab=f'<section class="panel" id="workbench" data-module="{n}" data-source="../assets/study-records.csv"><h2>Research workbench</h2><p>Change an input and inspect the evidence behind the result. This activity uses a separate set of synthetic teaching records.</p><div data-lab></div><noscript><p>Open the study records to inspect the examples directly.</p></noscript><p class="source"><a href="../assets/study-records.csv" download>Download the synthetic study records (CSV)</a></p></section>'
    task=f'<section class="panel" id="exercise"><h2>Independent task</h2><p>{escape(e["prompt"])}</p>'+reveal("Show starter code",code_block(e["starter"]))+reveal("Get a hint",f'<p>{escape(e["hint"])}</p>')+reveal("Compare with a worked solution",code_block(e["solution"])+code_block(solved.rstrip())+f'<p>{escape(e["interpretation"])}</p>')+'</section>'
    nbpath=f'https://colab.research.google.com/github/kauroy1994/TeachReach/blob/main/{SLUG}/module-{n:02}/{local_nb}'
    notebook='<section class="panel" id="notebook"><h2>Research notebook</h2><p>Run the three worked examples in order, change an assumption in the independent task, and save your output for the meeting.</p><div class="links">'+link(local_nb,"Download notebook (.ipynb)")+link(nbpath,"Open in Colab ↗")+'</div></section>'
    meeting=f'<section class="panel" id="meeting"><h2>Mentor review</h2><p class="bring">{escape(meet["deliverable"])}</p><h3>What the artifact should show</h3>{listed(meet["criteria"])}<h3>Questions for the meeting</h3>{listed(meet["questions"])}</section>'
    prev=link(f'../module-{n-1:02}/','← Previous module') if n>1 else link('../syllabus.html','Syllabus')
    nxt=link(f'../module-{n+1:02}/','Next module →') if n<8 else link('../index.html','Course roadmap')
    handoff=f'<section class="next"><h2>{"Carry this forward" if n<8 else "After the defense"}</h2><p>{escape(m["handoff"])}</p><div class="links">{prev}{link(f"../stage-{stage:02}/","Stage overview")}{nxt}</div></section>'
    overview_link=link(f'../stage-{stage:02}/',f'Stage {stage:02} · {STAGES[stage-1][0]}')
    content=hero(f'CS 696 · Module {n:02} of 08',m["title"],m["goal"]) + f'<div class="entry"><p class="source">{overview_link}</p><p>{escape(m["bridge"])}</p></div>'+sections+seminar+lab+task+notebook+meeting+handoff
    return page(f"module-{n:02}/index.html",m["title"],content,True), json.dumps(nb,ensure_ascii=False,indent=1)+"\n"


def build(check=False):
    groups=catalog()
    files={"index.html":overview(groups),"syllabus.html":syllabus(groups)}
    for i,(_,mods) in enumerate(groups,1):
        files[f"stage-{i:02}/index.html"]=stage_page(i,groups)
        for m in mods:
            base=f'module-{m["n"]:02}/'
            files[base+"index.html"],files[base+"study.ipynb"]=module_resources(m)
    for rel, content in files.items():
        dest=COURSE/rel
        if check:
            if not dest.exists() or dest.read_text()!=content:
                raise SystemExit(f"Rebuild CS 696 resource {rel}")
        else:
            dest.parent.mkdir(parents=True,exist_ok=True)
            dest.write_text(content)
    print(f"CS 696 verified {len(files)} resources and executed all 40 notebook code cells.")


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check",action="store_true")
    build(parser.parse_args().check)
