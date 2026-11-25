"""Build source passages and offline answers from the public TeachReach lessons."""
import argparse
import ast
import json
import re
import sys
from urllib.parse import parse_qs, urlsplit

from check_curriculum import Page, ROOT, words
from check_site_links import js_json, legacy_slide_ids


COURSES = {"ml-foundations": 16, "neurosymbolic-ai": 16, "research-mentoring": 8}
PUBLIC = ROOT / "assets/tutor/answers"
CORPUS = ROOT / "tutor-worker/generated/sources.json"
BLOCKS = set("h1 h2 h3 h4 p br div section ul ol li tr td th article".split())
OMIT = set("script style svg form button nav summary input textarea iframe".split())
QUOTED = re.compile(r"""\b(\w+)\s*:\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")""")


def visible(node):
    """Keep paragraphs and Python lines intact while removing interface controls."""
    if node is None or node.tag in OMIT or node.get("class") in {"tr-eyebrow", "controls"}:
        return ""
    if node.tag == "pre":
        return "\n" + "".join(node.itertext()).strip() + "\n"
    chunks = [node.text or ""]
    for child in node:
        chunks.extend((visible(child), child.tail or ""))
    value = "".join(chunks)
    return "\n" + value + "\n" if node.tag in BLOCKS else value


def clean(value):
    return re.sub(r"\n(?:[ \t]*\n)+", "\n", value).strip()


def title(node):
    for level in ("h1", "h2", "h3", "h4"):
        heading = node.find(".//" + level)
        if heading is not None:
            return words(heading)
    return ""


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def json_bytes(obj):
    return (json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + "\n").encode()


def paragraphs(text, limit=2400):
    """Partition longer passages on line or word boundaries without truncating them."""
    while len(text) > limit:
        boundary = text.rfind("\n", 0, limit)
        if boundary < limit // 2:
            boundary = text.rfind(" ", 0, limit)
        if boundary < 1:
            boundary = limit
        yield text[:boundary].rstrip()
        text = text[boundary:].lstrip("\n ")
    if text:
        yield text


def add(rows, module, name, path, body, question="", answer="", fragment=""):
    body = clean(body)
    question, answer = question.strip(), answer.strip()
    if not body:
        return
    for i, passage in enumerate(paragraphs(body)):
        row = {"module": module, "title": name, "url": path.relative_to(ROOT).as_posix() + fragment, "text": passage}
        if i == 0 and question and answer:
            row.update(question=question, answer=answer)
        rows.append(row)


def combine(*parts):
    return "\n".join(str(part) for part in parts if part is not None and str(part).strip())


def check_pair(node):
    previous = None
    for element in node:
        summary = words(element.find("summary")).lower()
        if element.tag == "details" and previous is not None and previous.tag == "p" and (
                "answer" in summary or "reasoning" in summary):
            return words(previous), clean(visible(element))
        previous = element
    return "", ""


def static_module(rows, module, folder):
    path = folder / "slides.html"
    for article in Page(path).root.findall(".//article[@data-slide]"):
        n = article.get("data-slide")
        add(rows, module, f"Slide {n} · {title(article)}", path, visible(article),
            *check_pair(article), fragment="#" + n)
    path = folder / "office.html"
    for faq in Page(path).root.iter("details"):
        if "data-faq" not in faq.attrib:
            continue
        question, answer = words(faq.find("summary")), clean(visible(faq.find("p")))
        add(rows, module, "Office hours · " + question, path, combine(question, visible(faq)), question, answer,
            "#" + faq.get("id"))
    path = folder / "index.html"
    for i, article in enumerate(Page(path).root.findall(".//article[@class='practice-card']"), 1):
        question = title(article)
        solution = article.findall("details")[-1]
        add(rows, module, f"Exercise {i}", path, visible(article), question, clean(visible(solution)), "#practice")
    path = folder / "lab.html"
    lab = Page(path).root
    for i, case in enumerate(lab.findall(".//article[@data-case]"), 1):
        add(rows, module, f"Lab case {i} · {title(case)}", path, visible(case), *check_pair(case))
    data = folder.parent / "labs" / (folder.name + ".js")
    if data.exists():
        fields = [(k, ast.literal_eval(v)) for k, v in QUOTED.findall(data.read_text()) if k in ("title", "prompt")]
        definitions = [(fields[i-1][1], value) for i, (key, value) in enumerate(fields)
                       if i > 0 and key == "prompt" and fields[i-1][0] == "title"]
        sections = lab.findall(".//section[@id]")
        if len(definitions) != len(sections):
            raise ValueError(f"Review changed lab structure: {data}")
        for i, section in enumerate(sections):
            name, prompt = definitions[i]
            add(rows, module, "Lab · " + name, path, combine(name, prompt), fragment="#" + section.get("id"))


