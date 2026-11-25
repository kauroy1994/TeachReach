"""Shared site navigation and a static directory drawn from the course catalogs."""
from html import escape
import json
import posixpath
from pathlib import Path, PurePosixPath
import re

from office_tutor import add_office_tutor

ROOT = Path(__file__).resolve().parents[1]
CODES = {"ml-foundations": "CS 483/583", "neurosymbolic-ai": "CS 691", "research-mentoring": "CS 696"}


def add_navigation(page, html):
    page = PurePosixPath(page)
    html = add_office_tutor(page, html)
    def url(path):
        return posixpath.relpath(path, page.parent)
    def anchor(path, label):
        return f'<a target="_top" href="{url(path)}">{label}</a>'
    links = [anchor("index.html", "TeachReach Home"), anchor("navigate.html", "Find a lesson")]
    if page.parts[0] == "courses":
        course = page.parts[1]
        links.append(anchor(f"courses/{course}/index.html", CODES[course]))
        if page.parent.name.startswith("module-") and page.name != "index.html":
            links.append(anchor(str(page.parent / "index.html"), "Module "+page.parent.name[-2:]))
    bar = '<nav id="tr-global-nav" aria-label="TeachReach navigation">' + "".join(links) + '</nav>'
    head = f'<link rel="stylesheet" href="{url("assets/navigation.css")}"><script defer src="{url("assets/navigation.js")}"></script>'
    if 'id="tr-global-nav"' in html: return html
    return re.sub(r'(<body\b[^>]*>)', lambda m:m[0]+bar,html.replace("</head>",head+"</head>",1), count=1, flags=re.I)


def directory():
    from build_neurosymbolic import STAGES, read, TABS
    from build_mentoring import catalog, ACTIVITIES
    source=(ROOT/"courses/ml-foundations/assets/curriculum-data.js").read_text()
    ml=json.loads(source.split("window.TEACHREACH_CURRICULUM=")[1].strip().removesuffix(";"))
    stages={"ml-foundations":[(s["name"],[m for m in ml["modules"] if m["stage"]==s["id"]]) for s in ml["stages"]],
            "neurosymbolic-ai":[(s[0],read(f"stage-{i:02}.json")) for i,s in enumerate(STAGES,1)],
            "research-mentoring":catalog()}
    sections=[]
    for course, groups in stages.items():
        prefix=f"courses/{course}/"
        name={"ml-foundations":"Machine Learning Foundations", "neurosymbolic-ai":"Neurosymbolic Artificial Intelligence", "research-mentoring":"Graduate Research Mentoring"}[course]
        rows=[]
        for i,(stage,modules) in enumerate(groups,1):
            cards=[]
            for m in modules:
                n=m["n"]
                module=f"{prefix}module-{n:02}/"
                available=m.get("status","available")=="available"
                resources=[]
                if available:
                    for key,label in (ACTIVITIES if course=="research-mentoring" else TABS[1:]):
                        if course=="ml-foundations" and n==1 and key=="lab": key="learn"
                        resources.append(f'<a href="{module}#{key}">{label}</a>')
                else: resources.append('<span>Syllabus preview</span>')
                cards.append(f'<article data-lesson><h4><a href="{module}">{n:02} · {escape(m["title"])}</a></h4><div class="destinations">{"".join(resources)}</div></article>')
            rows.append(f'<section data-group="{i}"><h3><a href="{prefix}stage-{i:02}/">Stage {i} · {escape(stage)}</a></h3>{"".join(cards)}</section>')
        sections.append(f'<section data-course="{course}" id="{course}"><h2>{CODES[course]} · {name}</h2><div class="destinations"><a href="{prefix}">Course overview</a><a href="{prefix}syllabus.html">Full syllabus</a></div>{"".join(rows)}</section>')
    return add_navigation("navigate.html",'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Find a lesson · TeachReach</title><link rel="stylesheet" href="assets/portal.css"></head><body><main class="lesson-directory"><h1>Find a lesson</h1><p>Open a course, stage, module, or activity directly.</p><div class="directory-tools" hidden><label>Course <select id="course-filter"><option value="">All courses</option><option value="ml-foundations">CS 483/583</option><option value="neurosymbolic-ai">CS 691</option><option value="research-mentoring">CS 696</option></select></label><label>Stage <select id="stage-filter"><option value="">All stages</option><option value="1">Stage 1</option><option value="2">Stage 2</option><option value="3">Stage 3</option><option value="4">Stage 4</option></select></label><label>Find by title or module number <input id="lesson-search" type="search" placeholder="e.g. probability or 03"></label><button type="button" id="clear-filters">Clear filters</button></div><p id="lesson-count" role="status"></p>'''+''.join(sections)+'</main></body></html>\n')


if __name__=="__main__":
    (ROOT/"navigate.html").write_text(directory())
