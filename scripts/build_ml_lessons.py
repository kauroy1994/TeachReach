"""Build Modules 04–16 from the course catalog and the worked lessons."""
import argparse
import json
from xml.etree import ElementTree
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path
from urllib.parse import urlencode

from build_neurosymbolic import TABS, RESOURCES, cta, details, exercises, eyebrow, hero, link, panel, txt, ul, worked_code
from site_navigation import ROOT, add_navigation

COURSE = ROOT / "courses/ml-foundations"
SHARED = "../../neurosymbolic-ai/assets/"
FORM = "https://docs.google.com/forms/d/e/1FAIpQLSdwjuFTk3H_5CCgNvy9NUylOrx1xhQ9ri7PaIKw8rAAf7P-Pw/viewform"
FORM_TOPICS = ["Generalization","Regression and Classification","Classical Models","Clustering and PCA","Neural Networks","Deep Representations","Self-Supervision","Attention and Transformers","Language Models","Generative Models","Reinforcement Learning","Trustworthy ML","Capstone"]


# The worked example illustrated on the module overview and in the deck.
FIGURE_LESSONS = {4:4, 5:5, 6:6, 7:6, 8:3, 9:2, 10:5, 11:7, 12:6, 13:6, 14:3, 15:2, 16:6}
TOOL_ICONS = {"slides":"▣", "lab":"◇", "practice":"✓", "notebook":"⌘", "office":"◎"}

# Lesson numbers where an experiment directly tests the worked example.
LAB_LESSONS = {4:(4,5),5:(3,5),6:(4,6),7:(3,6),8:(2,5),9:(2,8),10:(4,6),11:(5,7),12:(6,5),13:(3,8),14:(4,7),15:(2,6),16:(5,8)}

# One worked lesson follows each FAQ answer; indices refer to the module's numbered outline.
FAQ_LESSONS = {
    4:(2,5,6), 5:(4,5,8), 6:(2,6,8,9), 7:(6,7,3,5), 8:(5,6,2,7),
    9:(3,5,7,6), 10:(1,8,8,5), 11:(4,7,9), 12:(2,7,4),
    13:(4,5,7), 14:(3,5,7), 15:(4,3,8), 16:(5,7,9,8)
}

def catalog():
    text = (COURSE / "assets/curriculum-data.js").read_text()
    return json.loads(text.split("window.TEACHREACH_CURRICULUM=")[1].strip().removesuffix(";"))


def check(q,a):
    return f'<h3>Check your understanding</h3><p>{txt(q)}</p>{details("Reveal answer",a)}'


def variant(s):
    return f'<div class="worked"><h3>Worked example</h3><p>{txt(s["worked"])}</p></div><h3>Formal notation</h3><p>{txt(s["notation"])}</p>'


def notebook(m,meta):
    cells=[]
    def md(text):
        cells.append(dict(cell_type="markdown",metadata={},source=text.splitlines(True)))
    def solution(q,a):
        md(f"{q}\n\n<details><summary>Reveal answer</summary>\n\n{a}\n\n</details>")
    md(f'# CS 483/583 · Module {m["n"]:02} · {meta["title"]}\n\n{m["opening"]}\n\n{m["recall"]}')
    md("## Running the examples\n\nUse a Python 3 notebook with PyTorch installed. A CPU is sufficient. Run the cells in order, then change an input and predict what will happen.")
    solution(m["recallQ"],m["recallA"])
    for i,s in enumerate(m["lessons"],1):
        md(f'## {s["title"]}\n\n{s["explain"]}\n\n{s["worked"]}\n\n**Formal notation.** {s["notation"]}\n\n**Predict before you run.** {s["q"]}')
        cells.append(dict(cell_type="code",execution_count=i,metadata={},source=s["code"].splitlines(True),outputs=[dict(output_type="stream",name="stdout",text=(s["out"]+"\n").splitlines(True))]))
        solution("Compare your reasoning with the worked answer.",s["a"])
    for i,e in enumerate(m["exercises"],1):
        md(f'## Exercise {i}\n\n{e["q"]}\n\n<details><summary>Hint</summary>\n\n{e["hint"]}\n\n</details>')
        solution("Check your work.",e["a"])
    md(m["bridge"]);solution(m["bridgeQ"],m["bridgeA"])
    return json.dumps(dict(cells=cells,metadata={"kernelspec":{"display_name":"Python 3","language":"python","name":"python3"},"language_info":{"name":"python"}},nbformat=4,nbformat_minor=4),ensure_ascii=False,indent=1)+"\n"