def mentoring(rows, module, folder):
    path = folder / "index.html"
    main = Page(path).root
    for article in main.findall(".//article[@id]"):
        add(rows, module, "Seminar · " + title(article), path, visible(article), *check_pair(article),
            fragment="#" + article.get("id"))
    for key in ("workbench", "exercise", "meeting"):
        section = main.find(f".//section[@id='{key}']")
        if section is None:
            continue
        question, answer = "", ""
        if key == "exercise":
            question = words(section.find("p"))
            answer = clean(visible(section.findall("details")[-1]))
        add(rows, module, title(section), path, visible(section), question, answer, "#" + key)


def legacy_first_slides(folder, exercises):
    assets = folder / "assets"
    script = (assets / "slides.js").read_text()
    deck = script.split("const S=[", 1)[1].split("for (const bridge", 1)[0]
    slides = [dict((k, ast.literal_eval(v)) for k, v in QUOTED.findall(line))
              for line in deck.splitlines() if re.search(r"\{\s*kind:", line)]
    checks = json.JSONDecoder().raw_decode(script.split("const checks =", 1)[1].lstrip())[0]
    examples = js_json(assets / "slide_examples.js")
    for slide in slides:
        kind, sid = slide["kind"], slide.get("id")
        slide["lead"] = slide.get("sub", "")
        slide["code"] = (slide.get("code") or examples["byTitle"].get(slide["title"])
                         or examples["byExercise"].get(sid) or examples["byKind"].get(kind, ""))
        if kind == "exercise":
            exercise = next(x for x in exercises if x["id"] == sid)
            slide["check"], slide["checkAnswer"] = exercise["question"], exercise["explanation"]
        elif kind in checks:
            slide["check"], slide["checkAnswer"] = checks[kind]
    for bridge in js_json(assets / "slides_addons.js"):
        i = next(i for i, slide in enumerate(slides) if slide["kind"] == bridge["after"]) + 1
        while i < len(slides) and slides[i]["kind"] == "bridge":
            i += 1
        slides.insert(i, bridge)
    return slides


def legacy(rows, module, folder):
    if folder.name == "module-01":
        data = js_json(folder / "assets/module_data.js")
        exercises, faq = data["exercises"], js_json(folder / "assets/faq_seed.js")
        slides = legacy_first_slides(folder, exercises)
        for lesson in data["lessons"]:
            formal = lesson.get("formalism", {})
            add(rows, module, "Tensor lab · " + lesson["title"], folder / "student.html",
                combine(lesson["plain"], formal.get("formal"), formal.get("read"), lesson["code"], lesson["takeaway"]),
                fragment="?lesson=" + lesson["id"])
    else:
        data = js_json(folder / "assets/content.js")
        exercises, faq, slides = data["exercises"], data["faq"], data["slides"]
        path = folder / "lab.html"
        for section in Page(path).root.findall(".//section[@class='lab-card']"):
            add(rows, module, "Lab · " + title(section), path, visible(section))
    for i, slide in enumerate(slides, 1):
        keys = ("title", "lead", "example", "math", "formal", "translate", "explain", "code", "output", "check", "checkAnswer")
        add(rows, module, f"Slide {i} · {slide['title']}", folder / "slides.html",
            combine(*(slide.get(k) for k in keys)), slide.get("check", ""), slide.get("checkAnswer", ""), "#" + str(i))
    for entry in faq:
        if entry.get("approved") is False:
            continue
        q, a = entry["question"], entry["answer"]
        add(rows, module, "Office hours · " + q, folder / "office.html",
            combine(q, a, entry.get("formal"), entry.get("code"), entry.get("check"), entry.get("checkAnswer")),
            q, a, "?faq=" + entry["id"])
    for i, exercise in enumerate(exercises, 1):
        q, a = exercise["question"], exercise["explanation"]
        add(rows, module, f"Exercise {i}", folder / "index.html", combine(q, exercise.get("hint"), a), q, a, "#practice")


