"""Compare the published HTML with the curriculum catalog before a release."""
from html.parser import HTMLParser
from pathlib import Path
from xml.etree import ElementTree as ET
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / "courses/ml-foundations"
VOID = set("area base br col embed hr img input link meta param source track wbr".split())


class Page(HTMLParser):
    """Collect visible text and structure without executing page scripts."""

    def __init__(self, path):
        super().__init__()
        self.root = ET.Element("page")
        self.stack = [self.root]
        self.feed(path.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attrs):
        node = ET.SubElement(self.stack[-1], tag, dict(attrs))
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        ET.SubElement(self.stack[-1], tag, dict(attrs))

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        parent = self.stack[-1]
        if len(parent):
            child = parent[-1]
            child.tail = (child.tail or "") + data
        else:
            parent.text = (parent.text or "") + data


def words(node):
    return " ".join("".join(node.itertext()).split()) if node is not None else ""


def check():
    source = (COURSE / "assets/curriculum-data.js").read_text()
    catalog = json.loads(source.split("window.TEACHREACH_CURRICULUM=", 1)[1].strip().removesuffix(";"))
    roadmap = Page(COURSE / "index.html").root
    syllabus = Page(COURSE / "syllabus.html").root
    errors = []

    def equal(location, actual, expected):
        if actual != expected:
            errors.append(f"{location}: expected {expected!r}, found {actual!r}")

    modules = catalog["modules"]
    ids = [m["id"] for m in modules]
    equal("catalog module IDs", len(set(ids)), len(ids))
    cards = [a for a in roadmap.iter("a") if "tr-module-entry" in a.get("class", "").split()]
    rows = [r for r in syllabus.iter("tr") if r.find("td/a") is not None
            and r.find("td/a").get("href", "").startswith("module-")]
    for location, nodes, href in [("course roadmap", cards, lambda n: n.get("href")),
                                  ("syllabus rows", rows, lambda n: n.find("td/a").get("href"))]:
        equal(location, [href(n) for n in nodes], [mid + "/" for mid in ids])

    for stage in catalog["stages"]:
        items = [m for m in modules if m["stage"] == stage["id"]]
        page = Page(COURSE / stage["slug"] / "index.html").root
        articles = [a for a in page.iter("article") if a.get("id", "").startswith("module-")]
        equal(stage["slug"], [a.get("id") for a in articles], [m["id"] for m in items])
        equal(stage["slug"] + " catalog membership", stage["numbers"], [m["n"] for m in items])
        for m, a in zip(items, articles):
            loc = stage["slug"] + "/" + m["id"]
            live = m["status"] == "available"
            equal(loc + " title", words(a.find(".//h2/a")), m["title"])
            equal(loc + " subtitle", words(a.find("div/div/p")), m["subtitle"])
            equal(loc + " summary", words(a.find("p")), m["summary"])
            equal(loc + " objectives and assessment", [words(li) for li in a.iter("li")], m["outcomes"] + m["assessment"])
            equal(loc + " labs", words(a.find("div/div/h3[.='Practice & in-class assessment']/../p")),
                  "Module practice will target: " + "; ".join(m["labs"]) + ".")
            equal(loc + " availability", words(a.find("div/span")), "Lessons available" if live else "Syllabus preview")

    for m, card, row in zip(modules, cards, rows):
        mid = m["id"]
        live = m["status"] == "available"
        equal(mid + " status", m["status"] in {"planned", "available"}, True)
        equal(mid + " roadmap title", words(card.find(".//h3")), m["title"])
        equal(mid + " roadmap description", words(card.find(".//p")), m["subtitle"] + " · " + m["summary"])
        equal(mid + " roadmap status", words(card.find("span/span")), "Learning materials live" if live else "Syllabus preview")
        cells = row.findall("td")
        if len(cells) != 4:
            errors.append(f"{mid}: expected four syllabus columns")
            continue
        equal(mid + " syllabus title", words(cells[0]), f"{m['n']:02} · {m['title']}")
        equal(mid + " syllabus description", words(cells[1]), m["summary"])
        equal(mid + " syllabus outcomes", [words(d).removeprefix("• ") for d in cells[2].findall("div")], m["outcomes"])
        equal(mid + " syllabus status", words(cells[3].find("span")), "Open module" if live else "Planned")
        page = Page(COURSE / mid / "index.html").root
        for element in page.findall(".//*[@data-catalog-field]"):
            field = element.get("data-catalog-field")
            equal(mid + " module " + field, words(element), m[field])
        if not live:
            hero = page.find(".//section[@data-section='overview']/div/div")
            equal(mid + " preview title", words(hero.find("h1")), m["title"])
            equal(mid + " preview description", words(hero.find("p")), m["subtitle"] + ". " + m["summary"])
        elif page.find(".//body").get("data-tr-module") != f"{m['n']:02}":
            errors.append(f"{mid}: incorrect module landing page")
        if live:
            for file in ["slides.html", "office.html", "notebook.html"]:
                if not (COURSE / mid / file).is_file():
                    errors.append(f"{mid}: missing released resource {file}")

    availability = catalog["assessment"]["availability"]
    for name, page in [("home", Page(ROOT / "index.html").root), ("roadmap", roadmap), ("syllabus", syllabus)]:
        if availability not in words(page):
            errors.append(f"{name}: release summary differs from catalog")
    if errors:
        sys.exit("\n".join(errors))
    print(f"Curriculum matches {len(modules)} modules across {len(catalog['stages'])} stages.")


if __name__ == "__main__":
    check()
