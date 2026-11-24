"""Render the public CS 691 pages and notebooks from the four stage collections."""
import argparse
import json
from html import escape
from pathlib import Path
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / "courses/neurosymbolic-ai"
TEACHING = "https://kauroy1994.github.io/home/teaching/"
FORM = "https://docs.google.com/forms/d/e/1FAIpQLSe2GDpjTDzHb-GmQf8ll40fiDXSltLkmJhV0UKT2tPqFBBRuA/viewform"
FORM_MODULE = "entry.1150677641"
COURSE_NAME = "Neurosymbolic Artificial Intelligence"
STAGES = [
    ("Symbolic Knowledge Representation", "Turn a request into facts, connect the facts in a graph, and show why a rule applies.", "Which facts support a conclusion?", "A request", "Ava asks for camera C1.", "A recorded fact", "Requested(Ava, C1)", "An open question", "Has the desk handed it over?"),
    ("Neural–Symbolic Architectures", "Connect uncertain observations to rules, train with a constraint, and choose a feasible prediction.", "When can a learned score support a decision?", "An observation", "A photograph of camera C1", "A learned estimate", "A score for the presence of its lens cap", "A desk decision", "Check the score and reservation together."),
    ("LLMs and Knowledge-Grounded Reasoning", "Retrieve evidence, check a language model’s claims, and test whether a plan can reach its goal.", "Which part of a generated answer can the records support?", "A question", "Where should Ava pick up C1?", "Evidence to find", "The record for that camera and day", "An answer to check", "Does each claim have a source?"),
    ("Trustworthy and Applied Neurosymbolic AI", "Trace decisions through time, distinguish observation from intervention, and evaluate a hybrid workflow.", "What evidence would change your judgment?", "A recorded sequence", "An ID check and an equipment handoff", "A condition to test", "Did the check come first on the same request?", "A decision to audit", "Which records support the result?"),
]
TABS = [("overview", "Module overview"), ("slides", "Class slides"), ("lab", "Explore"), ("practice", "Exercises"), ("notebook", "Notebook"), ("office", "Office hours"), ("question", "Ask a question")]
RESOURCES = {"slides":"Classroom slides", "lab":"Interactive lab", "notebook":"Worked notebook", "office":"Virtual office hours"}
OUTCOMES = [
    "Represent a situation using facts, quantified rules and a knowledge graph. Trace a conclusion to its premises.",
    "Connect a learned score to a symbolic decision. Compare a training penalty with a constraint applied when choosing an output.",
    "Retrieve records, verify individual claims, and trace a plan from its starting facts to its goal.",
    "Evaluate a hybrid system on held-out cases, distinguish a causal assumption from an observation, and explain an administrative decision using source records.",
]


def read(name):
    return json.loads((COURSE / "data" / name).read_text())


def txt(s):
    return escape(str(s), quote=True)


def link(url, label, cls=""):
    return f'<a class="{cls}" href="{txt(url)}">{txt(label)}</a>'


def cta(url, label, variant=""):
    return link(url, label, ("tr-cta " + variant).strip())


def ul(strings):
    return "<ul>" + "".join(f"<li>{txt(s)}</li>" for s in strings) + "</ul>"


def panel(title, body, id=""):
    return f'<section class="tr-curr-panel" id="{id}"><h2>{txt(title)}</h2>{body}</section>' if id else f'<section class="tr-curr-panel"><h2>{txt(title)}</h2>{body}</section>'


def eyebrow(value):
    return f'<span class="tr-eyebrow">{txt(value)}</span>'