def render(m,meta,stages):
    n=m["n"]; num=f"{n:02}"; module="module-"+num
    stage=meta["stage"]; stage_url=f"../stage-{stage:02}/"
    title=meta["title"]; prev=f"../module-{n-1:02}/"
    nxt=f"../module-{n+1:02}/" if n<16 else "../index.html"
    next_label=f"Continue to Module {n+1:02} →" if n<16 else "Return to course overview →"
    prefix=f"CS 483/583 · Module {num}"
    book=f"ML_Foundations_Module{num}.ipynb"
    colab=f"https://colab.research.google.com/github/kauroy1994/TeachReach/blob/main/courses/ml-foundations/{module}/{book}"
    lessons=m["lessons"]
    total=len(lessons)+3
    def page(name,body,cls="",scripts=()):
        styles=["../assets/curriculum.css",SHARED+"course.css","../assets/ml-lessons.css"]
        head="".join(f'<link rel="stylesheet" href="{u}">' for u in styles)
        js="".join(f'<script defer src="{u}"></script>' for u in [*scripts,SHARED+"learning.js"])
        html=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#9e1b32"><title>{prefix} · {txt(title)} · {name}</title>{head}{js}</head><body data-tr-module="{num}" class="tr-curriculum nesy ml-lesson {cls}"><a class="skip" href="#main">Skip to content</a>{body}</body></html>'''
        return add_navigation(f"courses/ml-foundations/{module}/{name if name!='Overview' else 'index'}.html",html)+"\n"
    def resource(key,body,cls="",scripts=()):
        bar=f'<header class="resource-bar"><div class="title"><small>TeachReach · {prefix}</small>{txt(title)}</div>{link("index.html#"+key,"← Module "+num)}<button type="button" class="tr-cta outline" data-full>Full screen</button></header>'
        return page(key,bar+body,cls,scripts)
    def wrap(content):
        return '<main id="main" class="resource-body">'+content+'</main>'
    outline='<ol>'+''.join('<li>'+link(f'slides.html#{i}',s["title"])+'</li>' for i,s in enumerate(lessons,2))+'</ol>'
    tabs='<nav id="siteNav" class="tr-curr-tabs" role="tablist" aria-label="Module activities">'+''.join(f'<button type="button" id="tab-{key}" data-tab="{key}" role="tab" aria-controls="section-{key}">{label}</button>' for key,label in TABS)+'</nav>'
    brand='<a class="tr-curr-brand" href="../../../"><span class="tr-curr-mark">TR</span><span><small>Kaushik Roy, University of Alabama</small><strong>Teach<span>Reach</span></strong></span></a>'
    top=link("../index.html","Course roadmap")+link(stage_url,f"Stage {stage}")+link("../syllabus.html","Syllabus")+'<button id="lowDataToggle" type="button">Low-data mode</button><button id="menuToggle" class="menu-toggle" type="button" aria-controls="siteNav" aria-expanded="false">Menu</button>'
    header=f'<header class="tr-curr-header"><div class="tr-curr-top">{brand}<nav class="tr-curr-links" aria-label="Course navigation">{top}</nav></div>{tabs}</header>'
    graphic = f"figures/{module}.svg"
    diagram = ElementTree.parse(COURSE / graphic).getroot()
    description = diagram.findtext("{http://www.w3.org/2000/svg}desc")
    illustration = f'<img class="ml-concept-figure" src="../{graphic}" alt="{txt(description)}">'
    art = f'<a class="ml-figure-link" href="slides.html#{FIGURE_LESSONS[n]+1}" aria-label="Open the illustrated worked example">{illustration}</a>'
    shortcuts = '<nav class="ml-tool-cards" aria-label="Learning tools">' + "".join(
        f'<a href="#{key}"><span aria-hidden="true">{TOOL_ICONS[key]}</span>{txt(label)}</a>'
        for key, label in TABS[1:6]) + '</nav>'
    intro=hero(f"{prefix} · Stage {stage}",title,m["opening"],cta("#slides","Begin classroom slides →","inverse")+cta("#lab","Open the lab","ghost"),art)
    portrait='<div class="portrait"><img src="../module-01/assets/professor_portrait.png" alt="Professor Kaushik Roy"><div><strong>Virtual office hours with Professor Roy</strong><p>'+link("#office","Browse this module’s FAQ →")+'</p></div></div>'
    panels={"overview":intro+shortcuts+panel("Where this lesson begins",f'<p>{txt(m["recall"])}</p>'+link(prev,f"Revisit Module {n-1:02}"))+panel("Learning outcomes",f'<p data-catalog-field="summary">{txt(meta["summary"])}</p>'+ul(meta["outcomes"]))+panel("Lesson outline",outline)+panel("Office hours",portrait)+panel("After this module",f'<p>{txt(m["bridge"])}</p>'+cta(nxt,next_label,"outline"))}
    for key,label in RESOURCES.items():
        toolbar=f'<button type="button" class="tr-cta outline" data-full="frame-{key}">Full screen</button><a class="tr-cta outline" href="{key}.html" target="_blank" rel="noopener">Open in new tab ↗</a>'
        shortcuts={"slides":link(f"slides.html#{total-1}","End-of-module questions")+" · "+link(f"slides.html#{total}","Closing slide"),"lab":" · ".join(link(f"lab.html#experiment-{i}",v) for i,v in enumerate(meta["labs"],1)),"office":link("#question","Ask a question"),"notebook":cta(colab,"Run in Colab ↗","outline")+cta(book,"Download notebook","outline")}
        panels[key]=f'<div class="tr-curr-panel"><div class="embed-header"><div>{eyebrow(prefix)}<h2>{label}</h2></div><div class="controls">{toolbar}</div></div><div class="controls">{shortcuts[key]}</div><iframe id="frame-{key}" class="frame" title="{prefix} {label}" data-src="{key}.html?embed=1" allowfullscreen></iframe></div>'
    panels["practice"]=panel("Practice before the in-class assessment",'<p>Try each question, then use the hint or reveal the worked answer. The instructor grades a new in-class variant at the end of this module.</p>'+ul(meta["assessment"])+link("../syllabus.html#grading","Assessment information"))
    if "diagnostic" in m:
        from build_neurosymbolic import assessment
        panels["practice"]+=panel("Check your understanding",assessment({**m["diagnostic"],"n":n}))
    panels["practice"]+=panel("End-of-module exercises",exercises(m["exercises"]))
    form=FORM+"?"+urlencode({"usp":"pp_url","entry.2083969021":f"Module {num} · "+FORM_TOPICS[n-4]})
    panels["question"]=panel("Ask a question",f'<p>Send Professor Roy a question about this module. Include the slide, exercise, or calculation you were working through.</p>{link(form,"Open the form in a new tab","form-link")} · {link("#office","Browse the FAQ")}<iframe class="question-frame" title="Submit a question for Module {num}" loading="lazy" data-src="{txt(form)}&amp;embedded=true"></iframe>')
    sections="".join(f'<section id="section-{k}" aria-labelledby="tab-{k}" role="tabpanel" data-section="{k}" {"" if k=="overview" else "hidden"}>{panels[k]}</section>' for k,_ in TABS)
    footer=f'<footer class="tr-course-footer"><strong>Kaushik Roy, University of Alabama</strong><span>{prefix}</span><nav>{link("../../../index.html","TeachReach Home")} {link("../index.html","Course modules")} {link(prev,f"← Module {n-1:02}")} {link(nxt,next_label)}</nav></footer>'
    yield "index.html",page("Overview",header+f'<main class="tr-curr-page" id="main">{sections}</main>'+footer,scripts=["../assets/curriculum.js"])
    yield book,notebook(m,meta)
    slides=[("Start here",f'<h1>{txt(title)}</h1><p>{txt(m["opening"])}</p><p>{txt(m["recall"])}</p>'+check(m["recallQ"],m["recallA"]))]
    cells=[]
    lab_scripts=[f"../labs/module-{num}.js","../assets/ml-plots.js","../assets/ml-lab.js"]
    for lesson_number,s in enumerate(lessons,1):
        core=f'<p>{txt(s["explain"])}</p>'+variant(s)
        if lesson_number == FIGURE_LESSONS[n]:
            core += illustration
        experiment=""
        if lesson_number in LAB_LESSONS[n]:
            index=LAB_LESSONS[n].index(lesson_number)
            experiment=f'<details class="inline-lab"><summary>Try the interactive lab</summary><div data-experiment="{index}"></div></details>'
        slides.append((s["title"],f'<h1>{txt(s["title"])}</h1>{core}<details data-example><summary>Show the Python example</summary>{worked_code(s)}</details>{experiment}'+check(s["q"],s["a"])))
        cells.append(panel(s["title"],core+worked_code(s)+check(s["q"],s["a"])))
    closing="From this module to the next" if n<16 else "Defend your capstone"
    slides.extend([("End-of-module questions",'<h1>End-of-module questions</h1>'+exercises(m["exercises"],False)),(closing,f'<h1>{closing}</h1><p>{txt(m["bridge"])}</p>'+check(m["bridgeQ"],m["bridgeA"])+cta(nxt+"slides.html#1" if n<16 else nxt,next_label))])
    deck="".join(f'<article data-slide="{i}" {"" if i==1 else "hidden"}>{eyebrow(f"{prefix} · Slide {i} of {total}")}{content}</article>' for i,(_,content) in enumerate(slides,1))
    menu='<dialog id="outline"><h2>All slides</h2><nav class="outline-list">'+''.join(link(f"#{i}",f"{i}. {name}") for i,(name,_) in enumerate(slides,1))+'</nav><button type="button" class="tr-cta outline" data-close>Close</button></dialog>'
    foot='<footer class="deck-foot"><div class="controls"><button type="button" class="tr-cta outline" data-outline>All slides</button>'+link("office.html","Office hours")+'</div><div class="controls"><button type="button" class="tr-cta outline" id="back">← Back</button><span id="slide-count" aria-live="polite"></span><button type="button" class="tr-cta" id="next">Next →</button></div></footer>'
    yield "slides.html",resource("slides",wrap(deck)+menu+foot,"deck",scripts=lab_scripts)
    yield "notebook.html",resource("notebook",wrap(f'<h1>Worked notebook</h1><p>{txt(m["opening"])}</p><div class="controls">{cta(colab,"Run in Colab ↗")}{cta(book,"Download notebook","outline")}</div>'+''.join(cells)+panel("Practice",exercises(m["exercises"]))))
    yield "lab.html",resource("lab",wrap('<h1>Interactive lab</h1>'+''.join(f'<section class="tr-curr-panel" id="experiment-{i}"><h2>{txt(v)}</h2><div data-experiment="{i-1}"></div></section>' for i,v in enumerate(meta["labs"],1))),scripts=lab_scripts)
    items=[]
    for i,(item,lesson_index) in enumerate(zip(m["faq"],FAQ_LESSONS[n],strict=True),1):
        example=lessons[lesson_index-1]
        practice=(f'<details><summary>Work through an example</summary><h3>{txt(example["title"])}</h3>'
                  f'<p>{txt(example["worked"])}</p>{worked_code(example)}'
                  +check(example["q"],example["a"])+link(f"slides.html#{lesson_index+1}","Open the lesson")+'</details>')
        items.append(f'<details data-faq id="faq-{i}"><summary>{txt(item["q"])}</summary><p>{txt(item["a"])}</p><div class="controls"><button type="button" class="tr-cta outline" data-listen>Listen</button><button type="button" class="tr-cta outline" data-stop>Stop</button>{link(f"#faq-{i}","Link to this answer")}</div>{practice}</details>')
    faq="".join(items)
    yield "office.html",resource("office",wrap('<div class="portrait"><img src="../module-01/assets/professor_portrait.png" alt="Professor Kaushik Roy"><div>'+eyebrow(prefix)+'<h1>Virtual office hours</h1></div></div><label for="faq-search">Search this FAQ </label><input id="faq-search" type="search">'+faq+'<p id="no-faq" hidden>No matching question. Try another phrase or ask below.</p>'+cta("index.html#question","Ask a question","outline")))


