"""Check the office-hours UI against a served checkout with simulated provider responses."""
import argparse
import json
import os
from pathlib import Path
from urllib.parse import urljoin, urlsplit

from playwright.sync_api import expect, sync_playwright

from check_curriculum import Page

ROOT = Path(__file__).resolve().parents[1]
COURSES = {"ml-foundations": 16, "neurosymbolic-ai": 16, "research-mentoring": 8}
WORKER = "https://teachreach-office-hours.kauroy1994.workers.dev"
TURNSTILE = "challenges.cloudflare.com"
TEST_TOKEN = "classroom-browser-test-token"
HOST = "[data-tr-tutor]"


def office_route(module):
    filename = "index.html" if module.startswith("research-mentoring/") else "office.html"
    return f"courses/{module}/{filename}"


def check_entry_points():
    """Ensure each host targets its own module and a working registration path."""
    for course, count in COURSES.items():
        for n in range(1, count + 1):
            module = f"{course}/module-{n:02}"
            path = ROOT / office_route(module)
            doc = Page(path).root
            hosts = [el for el in doc.iter() if "data-tr-tutor" in el.attrib]
            assert len(hosts) == 1, path
            host = hosts[0]
            assert host.get("data-module") == module, path
            scripts = [el.get("src", "") for el in doc.iter("script") if el.get("type") == "module"]
            assert any((path.parent / src).resolve() == ROOT / "assets/tutor/chat.js" for src in scripts), path
            index = Page(path.parent / "index.html").root
            if course == "research-mentoring":
                assert host.get("data-register") == "#register", path
                assert index.find(".//*[@id='register']//a[@href]") is not None, path
                assert index.find(".//a[@href='#office']") is not None, path
            else:
                assert host.get("data-register") == "index.html#question", path
                assert any("office.html" in str(el.attrib) for el in index.iter("iframe")), path
                assert any("forms" in str(el.attrib) for el in index.iter("iframe")), path
    print("Verified tutor and registration entry points in all 40 modules.", flush=True)


def sample(module):
    path = ROOT / f"assets/tutor/answers/{module}.json"
    return next(row for row in json.loads(path.read_text()) if
                10 <= len(row["question"]) < 480 and 12 <= len(row["answer"]) < 600)


WIDGET_SCRIPT = """
window.turnstile = {
  ready(fn) { fn(); },
  render(host, settings) {
    setTimeout(() => settings.callback('classroom-browser-test-token'), 0);
    return 'test-widget';
  },
  remove() {}
};
"""


def set_routes(context, site, reference):
    """Fulfill every external request locally, including the Turnstile and provider paths."""
    requests = []
    mode = {"value": "answered"}
    local_host = urlsplit(site).netloc

    def respond(route):
        req = route.request
        host = urlsplit(req.url).netloc
        if host == local_host:
            return route.continue_()
        if host == TURNSTILE and req.resource_type == "script":
            return route.fulfill(content_type="application/javascript", body=WIDGET_SCRIPT)
        if host != urlsplit(WORKER).netloc:
            return route.fulfill(content_type="text/html", body="<p>External teaching resource</p>")
        headers = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
                   "Access-Control-Allow-Headers": "Content-Type"}
        if req.method == "OPTIONS":
            return route.fulfill(status=204, headers=headers)
        if urlsplit(req.url).path == "/config":
            return route.fulfill(headers=headers, json={"siteKey": "test-site-key"})
        assert urlsplit(req.url).path == "/ask" and req.method == "POST", req.url
        requests.append(req.post_data_json)
        if mode["value"] == "unavailable":
            return route.fulfill(status=503, headers=headers, json={"error": "Temporarily unavailable"})
        response = {"status": mode["value"]}
        if mode["value"] == "answered":
            response["claims"] = [{"text": reference["quote"], "references": [reference]}]
        route.fulfill(headers=headers, json=response)

    context.route("**/*", respond)
    return requests, mode


def check_layout(host):
    bounds = host.evaluate("""el => {
      const b = el.getBoundingClientRect();
      const visible = [...el.querySelectorAll('textarea,button,a')].filter(n => n.offsetWidth && n.offsetHeight);
      const fields = visible.filter(n => n.closest('form')).map(n => n.getBoundingClientRect());
      const overlaps = fields.some((a, i) => fields.slice(i + 1).some(c =>
        Math.min(a.right, c.right) - Math.max(a.left, c.left) > 1 &&
        Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top) > 1));
      return { viewport: document.documentElement.clientWidth, left: b.left, right: b.right, overlaps,
        overflow: el.scrollWidth - el.clientWidth,
        controls: visible.map(n => [n.tagName, n.getBoundingClientRect().left, n.getBoundingClientRect().right])};
    }""")
    assert bounds["left"] >= -1 and bounds["right"] <= bounds["viewport"] + 2, bounds
    assert bounds["overflow"] <= 2, bounds
    assert not bounds["overlaps"], bounds
    for label, left, right in bounds["controls"]:
        assert left >= bounds["left"] - 2 and right <= bounds["right"] + 2, (label, bounds)


