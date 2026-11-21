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
        assert not errors, errors
        print(f"Passed at {width}px", flush=True)
        page.close()
    browser.close()