def build(check_only=False,execute=False):
    catalog_data=catalog()
    diagnostics=json.loads((COURSE/"content/diagnostics.json").read_text())
    for meta in catalog_data["modules"][3:]:
        file=COURSE/"content"/(meta["id"]+".json")
        m=json.loads(file.read_text())
        m["diagnostic"]=diagnostics[f'{m["n"]:02}']
        assert m["n"]==meta["n"] and len(m["lessons"])>=7 and len(m["exercises"])>=5
        if execute:
            import torch
            torch.set_num_threads(1)
            for s in m["lessons"]:
                buffer=StringIO()
                with redirect_stdout(buffer):
                    exec(compile(s["code"],str(file),"exec"),{})
                s["out"]=buffer.getvalue().rstrip()
                if not s["out"]:raise ValueError(f"No output in {file}: {s['title']}")
            file.write_text(json.dumps({k:v for k,v in m.items() if k!="diagnostic"},ensure_ascii=False,indent=2)+"\n")
        for name,contents in render(m,meta,catalog_data["stages"]):
            dest=COURSE/meta["id"]/name
            if check_only:
                if not dest.is_file() or dest.read_text()!=contents:raise SystemExit(f"Rebuild {dest}")
            else: dest.write_text(contents)


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check",action="store_true")
    parser.add_argument("--execute",action="store_true",help="run each code cell in a fresh namespace and refresh its displayed output")
    args=parser.parse_args()
    build(args.check,args.execute)