def ask(host, question):
    box = host.get_by_role("textbox", name="Your question")
    expect(box).to_be_visible()
    box.fill(question)
    host.get_by_role("button", name="Ask question").click()


def expect_citation(host, site, row, quote):
    turn = host.get_by_role("article").last
    citation = turn.get_by_role("link", name="Reference 1,", exact=False)
    assert citation.evaluate("a => a.href") == urljoin(site, row["url"])
    expect(turn.get_by_text("References", exact=True)).to_be_visible()
    expect(turn.get_by_role("link", name=row["title"], exact=False).last).to_be_visible()
    turn.get_by_text("View source passage", exact=True).click()
    expect(turn.locator("blockquote")).to_have_text(quote)
    expect(turn.locator("blockquote")).to_be_visible()


def check_browser(browser, site, width):
    context = browser.new_context(viewport={"width": width, "height": 900}, reduced_motion="reduce")
    exact = sample("ml-foundations/module-01")
    source = sample("neurosymbolic-ai/module-01")
    reference = {"url": source["url"], "title": source["title"], "quote": source["answer"][:250]}
    requests, mode = set_routes(context, site, reference)
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    try:
        page.goto(urljoin(site, "courses/ml-foundations/module-01/index.html#office"))
        embedded = page.frame_locator("#officeFrame").locator(HOST)
        ask(embedded, exact["question"])
        expect(embedded).to_contain_text(exact["answer"][:60])
        expect_citation(embedded, site, exact, exact["answer"])
        assert requests == [], "An exact existing answer consumed provider quota"
        check_layout(embedded)

        module = "neurosymbolic-ai/module-01"
        page.goto(urljoin(site, office_route(module)))
        tutor = page.locator(HOST)
        custom = "How would you explain this evidence in different words for our discussion?"
        ask(tutor, custom)
        expect(tutor).to_contain_text(reference["quote"][:65], timeout=15000)
        expect_citation(tutor, site, reference, reference["quote"])
        assert requests[-1]["token"] == TEST_TOKEN and requests[-1]["module"] == module
        assert requests[-1]["question"] == custom
        check_layout(tutor)

        mode["value"] = "uncovered"
        ask(tutor, "Would that explanation also establish what happens on Planet Zagreus?")
        expect(tutor).to_contain_text("TeachReach materials do not cover this")
        assert custom in requests[-1]["history"], requests[-1]
        register = tutor.get_by_role("link", name="Please register a new question.", exact=True)
        expect(register).to_be_visible()
        check_layout(tutor)
        register.click()
        expect(page.locator('[data-section="question"]')).to_be_visible()
        assert urlsplit(page.url).fragment == "question"

        mode["value"] = "unavailable"
        page.goto(urljoin(site, office_route("research-mentoring/module-08") + "#office"))
        mentor = page.locator(HOST)
        unanswered = "Can you restate the evidence needed to defend this research claim?"
        ask(mentor, unanswered)
        expect(mentor).to_contain_text("unavailable", timeout=15000, ignore_case=True)
        assert "TeachReach materials do not cover this" not in mentor.inner_text()
        expect(mentor.get_by_role("textbox")).to_have_value(unanswered)
        check_layout(mentor)
        before = len(requests)
        ask(mentor, exact["question"])
        expect(mentor).to_contain_text(exact["answer"][:60])
        expect_citation(mentor, site, exact, exact["answer"])
        assert len(requests) == before, "A prepared cross-course answer consumed provider quota"
        mentor.get_by_role("link", name="Register a new question", exact=True).click()
        expect(page.locator('#register a[href^="mailto:"]')).to_be_visible()
        assert not errors, errors
        print(f"Passed exact answer, references, follow-up, uncovered question and 503 at {width}px.", flush=True)
    finally:
        context.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("site")
    parser.add_argument("--engine", choices=("chromium", "firefox", "webkit"), default="chromium")
    args = parser.parse_args()
    check_entry_points()
    with sync_playwright() as pw:
        executable = os.getenv("CHROME_BIN") if args.engine == "chromium" else None
        browser = getattr(pw, args.engine).launch(executable_path=executable)
        try:
            for width in (1280, 320):
                check_browser(browser, args.site.rstrip("/") + "/", width)
        finally:
            browser.close()


if __name__ == "__main__":
    main()
