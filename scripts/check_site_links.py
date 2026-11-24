"""Validate URLs and fragment navigation in the published static site."""
from collections import Counter
import json
import re
import sys
from urllib.parse import unquote, urljoin, urlsplit

from check_curriculum import Page, ROOT

SITE = "https://kauroy1994.github.io/TeachReach/"
SITE_PATH = urlsplit(SITE).path
COLAB_PATH = "/github/kauroy1994/TeachReach/blob/main/"
CSS_URL = re.compile(r"""url\(\s*(?:'([^']*)'|"([^"]*)"|([^)'"]*?))\s*\)""", re.I)
CSS_IMPORT = re.compile(r"""@import\s+["']([^"']+)["']""", re.I)


def css_urls(source):
    source = re.sub(r"/\*.*?\*/", "", source, flags=re.S)
    for groups in CSS_URL.findall(source):
        yield next((part for part in groups if part), "").strip()
    yield from CSS_IMPORT.findall(source)


def html_urls(page):
    for el in page.iter():
        for key in ("href", "src", "data-src", "data-source", "action", "poster", "formaction"):
            if el.get(key) is not None:
                yield el.tag, key, el.get(key)
        if el.get("srcset"):
            for candidate in el.get("srcset").split(","):
                parts = candidate.split()
                if parts:
                    yield el.tag, "srcset", parts[0]
        if el.get("style"):
            for url in css_urls(el.get("style")):
                yield el.tag, "style", url
        if el.tag == "style" and el.text:
            for url in css_urls(el.text):
                yield el.tag, "url", url


def js_json(path):
    """Read a JSON literal assigned directly to a browser global."""
    payload = path.read_text(encoding="utf-8").split("=", 1)[1].lstrip()
    return json.JSONDecoder().raw_decode(payload)[0]


def legacy_slide_ids(path):
    if path.parent.parent != ROOT / "courses/ml-foundations" or path.name != "slides.html":
        return set()
    assets = path.parent / "assets"
    if path.parent.name in ("module-02", "module-03"):
        count = len(js_json(assets / "content.js")["slides"])
    elif path.parent.name == "module-01":
        # Module 01 builds its deck from literal slide records plus bridges
        # inserted immediately after the slide indicated by their 'after' key.
        source = (assets / "slides.js").read_text(encoding="utf-8")
        records = source.split("const S=[", 1)[1].split("for (const bridge", 1)[0]
        kinds = re.findall(r"\{\s*kind:\s*'([^']+)'", records)
        count = len(kinds) + sum(b["after"] in kinds for b in js_json(assets / "slides_addons.js"))
    else:
        return set()
    return {str(i) for i in range(1, count + 1)}


def check():
    files = list(ROOT.glob("*.html")) + list((ROOT / "courses").rglob("*.html"))
    documents = {path: Page(path).root for path in sorted(files)}
    fragments = {}
    errors = []
    counts = Counter()
    idrefs = ("for", "aria-controls", "aria-labelledby", "aria-describedby", "data-full")
    for path, page in documents.items():
        ids = Counter(el.get("id") for el in page.iter() if el.get("id"))
        for value, total in ids.items():
            if total > 1:
                errors.append(f"{path.relative_to(ROOT)}: id {value!r} appears {total} times")
        for el in page.iter():
            for attr in idrefs:
                for value in (el.get(attr) or "").split():
                    counts["ID references"] += 1
                    if value not in ids:
                        errors.append(f"{path.relative_to(ROOT)}: {attr} references missing id {value!r}")
        targets = set(ids) | {el.get("name") for el in page.iter("a") if el.get("name")}
        targets.update(el.get("data-tab") for el in page.iter("button") if el.get("data-tab"))
        targets.update(el.get("data-slide") for el in page.iter("article") if el.get("data-slide"))
        fragments[path] = targets | legacy_slide_ids(path)

    def validate(origin, tag, attr, raw):
        page_url = urljoin(SITE, origin.relative_to(ROOT).as_posix())
        target = urlsplit(urljoin(page_url, raw))
        if target.netloc == "colab.research.google.com" and target.path.startswith(COLAB_PATH):
            counts["Colab links"] += 1
            dest = ROOT / unquote(target.path[len(COLAB_PATH):])
        elif target.netloc == urlsplit(SITE).netloc and target.path.startswith(SITE_PATH):
            counts["local references"] += 1
            if tag == "iframe":
                counts["local iframe sources"] += 1
            dest = ROOT / unquote(target.path[len(SITE_PATH):])
        else:
            if target.netloc == urlsplit(SITE).netloc and not urlsplit(raw).netloc:
                errors.append(f"{origin.relative_to(ROOT)} {tag}[{attr}]={raw!r}: leaves project site")
            return
        if dest.is_dir():
            dest /= "index.html"
        where = f"{origin.relative_to(ROOT)} {tag}[{attr}]={raw!r}"
        if not dest.is_file():
            errors.append(f"{where}: missing {dest.relative_to(ROOT)}")
        elif target.fragment and dest in fragments:
            counts["HTML fragments"] += 1
            if unquote(target.fragment) not in fragments[dest]:
                errors.append(f"{where}: unknown fragment in {dest.relative_to(ROOT)}")

    for path, page in documents.items():
        for tag, attr, url in html_urls(page):
            validate(path, tag, attr, url)
    styles = sorted((ROOT / "assets").rglob("*.css")) + sorted((ROOT / "courses").rglob("*.css"))
    for path in styles:
        for url in css_urls(path.read_text(encoding="utf-8")):
            validate(path, "css", "url", url)
    print(f"Checked {len(documents)} HTML pages, {len(styles)} stylesheets, "
          f"{counts['local references']} local references ({counts['local iframe sources']} iframe sources), "
          f"{counts['HTML fragments']} HTML fragments, {counts['ID references']} label/control references "
          f"and {counts['Colab links']} Colab links.")
    if errors:
        sys.exit("\n".join(sorted(set(errors))))


if __name__ == "__main__":
    check()
