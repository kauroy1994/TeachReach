"""Check the static CS 691 release, internal routes and reproducible Python examples."""
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path
from urllib.parse import urlsplit, parse_qs, unquote
import json
import sys

from build_neurosymbolic import COURSE, ROOT, FORM, FORM_MODULE, TABS, generate, read
from check_curriculum import Page


def check():
    errors=[]
    def require(condition, context):
        if not condition: errors.append(context)
    def resolve(path, ref):
        u=urlsplit(ref)
        if u.scheme or u.netloc: return
        target=(path.parent/unquote(u.path)).resolve() if u.path else path
        if target.is_dir(): target=target/"index.html"
        require(target.is_file(),f"{path.relative_to(ROOT)}: broken link {ref}")
        if not u.fragment or not target.is_file() or COURSE not in target.parents: return
        target_page=pages.get(target)
        if target_page is None: return
        anchors={n.get("id") for n in target_page.iter()}
        anchors.update(n.get("data-section") for n in target_page.iter())
        anchors.update(n.get("data-slide") for n in target_page.iter())
        require(u.fragment in anchors,f"{path.name}: missing fragment {ref}")

    for name, expected in generate():
        p=COURSE/name
        require(p.is_file() and p.read_text()==expected,f"Regenerate {name} with scripts/build_neurosymbolic.py")
    pages={p:Page(p).root for p in COURSE.rglob("*.html")}
    for p,page in pages.items():
        ids=[e.get("id") for e in page.iter() if e.get("id")]
        require(len(ids)==len(set(ids)),f"Repeated ID in {p}")
        for elem in page.iter():
            for key in ("src","href","data-src"):
                val=elem.get(key)
                if val: resolve(p,val)
    for stage in range(1,5):
        for m in read(f"stage-{stage:02}.json"):
            n=m["n"]; folder=COURSE/f"module-{n:02}"
            module=pages[folder/"index.html"]
            require([b.get("data-tab") for b in module.iter("button") if b.get("data-tab")]==[k for k,_ in TABS],f"Module {n} tabs")
            frame=module.find(".//iframe[@class='question-frame']")
            u=urlsplit(frame.get("data-src",""))
            require(u.scheme+"://"+u.netloc+u.path==FORM and parse_qs(u.query).get(FORM_MODULE)==[f"CS 691 · Module {n:02}"],f"Module {n} question routing")
            deck=pages[folder/"slides.html"]
            slides=[a for a in deck.iter("article") if a.get("data-slide")]
            require(len(slides)==8 and all(s.find(".//details/summary") is not None for s in slides),f"Module {n} answer disclosures")
            book=json.loads(next(folder.glob("*.ipynb")).read_text())
            code_cells=[c for c in book["cells"] if c["cell_type"]=="code"]
            require(len(code_cells)==5,f"Module {n} notebook")
            for j,c in enumerate(code_cells):
                buf=StringIO()
                with redirect_stdout(buf):
                    exec(compile("".join(c["source"]),f"module-{n:02} cell {j+1}","exec"),{})
                if j<4:
                    require(buf.getvalue().rstrip("\n")==m["slides"][j]["out"].rstrip("\n"),f"Module {n} cell {j+1} output")
    if errors: sys.exit("\n".join(errors))
    print(f"CS 691 passed across {len(pages)} pages, 16 module notebooks, 80 code cells, and four stages.")


if __name__=="__main__": check()
