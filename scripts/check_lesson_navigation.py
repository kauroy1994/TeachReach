"""Exercise the published student workflow against a running copy of TeachReach."""
from pathlib import Path
import os
import re
import subprocess
import sys
from urllib.parse import parse_qs, urljoin, urlsplit

from playwright.sync_api import expect, sync_playwright

site = sys.argv[1].rstrip("/") + "/"
base = urljoin(site, "courses/ml-foundations/")
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
    expect(page).to_have_url(urljoin(base, f"module-{module + 1:02}/slides.html#1"))


def check_embed(page, module):
    page.goto(urljoin(base, f"module-{module:02}/#slides"))
    deck = page.frame_locator("#slidesFrame")
    deck.get_by_role("button", name="All slides", exact=False).click()
    deck.locator("#overview [data-slide], #outlineBody button").last.click()
    deck.locator("#continueModule").click()
    expect(page).to_have_url(urljoin(base, f"module-{module + 1:02}/slides.html#1"))


def open_tab(page, name):
    tab = page.locator(f'[data-tab="{name}"]')
    if not tab.is_visible():
        page.locator("#menuToggle").click()
    tab.click()
    expect(tab).to_have_attribute("aria-selected", "true")
    panel = page.locator(f'[data-section="{name}"]')
    expect(panel).to_be_visible()
    return panel


def reveal(container, label):
    summary = container.get_by_text(label, exact=True)
    summary.click()
    detail = summary.locator("..")
    expect(detail).to_have_attribute("open", "")
    expect(detail.locator("p, pre").first).to_be_visible()


def check_released_deck(page, route, target):
    # Open the first taught concept directly from the module overview.
    page.goto(route)
    page.locator('[data-section="overview"] ol a').first.click()
    expect(page).to_have_url(urljoin(route, "slides.html#2"))
    number_of_slides = page.locator("article[data-slide]").count()
    assert number_of_slides >= 10, route
    page.locator("#back").click()
    for number in range(1, number_of_slides - 1):
        slide = page.locator(f'article[data-slide="{number}"]')
        expect(slide).to_be_visible()
        reveal(slide, "Reveal answer")
        if number == 2:
            example = slide.locator("[data-example]")
            example.locator("summary").first.click()
            expect(example.locator("pre code")).to_be_visible()
            reveal(example, "Reveal the output")
        page.locator("#next").click()

    questions = page.locator("article[data-slide]:visible")
    expect(questions.get_by_role("heading", name="End-of-module questions")).to_be_visible()
    exercises = questions.locator(".practice-card").all()
    assert len(exercises) >= 5, route
    for exercise in exercises:
        reveal(exercise, "Reveal the worked answer")
    page.get_by_role("button", name="All slides").click()
    outline = page.locator("#outline")
    expect(outline).to_be_visible()
    expect(outline.get_by_role("link")).to_have_count(number_of_slides)
    outline.get_by_role("link").last.click()
    last = page.locator(f'article[data-slide="{number_of_slides}"]')
    expect(last).to_be_visible()
    reveal(last, "Reveal answer")
    last.locator("a.tr-cta").click()
    expect(page).to_have_url(target)

    # The same bridge must escape the iframe when students learn from the module hub.
    page.goto(route + "#slides")
    deck = page.frame_locator("#frame-slides")
    deck.get_by_role("button", name="All slides").click()
    deck.locator("#outline a").last.click()
    deck.locator("article[data-slide]:visible a.tr-cta").click()
    expect(page).to_have_url(target)


def check_practice(panel):
    form = panel.locator("[data-diagnostic]")
    submit = form.get_by_role("button", name="Check my answer")
    submit.click()
    expect(form.locator("[data-needed]")).to_be_visible()
    outcomes = []
    for option in form.get_by_role("radio").all():
        option.check()
        submit.click()
        feedback = form.locator("[data-feedback]:visible")
        expect(feedback).to_have_count(1)
        expect(feedback).to_have_attribute("data-feedback", option.get_attribute("value"))
        outcomes.append(feedback.locator("b").inner_text())
    assert outcomes.count("Correct.") == 1 and "Try again." in outcomes, outcomes
    reveal(form, "Reveal the answer")
    for exercise in panel.locator(".practice-card").all():
        reveal(exercise, "Hint")
        reveal(exercise, "Reveal the worked answer")


