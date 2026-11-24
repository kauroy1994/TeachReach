"""Exercise the published student workflow against a running copy of TeachReach."""
import os
import re
import sys
from urllib.parse import urljoin

from playwright.sync_api import expect, sync_playwright

base = sys.argv[1].rstrip("/") + "/courses/ml-foundations/"
decks = [(1, 56), (2, 53), (3, 17)]


def check_slides(page, module, count):
    page.goto(urljoin(base, f"module-{module:02}/slides.html"))
    for number in range(1, count + 1):
        stage = page.locator("#slide")
        disclosure = stage.get_by_text("Reveal answer", exact=True).filter(visible=True)
        if number == count - 1:
            expect(stage.get_by_role("heading", name="End-of-module questions")).to_be_visible()
            expect(disclosure).to_have_count(3)
        else:
            expect(stage.get_by_text(re.compile("^check your understanding$", re.I))).to_be_visible()
            expect(disclosure).to_have_count(1)
        for control in reversed(disclosure.all()):
            control.click()
            expect(stage.get_by_text("Hide answer", exact=True).filter(visible=True).first).to_be_visible()
        if number < count:
            page.locator("#next").click()
    expect(page.locator("#continueModule")).to_be_visible()
    page.locator("#continueModule").click()
    expect(page).to_have_url(urljoin(base, f"module-{module + 1:02}/" + ("slides.html#1" if module < 3 else "")))


def check_embed(page, module):
    page.goto(urljoin(base, f"module-{module:02}/#slides"))
    deck = page.frame_locator("#slidesFrame")
    deck.get_by_role("button", name="All slides", exact=False).click()
    deck.locator("#overview [data-slide], #outlineBody button").last.click()
    deck.locator("#continueModule").click()
    expect(page).to_have_url(urljoin(base, f"module-{module + 1:02}/" + ("slides.html#1" if module < 3 else "")))


with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=os.environ.get("CHROME_BIN"))
    for width in [1280, 390]:
        page = browser.new_page(viewport={"width": width, "height": 900}, reduced_motion="reduce")
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        for module, count in decks:
            check_slides(page, module, count)
            check_embed(page, module)
        for module in range(4, 17):
            page.goto(urljoin(base, f"module-{module:02}/#practice"))
            exercise = page.locator('[data-section="practice"]')
            exercise.get_by_text("Reveal answer", exact=True).click()
            expect(exercise.locator("details[open] p")).to_be_visible()
        cs691 = urljoin(base, "../neurosymbolic-ai/")
        for number in range(1, 17):
            route = urljoin(cs691, f"module-{number:02}/")
            page.goto(urljoin(route, "slides.html#2"))
            slide = page.locator("[data-slide='2']")
            slide.get_by_text("Reveal the answer", exact=True).click()
            expect(slide.locator("details[open] p").last).to_be_visible()
            page.get_by_role("button", name="All slides").click()
            page.locator("#outline a").last.click()
            last = page.locator("[data-slide='8']")
            expect(last).to_be_visible()
            last.locator("a.tr-cta").first.click()
            target = urljoin(cs691, f"module-{number+1:02}/slides.html#1") if number < 16 else urljoin(cs691, "index.html")
            expect(page).to_have_url(target)
            page.goto(route + "#practice")
            form = page.locator("[data-diagnostic]")
            form.get_by_role("radio").first.check()
            form.get_by_role("button", name="Check my answer").click()
            expect(form.locator("[data-feedback]:visible")).to_have_count(1)
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), route
        site = sys.argv[1].rstrip("/") + "/"
        nav = page.get_by_role("navigation", name="TeachReach navigation", exact=True)
        for route in ["courses/ml-foundations/module-01/slides.html",
                      "courses/neurosymbolic-ai/module-16/office.html",
                      "courses/ml-foundations/stage-02/"]:
            page.goto(urljoin(site, route))
            nav.get_by_role("link", name="TeachReach Home").click()
            expect(page.get_by_role("heading", name="TeachReach courses")).to_be_visible()
        nav.get_by_role("link", name="Find a lesson").click()
        page.locator("#course-filter").select_option("neurosymbolic-ai")
        page.locator("#stage-filter").select_option("4")
        page.locator("#lesson-search").fill("16")
        expect(page.locator("[data-lesson]:visible")).to_have_count(1)
        page.locator("[data-lesson]:visible").get_by_role("link", name="Notebook").click()
        expect(page).to_have_url(urljoin(cs691, "module-16/#notebook"))
        nav.get_by_role("link", name="TeachReach Home").click()
        expect(page.get_by_role("heading", name="TeachReach courses")).to_be_visible()
        assert not errors, errors
        print(f"Passed at {width}px", flush=True)
        page.close()
    browser.close()