def shell(title, inside, depth, body_class="", scripts=(), css=()):
    rel = "../" * depth
    styles = [rel+"../ml-foundations/assets/curriculum.css",rel+"assets/course.css",*css]
    head = "".join(f'<link rel="stylesheet" href="{u}">' for u in styles)
    js = "".join(f'<script defer src="{u}"></script>' for u in scripts)
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#9E1B32"><title>CS 691 · {txt(title)} · TeachReach</title>{head}{js}</head>
<body class="tr-curriculum nesy {body_class}"><a class="skip" href="#main">Skip to content</a>{inside}</body></html>
'''


def header(depth, nav="", tools=""):
    rel="../"*depth
    return f'''<div class="tr-topline"></div><header class="tr-curr-header"><div class="tr-curr-top"><a class="tr-curr-brand" href="{rel}../../"><span class="tr-curr-mark">TR</span><span><small>Kaushik Roy, University of Alabama</small><strong>Teach<span>Reach</span></strong></span></a><nav class="tr-curr-links" aria-label="Course navigation">{link(rel+"../../","All courses")}{link(rel+"index.html","CS 691 course")}{link(rel+"syllabus.html","Full syllabus")}{tools}</nav></div>{nav}</header>'''


def footer(depth, more=""):
    rel="../"*depth
    return f'<footer class="tr-course-footer"><strong>Kaushik Roy, University of Alabama</strong><span>TeachReach · CS 691 · {COURSE_NAME}</span><nav aria-label="Footer">{link(rel+"../../","All courses")} {link(rel+"index.html","Course")} {link(rel+"syllabus.html","Syllabus")} {more}</nav></footer>'


def hero(label, title, desc, actions, illustration):
    return f'<section class="tr-curr-hero"><div>{eyebrow(label)}<h1>{txt(title)}</h1><p>{txt(desc)}</p><div class="tr-curr-hero-actions">{actions}</div></div><div class="tr-hero-art">{illustration}</div></section>'


def stage_evidence(stage):
    vals=STAGES[stage-1][3:]
    return '<div class="stage-evidence">'+''.join(f'<div><small>{txt(vals[i])}</small>{txt(vals[i+1])}</div>' for i in range(0,6,2))+'</div>'


def stage_nav(prefix):
    return '<nav class="tr-stage-nav" aria-label="Stage navigation">'+''.join(link(f'{prefix}stage-{i:02}/',f'Stage {i}') for i in range(1,5))+'</nav>'


def module_list(modules, prefix=""):
    return '<div class="tr-module-list">'+''.join(f'<a class="tr-module-entry" href="{prefix}module-{m["n"]:02}/"><span class="tr-module-num">{m["n"]:02}</span><span><h3>{txt(m["title"])}</h3><p>{txt(m["goal"])}</p></span><span class="tr-entry-arrow" aria-hidden="true">→</span></a>' for m in modules)+'</div>'


def read_card(r):
    return f'<h3>{txt(r["title"])}</h3><p>{txt(r["reading"])}</p><p>{link(r["url"],r["authors"]+" · Open the reading ↗")}</p><div class="worked"><h3>Connect the reading to your model</h3><p>{txt(r["task"])}</p>{details("Reveal a worked answer",r["answer"])}</div>'


def details(label, content):
    return f'<details><summary>{txt(label)}</summary><p>{txt(content)}</p></details>'


def stage_extra(i, prefix):
    entries={2:("constraint_training.ipynb","Train a neural model with a rule penalty"),3:("grounded_generation.ipynb","Run a language model on retrieved evidence")}
    if i not in entries: return ""
    file,label=entries[i]
    route=f"stage-{i:02}/{file}"
    return '<div class="controls">'+cta(prefix+route,"Download notebook · "+label,"outline")+cta(colab(route),"Run extension in Colab ↗","outline")+'</div>'


def colab(route):
    return "https://colab.research.google.com/github/kauroy1994/TeachReach/blob/main/courses/neurosymbolic-ai/"+route


def build_course(stages, readings):
    cards=''.join(f'<a class="tr-curr-card" href="stage-{i:02}/">{eyebrow(f"Stage {i} · Modules {4*i-3:02}–{4*i:02}")}<h3>{txt(s[0])}</h3><p>{txt(s[1])}</p><div class="tr-card-foot"><span>4 modules</span><span>Explore stage →</span></div></a>' for i,s in enumerate(STAGES,1))
    intro=hero("CS 691 · Special Topics",COURSE_NAME,"Ava asks to borrow a camera. A language model can read her request. How can the desk tell whether its response follows from the records and rules?",cta("module-01/","Begin with Module 01 →","inverse")+cta("syllabus.html","Read the syllabus","ghost"),stage_evidence(1))
    sections="".join(f'<section id="stage-{i:02}"><div class="tr-section-head"><div>{eyebrow(f"Stage {i}")}<h2>{txt(STAGES[i-1][0])}</h2></div>{cta(f"stage-{i:02}/","Stage overview →","outline")}</div>{module_list(ms)}</section>' for i,ms in enumerate(stages,1))
    body=header(0)+f'<main id="main" class="tr-curr-page wide">{intro}<nav class="tr-section-index">{link("#stages","Four stages")}{link("#modules","All 16 modules")}{link("syllabus.html#requirements","Course requirements")}{link("syllabus.html#grading","Practice and assessment")}</nav><section id="stages"><div class="tr-section-head"><h2>Four connected stages</h2></div><div class="tr-curr-grid">{cards}</div></section><div class="tr-section-head" id="modules"><h2>Course modules</h2></div>{sections}</main>'+footer(0)
    yield "index.html",shell(COURSE_NAME,body,0)
    orientation=panel("How to start","<p>Start with Module 01. You will need to read a short table and follow simple arithmetic. The first lesson introduces the logic notation. Each notebook shows the Python input and its output side by side. Use Colab or a local Python 3 notebook to change the examples.</p><p>Read the cells in order. A pair of values in parentheses keeps its order, a list groups entries, and <code>print</code> shows the result of a calculation. The core notebooks use the Python standard library. Two extension notebooks introduce PyTorch training and generation with a downloaded language model.</p>","requirements")
    grading=panel("Practice and assessment","<p>In each module, predict a result before revealing its explanation. Use the lab to change the evidence, then try the exercises on a fresh case. The practice is formative. At the end of each module, the instructor grades a separate in-class variant. You will solve a new case using the same skills and explain your reasoning.</p><p>A complete answer identifies the relevant inputs, applies the rule or model correctly, and states what the evidence supports. In the capstone, also test a boundary case and explain an error against a reference judgment.</p>","grading")
    source=panel("CS 691 at the University of Alabama",f'<p>Kaushik Roy taught CS 691 as a graduate special-topics course in Spring 2026. Nigel Glenday and Raj Krishnan were guest lecturers. This TeachReach edition develops the four published topic groups into a new sequence of worked lessons, practice cases, and notebooks.</p><p>{link(TEACHING,"Teaching record and course topics ↗")}</p>')
    papers=panel("Research connected to the course",'<p>In their NeSy 2026 paper, Himanshu Tripathi, Kaushik Roy, Subash Neupane, and Shahram Rahimi use a language model to normalize clinical terms and a fuzzy rule system to evaluate documented events. Stage 4 asks you to trace what happens when a term is mapped incorrectly.</p>'+link("https://arxiv.org/abs/2608.13617","Read the NeSy paper ↗")+'<p>The course page also lists a related medRxiv preprint by Tripathi, Roy, Rahimi, Neupane, and Sean Bozorgzad on graded sepsis bundle compliance.</p>'+link("https://doi.org/10.64898/2026.04.23.26351412","Read the related preprint ↗"),"research")
    seq="".join(panel(f"Stage {i} · {STAGES[i-1][0]}",module_list(ms)+link(f"stage-{i:02}/#reading","Stage reading and worked extension →")) for i,ms in enumerate(stages,1))
    intro=hero("CS 691 · Special Topics","Course syllabus","Work from a single recorded request to a hybrid system whose decisions you can inspect, test and explain.",cta("module-01/","Open Module 01 →","inverse"),stage_evidence(4))
    idx='<nav class="tr-section-index">'+''.join(link("#"+k,v) for k,v in [("requirements","Requirements"),("outcomes","Outcomes"),("roadmap","Module sequence"),("grading","Assessment"),("research","Research")])+'</nav>'
    body=header(0)+f'<main class="tr-curr-page" id="main">{intro}{idx}{orientation}{panel("Course outcomes",ul(OUTCOMES),"outcomes")}{grading}<section id="roadmap"><h2>Stage and module sequence</h2>{seq}</section>{source}{papers}</main>'+footer(0)
    yield "syllabus.html",shell("Full course syllabus",body,0)
    for i,ms in enumerate(stages,1):
        title,desc,question=STAGES[i-1][:3]
        intro=hero(f"CS 691 · Stage {i} · Modules {4*i-3:02}–{4*i:02}",title,desc,cta(f'../module-{ms[0]["n"]:02}/',"Begin this stage →","inverse"),stage_evidence(i))
        next_link=cta(f"../stage-{i+1:02}/",f"Continue to Stage {i+1} →") if i<4 else cta("../module-16/#practice","Open the capstone exercises →")
        body=header(1)+f'<main id="main" class="tr-curr-page">{stage_nav("../")}{intro}{panel(question,ul([m["goal"] for m in ms]))}<h2>Stage {i} modules</h2>{module_list(ms,"../")}{panel("Reading and extension",read_card(readings[i-1])+stage_extra(i,"../"),"reading")}{next_link}</main>'+footer(1)
        yield f"stage-{i:02}/index.html",shell(title,body,1)


def worked_code(s):
    return f'<div class="codebox"><button type="button" data-copy>Copy code</button><pre><code>{txt(s["code"])}</code></pre></div><details><summary>Reveal the output</summary><pre class="output">{txt(s["out"])}</pre></details>'


def exercises(items, hints=True):
    out=[]
    for i,e in enumerate(items,1):
        hint=details("Hint", e["hint"]) if hints else ""
        out.append(f'<article class="practice-card">{eyebrow(f"Question {i}")}<h3>{txt(e["q"])}</h3>{hint}{details("Reveal the worked answer",e["a"])}</article>')
    return "".join(out)


def assessment(d):
    options=''.join(f'<label class="choice"><input type="radio" name="answer" value="{i}"> {txt(o["text"])}</label>' for i,o in enumerate(d["options"]))
    feedback=''.join(f'<p data-feedback="{i}" hidden><b>{"Correct." if i==d["correct"] else "Try again."}</b> {txt(o["feedback"])}</p>' for i,o in enumerate(d["options"]))
    correct=d["options"][d["correct"]]
    return f'<form data-diagnostic data-module="{d["n"]}"><fieldset><legend>{txt(d["q"])}</legend>{options}</fieldset><div class="controls"><button class="tr-cta" type="submit">Check my answer</button></div><div role="status"><p data-needed hidden>Choose an answer first.</p>{feedback}</div>{details("Reveal the answer",correct["text"]+" "+correct["feedback"])}</form>'


def make_notebook(m, transition, trace):
    cells=[]
    def md(s): cells.append({"cell_type":"markdown","metadata":{},"source":s.splitlines(True)})
    md(f'# CS 691 · Module {m["n"]:02} · {m["title"]}\n\n{m["goal"]}\n\n**Before you begin.** {m["prereq"]}')
    def notebook_check(q,a):
        md(f"{q}\n\n<details><summary>Reveal the answer</summary>\n\n{a}\n\n</details>")
    notebook_check(transition["start_q"],transition["start_a"])
    for s in m["slides"]:
        md(f'## {s["title"]}\n\n{s["text"]}\n\n{s["example"]}\n\n**Predict before running the cell.** {s["q"]}')
        cells.append({"cell_type":"code","execution_count":None,"metadata":{},"outputs":[],"source":s["code"].splitlines(True)})
        md(f'<details><summary>Reveal output and explanation</summary>\n\n```text\n{s["out"]}\n```\n\n{s["a"]}\n\n</details>')
    md(f'## {trace["title"]}\n\n{trace["walkthrough"]}\n\n{trace["change"]}')
    cells.append({"cell_type":"code","execution_count":None,"metadata":{},"outputs":[],"source":m["slides"][trace["slide"]-1]["code"].splitlines(True)})
    md(f'<details><summary>Worked answer after your change</summary>\n\n{trace["expected"]}\n\n</details>')
    for i,e in enumerate(m["exercises"],1):
        md(f'## Exercise {i}\n\n{e["q"]}\n\n<details><summary>Hint</summary>\n\n{e["hint"]}\n\n</details>\n\n<details><summary>Worked answer</summary>\n\n{e["a"]}\n\n</details>')
    md(m["bridge"])
    notebook_check(transition["end_q"],transition["end_a"])
    return json.dumps({"cells":cells,"metadata":{"kernelspec":{"display_name":"Python 3","language":"python","name":"python3"},"language_info":{"name":"python"}},"nbformat":4,"nbformat_minor":4},ensure_ascii=False,indent=1)+"\n"


def build_module(m, d, transition, trace):
    n=m["n"]; stage=(n-1)//4+1; mid=f"{n:02}"; path=f"module-{mid}/"
    next_url=f"../module-{n+1:02}/" if n<16 else "../index.html"
    next_label=f"Continue to Module {n+1:02} →" if n<16 else "Return to the course roadmap →"
    prev_url=f"../module-{n-1:02}/" if n>1 else "../stage-01/"
    prev_label=f"← Module {n-1:02}" if n>1 else "← Stage 1"
    navlink=link(prev_url,prev_label)+" "+link(next_url,next_label)
    rel="../"
    scripts=[rel+"../ml-foundations/assets/curriculum.js",rel+"assets/learning.js"]
    tabs='<nav class="tr-curr-tabs site-nav" id="siteNav" role="tablist" aria-label="Module sections">'+''.join(f'<button type="button" id="tab-{k}" role="tab" aria-controls="panel-{k}" data-tab="{k}" class="{"tr-ask" if k=="question" else ""}">{v}</button>' for k,v in TABS)+'</nav>'
    tools=link(f"../stage-{stage:02}/",f"Stage {stage}")+'<button id="lowDataToggle" type="button" aria-pressed="false">Low-data mode</button><button type="button" class="menu-toggle" id="menuToggle" aria-controls="siteNav" aria-expanded="false">Menu</button>'
    illustration='<div class="stage-evidence">'+eyebrow(trace["title"])+''.join(f'<div><small>{txt(step["label"])}</small>{txt(step["value"])}</div>' for step in trace["steps"])+'</div>'
    intro=hero(f"CS 691 · Stage {stage} · Module {mid}",m["title"],m["goal"],cta("#slides","Begin classroom slides →","inverse")+cta("#lab","Open the lab","ghost"),illustration)
    shortcuts=[("slides","Attend the lesson"),("lab","Explore a case"),("practice","Practice exercises"),("notebook","Run the examples"),("office","Visit office hours")]
    quick='<nav class="tr-section-index" aria-label="Learning tools">'+''.join(link("#"+k,label) for k,label in shortcuts)+'</nav>'
    outline='<ol>'+''.join('<li>'+link(f'slides.html#{i}',s['title'])+'</li>' for i,s in enumerate(m['slides'],2))+'</ol>'
    prev=link(prev_url,prev_label)
    portrait='<div class="portrait"><img src="../../ml-foundations/module-01/assets/professor_portrait.png" alt="Professor Kaushik Roy" width="74" height="86"><div><strong>Virtual office hours with Professor Roy</strong><p>'+link("#office","Browse this module’s FAQ →")+'</p></div></div>'
    panels={"overview":intro+quick+panel("Before you begin",f'<p>{txt(m["prereq"])}</p>{prev}')+panel("What you will work through",outline)+panel("Office hours",portrait)+panel("From this module to the next" if n<16 else "After the capstone",f'<p>{txt(m["bridge"])}</p>{cta(next_url,next_label,"outline")}')}
    descriptions={"slides":"Use the arrows to advance. Each concept has a check with a worked answer.","lab":"Choose a case, predict the result, then inspect what changes in the stage experiment.","notebook":"Read each example, predict its output and run it in the Python notebook.","office":"Choose a question to read the explanation or listen to it."}
    ipynb="CS691_Module_"+mid+".ipynb"
    for key,title in RESOURCES.items():
        extra=""
        if key=="notebook": extra=cta(ipynb,"Download .ipynb","outline")+cta(colab(path+ipynb),"Run in Colab ↗","outline")
        if key=="slides": extra=link("slides.html#7","End-of-module questions")+" · "+link("slides.html#8","Closing slide")
        if key=="notebook" and n in (7,8,10,12): extra+=stage_extra(stage,"../")
        if key=="office": extra=cta("#question","Ask a new question","outline")
        panels[key]=f'<div class="tr-curr-panel"><div class="embed-header"><div>{eyebrow(f"CS 691 · Module {mid}")}<h2>{title}</h2><p>{descriptions[key]}</p></div><div class="controls"><button type="button" class="tr-cta outline" data-full="frame-{key}">Full screen</button><a class="tr-cta outline" href="{key}.html" target="_blank" rel="noopener">Open in new tab ↗</a></div></div><div class="controls">{extra}</div><iframe class="frame" id="frame-{key}" data-src="{key}.html?embed=1" title="Module {mid} {title}" allowfullscreen></iframe></div>'
    practice=panel("Check your understanding",assessment(d))+panel("End-of-module exercises",'<p>Try each question before opening the hint or worked answer. The in-class variant asks you to apply the same skills to a new case. '+link("../syllabus.html#grading","Assessment details →")+'</p>'+exercises(m["exercises"]))
    panels["practice"]=practice
    form=FORM+"?"+urlencode({"usp":"pp_url",FORM_MODULE:f"CS 691 · Module {mid}"})
    panels["question"]=panel("Ask a question",f'<p>Ask about a slide, example, or exercise in Module {mid}. Your question goes to Professor Roy’s CS 691 register. Return to this module’s FAQ for the answer.</p><div class="controls">{link(form,"Open the form in a new tab ↗","form-link")} {link("#office","Browse the FAQ")}</div><iframe class="question-frame" data-src="{txt(form)}&amp;embedded=true" title="Submit a question for CS 691 Module {mid}" loading="lazy"></iframe>')
    content=''.join(f'<section data-section="{k}" id="panel-{k}" role="tabpanel" aria-labelledby="tab-{k}" {"" if k=="overview" else "hidden"}>{panels[k]}</section>' for k,v in TABS)
    body=header(1,tabs,tools)+f'<main class="tr-curr-page" id="main">{content}</main>'+footer(1,navlink)
    yield path+"index.html",shell(f"Module {mid} · {m['title']}",body,1,scripts=scripts)
    yield path+ipynb,make_notebook(m,transition,trace)
    def resource(key,body,extra_css=(),extra_js=()):
        bar=f'<header class="resource-bar"><div class="title"><small>TeachReach · CS 691 · Module {mid}</small>{txt(m["title"])}</div>{link("index.html#"+key,"← Module "+mid)}<button class="tr-cta outline" type="button" data-full>Full screen</button></header>'
        return shell(f"{RESOURCES[key]} · {m['title']}",bar+body,1,"deck" if key=="slides" else "",[rel+"assets/learning.js",*extra_js],extra_css)

    def check(q,a):
        return f'<h3>Check your understanding</h3><p>{txt(q)}</p>{details("Reveal the answer",a)}'
    slide_bodies=[f'<h1>{txt(m["title"])}</h1><p>{txt(m["goal"])}</p><div class="worked"><h3>Before you begin</h3><p>{txt(m["prereq"])}</p></div><h3>Lesson outline</h3>{outline}'+check(transition["start_q"],transition["start_a"])]
    for s in m["slides"]:
        slide_bodies.append(f'<h1>{txt(s["title"])}</h1><p>{txt(s["text"])}</p><div class="worked"><h3>Worked example</h3><p>{txt(s["example"])}</p></div><details data-example><summary>Show the Python example</summary>{worked_code(s)}</details><h3>Check your understanding</h3><p>{txt(s["q"])}</p>{details("Reveal the answer",s["a"])}')
    specimen=m["slides"][trace["slide"]-1]
    slide_bodies.append(f'<h1>{txt(trace["title"])}</h1><p>{txt(trace["walkthrough"])}</p>{worked_code(specimen)}{check(trace["change"],trace["expected"])}')
    deck_next=f"../module-{n+1:02}/slides.html#1" if n<16 else next_url
    slide_bodies+=[f'<h1>End-of-module questions</h1>{exercises(m["exercises"],False)}',f'<h1>{"From this module to the next" if n<16 else "What your audit can support"}</h1><p>{txt(m["bridge"])}</p>'+check(transition["end_q"],transition["end_a"])+f'<div class="controls">{cta(deck_next,next_label)}{cta("index.html#practice","Open exercises","outline")}</div>']
    slide_titles=["Start here",*[s["title"] for s in m["slides"]],trace["title"],"End-of-module questions","Module transition" if n<16 else "After the capstone"]
    slide_bodies[0]=slide_bodies[0].replace('href="slides.html#','href="#')
    slides=''.join(f'<article data-slide="{i}" {"" if i==1 else "hidden"}>{eyebrow(f"CS 691 · Module {mid} · Slide {i} of 8")}{v}</article>' for i,v in enumerate(slide_bodies,1))
    menu='<dialog id="outline"><h2>All slides</h2><nav class="outline-list">'+''.join(link(f"#{i}",f"{i}. {t}") for i,t in enumerate(slide_titles,1))+'</nav><button type="button" class="tr-cta outline" data-close>Close</button></dialog>'
    slidefoot='<footer class="deck-foot"><div class="controls"><button type="button" data-outline class="tr-cta outline">All slides</button>'+link("office.html","Office hours")+'</div><div class="controls"><button type="button" class="tr-cta outline" id="back">← Back</button><span id="slide-count" aria-live="polite"></span><button type="button" class="tr-cta" id="next">Next →</button></div></footer>'
    yield path+"slides.html",resource("slides",'<main id="main" class="resource-body">'+slides+'</main>'+menu+slidefoot)

    options=''.join(f'<option value="{i}">{i+1}. {txt(c["label"])}</option>' for i,c in enumerate(m["lab"]))
    cases=''.join(f'<article data-case="{i}" {"" if i==0 else "hidden"}><h3>{txt(c["label"])}</h3><div class="worked">{txt(c["input"])}</div><p>{txt(c["q"])}</p>{details("Reveal the result and reasoning",c["a"])}</article>' for i,c in enumerate(m["lab"]))
    lab=f'<main id="main" class="resource-body"><h1>Explore a case</h1><label for="case-choice">Choose a case </label><select id="case-choice">{options}</select>{cases}<hr><p>{eyebrow(f"Stage {stage} · Shared experiment")}</p><div data-stage-lab="{stage}"></div></main>'
    yield path+"lab.html",resource("lab",lab,["../assets/labs.css"],["../assets/interactive-labs.js"])
    cells=''.join(panel(s["title"],f'<p>{txt(s["text"])}</p><div class="worked">{txt(s["example"])}</div>{worked_code(s)}<p>{txt(s["q"])}</p>{details("Reveal the reasoning",s["a"])}') for s in m["slides"])
    change=panel(trace["title"],f'<p>{txt(trace["walkthrough"])}</p>{worked_code(specimen)}{check(trace["change"],trace["expected"])}')
    book=f'<main id="main" class="resource-body"><h1>Worked notebook</h1><p>{txt(m["goal"])}</p><div class="controls">{cta(colab(path+ipynb),"Run in Colab ↗")}{cta(ipynb,"Download notebook","outline")}</div>{cells}{change}{panel("Try it yourself",exercises(m["exercises"]))}</main>'
    yield path+"notebook.html",resource("notebook",book)
    faqs=''.join(f'<details data-faq id="faq-{i}"><summary>{txt(v["q"])}</summary><p>{txt(v["a"])}</p><div class="controls"><button type="button" class="tr-cta outline" data-listen>Listen</button><button type="button" class="tr-cta outline" data-stop>Stop</button>{link(f"#faq-{i}","Link to this answer")}</div></details>' for i,v in enumerate(m["faq"],1))
    office=f'<main id="main" class="resource-body"><div class="portrait"><img src="../../ml-foundations/module-01/assets/professor_portrait.png" alt="Professor Kaushik Roy"><div>{eyebrow(f"CS 691 · Module {mid}")}<h1>Virtual office hours</h1></div></div><p>Choose a question about {txt(m["title"].rstrip("."))}.</p><label for="faq-search">Search this FAQ </label><input type="search" id="faq-search">{faqs}<p id="no-faq" hidden>No matching question. Try a shorter phrase or ask below.</p>{cta("index.html#question","Ask a new question →","outline")}</main>'
    yield path+"office.html",resource("office",office)


def generate():
    from site_navigation import add_navigation
    for name,content in course_files():
        if name.endswith(".html"):
            content=add_navigation("courses/neurosymbolic-ai/"+name,content)
        yield name,content


def course_files():
    stages=[read(f"stage-{i:02}.json") for i in range(1,5)]
    diagnostics=read("diagnostics.json")
    readings=read("readings.json")
    transitions=read("transitions.json")
    traces=read("traces.json")
    for collection in (traces,transitions):
        assert [v["n"] for v in collection]==list(range(1,17))
    assert [r["stage"] for r in readings]==list(range(1,5))
    assert [m["n"] for ms in stages for m in ms]==[d["n"] for d in diagnostics]==list(range(1,17))
    yield from build_course(stages,readings)
    for ms in stages:
        assert len(ms)==4
        for m in ms:
            assert len(m["slides"])==4 and len(m["exercises"])>=3 and len(m["lab"])>=3 and len(m["faq"])>=2
            i=m["n"]-1
            yield from build_module(m,diagnostics[i],transitions[i],traces[i])


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check",action="store_true",help="fail if the published pages differ from their source")
    args=parser.parse_args()
    wrong=[]
    for name,content in generate():
        path=COURSE/name
        if args.check:
            if not path.is_file() or path.read_text()!=content: wrong.append(name)
        else:
            path.parent.mkdir(parents=True,exist_ok=True)
            path.write_text(content)
    if wrong: raise SystemExit("Rebuild CS 691 pages and notebooks: "+", ".join(wrong))