def check_labs(frame):
    experiments = frame.locator("[data-experiment]")
    expect(experiments).to_have_count(2)
    for experiment in experiments.all():
        results = experiment.locator(".ml-lab-results")
        expect(results.locator(".ml-chart-row").first).to_be_visible()
        initial = results.inner_text()
        slider = experiment.locator('input[type="range"]').first
        value = slider.input_value()
        # Some experiments have tied scores at one extreme or use discrete outputs.
        for key in ("ArrowRight", "End", "Home", "ArrowRight"):
            slider.press(key)
            if results.inner_text() != initial:
                break
        assert slider.input_value() != value and results.inner_text() != initial, experiment.inner_text()
        expect(experiment.locator("output").first).to_have_text(slider.input_value())
        expect(experiment.get_by_role("status").last).to_contain_text(re.compile(r"\w"))


def check_released_module(page, module):
    route = urljoin(base, f"module-{module:02}/")
    target = urljoin(base, f"module-{module + 1:02}/slides.html#1" if module < 16 else "index.html")
    check_released_deck(page, route, target)

    page.goto(route)
    check_practice(open_tab(page, "practice"))
    open_tab(page, "lab")
    check_labs(page.frame_locator("#frame-lab"))
    notebook_panel = open_tab(page, "notebook")
    notebook = page.frame_locator("#frame-notebook")
    expect(notebook.get_by_role("heading", name="Worked notebook")).to_be_visible()
    cell = notebook.locator(".codebox").first
    expect(cell.locator("pre code")).to_be_visible()
    reveal(cell.locator(".."), "Reveal the output")
    book = f"ML_Foundations_Module{module:02}.ipynb"
    expect(notebook_panel.get_by_role("link", name="Run in Colab")).to_have_attribute(
        "href", re.compile(r"https://colab\.research\.google\.com/github/.+/" + re.escape(book) + "$"))
    download = notebook_panel.get_by_role("link", name="Download notebook")
    expect(download).to_have_attribute("href", book)
    response = page.request.get(urljoin(route, download.get_attribute("href")))
    assert response.ok and any(cell["cell_type"] == "code" and cell["outputs"]
                               for cell in response.json()["cells"]), book

    open_tab(page, "office")
    office = page.frame_locator("#frame-office")
    entry = office.locator("[data-faq]").first
    entry.locator(":scope > summary").click()
    expect(entry.locator(":scope > p")).to_be_visible()
    office.get_by_role("link", name="Ask a question").click()
    expect(page).to_have_url(urljoin(route, "index.html#question"))
    questions = page.locator('[data-section="question"]')
    expect(questions).to_be_visible()
    form_url = questions.locator("iframe").get_attribute("data-src")
    for external in (form_url, questions.locator("a.form-link").get_attribute("href")):
        form = urlsplit(external)
        assert form.hostname == "docs.google.com" and "/forms/" in form.path, external
        assert parse_qs(form.query)["entry.2083969021"][0].startswith(f"Module {module:02} · "), external
    expect(questions.locator("iframe")).to_have_attribute("src", form_url)
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), route


with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=os.environ.get("CHROME_BIN"))
    for width in [1280, 390]:
        page = browser.new_page(viewport={"width": width, "height": 900}, reduced_motion="reduce")
        page.route("https://docs.google.com/forms/**", lambda route: route.fulfill(
            content_type="text/html", body="<title>External Google Form</title>"))
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        for module, count in decks:
            check_slides(page, module, count)
            check_embed(page, module)
        for module in range(4, 17):
            check_released_module(page, module)
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

subprocess.run([sys.executable, str(Path(__file__).with_name("check_site_layout.py")), site], check=True)