def notebook(rows, module, folder):
    source, = folder.glob("*.ipynb")
    cells = read(source)["cells"]
    path = folder / "notebook.html"
    fragment = ""
    if not path.exists():
        path, fragment = folder / "index.html", "#notebook"
    heading, parts = "Opening example", []
    for cell in cells:
        body = clean("".join(cell.get("source", [])))
        if not body or cell["cell_type"] not in {"markdown", "code"}:
            continue
        if cell["cell_type"] == "markdown" and body.startswith("#"):
            if parts:
                add(rows, module, "Notebook · " + heading, path, combine(*parts), fragment=fragment)
            heading, parts = body.splitlines()[0].lstrip("# ").strip(), []
        parts.append(body)
    if parts:
        add(rows, module, "Notebook · " + heading, path, combine(*parts), fragment=fragment)


def syllabus(rows, course):
    path = ROOT / "courses" / course / "syllabus.html"
    root = Page(path).root.find(".//main")
    for section in root.findall("section"):
        name = title(section)
        if name:
            anchor = section.get("id")
            add(rows, course + "/syllabus", "Syllabus · " + name, path, visible(section),
                fragment="#" + anchor if anchor else "")


# Reviewed alternative phrasings for student questions whose answers are printed on a slide.
QUESTION_VARIANTS = {
    ("ml-foundations/module-01", "What could an inbox filter predict about a new message?"): [
        "How can previously labeled emails help a spam filter classify a new message?",
        "How would emails that someone already marked as spam help an inbox filter learn what to do with a new message?",
        "In the inbox example, how would previously labeled emails help a machine learning model make a prediction?",
    ]
}


def prepared(rows):
    result, seen = [], set()
    for row in rows:
        if row.get("question"):
            key = row["question"], row["answer"]
            if key not in seen:
                entry = {k: v for k, v in row.items() if k != "text"}
                variants = QUESTION_VARIANTS.get((row["module"], row["question"]))
                if variants:
                    entry["variants"] = variants
                result.append(entry)
                seen.add(key)
    if not result or len(json_bytes(result)) >= 70 * 1024:
        raise ValueError("Empty or oversized answer bank for " + rows[0]["module"])
    return result


def validate_links(rows):
    targets = {}
    for row in rows:
        ref = urlsplit(row["url"])
        path = ROOT / ref.path
        if ref.scheme or ref.netloc or ".." in path.parts or not ref.path.startswith("courses/") or not path.is_file():
            raise ValueError("Missing or non-public citation " + row["url"])
        if ref.fragment:
            if path not in targets:
                page = Page(path).root
                targets[path] = {el.get(k) for el in page.iter() for k in ("id", "data-tab", "data-slide")}
                targets[path].update(legacy_slide_ids(path))
            if ref.fragment not in targets[path]:
                raise ValueError("Unknown citation anchor " + row["url"])
        if ref.query:
            query = parse_qs(ref.query)
            if path.name == "office.html" and list(query) == ["faq"]:
                assets = path.parent / "assets"
                records = (js_json(assets / "faq_seed.js") if path.parent.name == "module-01"
                           else js_json(assets / "content.js")["faq"])
                ids = {entry["id"] for entry in records if entry.get("approved") is not False}
            elif path.name == "student.html" and list(query) == ["lesson"]:
                ids = {entry["id"] for entry in js_json(path.parent / "assets/module_data.js")["lessons"]}
            else:
                raise ValueError("Unknown citation query " + row["url"])
            if next(iter(query.values()))[0] not in ids:
                raise ValueError("Unknown citation target " + row["url"])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="check the committed public answer banks")
    options = parser.parse_args()
    corpus, shards = [], {}
    for course, count in COURSES.items():
        syllabus(corpus, course)
        for n in range(1, count + 1):
            module = f"{course}/module-{n:02}"
            folder = ROOT / "courses" / module
            rows = []
            if course == "research-mentoring":
                mentoring(rows, module, folder)
            elif course == "ml-foundations" and n <= 3:
                legacy(rows, module, folder)
            else:
                static_module(rows, module, folder)
            notebook(rows, module, folder)
            shards[PUBLIC / (module + ".json")] = json_bytes(prepared(rows))
            corpus.extend(rows)
    validate_links(corpus)
    if options.check:
        stale = [p for p, data in shards.items() if not p.exists() or p.read_bytes() != data]
        stale.extend(sorted(set(PUBLIC.glob("*/*.json")) - set(shards)))
        if stale:
            sys.exit("Rebuild stale public tutor files:\n" + "\n".join(str(p.relative_to(ROOT)) for p in stale))
    else:
        for p, data in {**shards, CORPUS: json_bytes(corpus)}.items():
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(data)
    print(f"{len(shards)} module answer banks, {len(corpus)} verified public source passages")


if __name__ == "__main__":
    main()
