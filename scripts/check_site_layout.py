"""Check every TeachReach HTML page in rendered browsers against a served checkout.

Run with the same Playwright environment as check_lesson_navigation.py, for example:
    CHROME_BIN=/usr/bin/chromium python scripts/check_site_layout.py http://127.0.0.1:8080
"""
import argparse
import asyncio
import os
import re
from pathlib import Path
from urllib.parse import urljoin, urlsplit

from playwright.async_api import Error as BrowserError, async_playwright

ROOT = Path(__file__).resolve().parents[1]
VIEWPORTS = ((320, 568), (390, 844), (768, 1024), (1280, 800), (844, 390))
# Older ML modules have independent implementations, while later modules share templates.
INTERACTIVE_SAMPLES = {
    "courses/ml-foundations/module-01", "courses/ml-foundations/module-02",
    "courses/ml-foundations/module-03", "courses/ml-foundations/module-04",
    "courses/ml-foundations/module-16", "courses/neurosymbolic-ai/module-01",
    "courses/neurosymbolic-ai/module-16",
}

MEASURE = """() => {
    const faults = [];
    const root = document.documentElement;
    const width = root.clientWidth, height = innerHeight;
    const label = e => e.id ? '#' + e.id :
        (e.getAttribute('aria-label') || e.textContent.trim() || e.tagName).slice(0, 48);
    const visible = e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
    const coords = r => [r.left, r.top, r.right, r.bottom].map(Math.round).join(',');
    if (root.scrollWidth > width + 2) {
        const protrudes = e => {
            if (!visible(e) || e.getBoundingClientRect().right <= width + 2) return false;
            for (let p=e.parentElement; p && p!==document.body; p=p.parentElement) {
                if (['auto','scroll','hidden','clip'].includes(getComputedStyle(p).overflowX) &&
                    p.getBoundingClientRect().right <= width + 2) return false;
            }
            return true;
        };
        const offenders = [...document.querySelectorAll('main *,nav *,header *,body > *')]
            .filter(protrudes).slice(0, 5).map(e=>e.tagName+'.'+e.className+' '+coords(e.getBoundingClientRect()));
        faults.push('document width '+root.scrollWidth+' > '+width+'; '+offenders.join('; '));
    }
    for (const pane of document.querySelectorAll('.nesy.deck .resource-body,body.tr-slide-page #slide')) {
        if (visible(pane) && pane.scrollWidth > pane.clientWidth + 2)
            faults.push('slide content width '+pane.scrollWidth+' > '+pane.clientWidth);
    }
    const chrome = [...document.querySelectorAll(
        '#tr-global-nav a, header a, header button, .deck-foot button, .deck-foot a, '+
        '.tr-slide-actions button,.tr-slide-actions a'
    )].filter(e=>visible(e) && !e.disabled);
    for (const e of chrome) {
        const r = e.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const x = r.x+r.width/2, y = r.y+r.height/2;
        const global = e.closest('#tr-global-nav');
        const deckControl = e.matches('#next,#prev,#previous,#back');
        if ((global || deckControl) && (r.left < -2 || r.right > width+2 ||
                r.top < -2 || r.bottom > height+2)) {
            faults.push('unreachable '+label(e)+' ['+coords(r)+'] in '+width+'x'+height);
        }
        if (x<0 || x>=width || y<0 || y>=height) continue;
        const hit = document.elementFromPoint(x,y);
        if (hit && !e.contains(hit) && !hit.contains(e)) {
            // A horizontal tab strip may intentionally clip links until it is scrolled.
            const scroll = e.closest('.tr-curr-tabs,.tr-module-tabs');
            if (scroll && (x<scroll.getBoundingClientRect().left || x>scroll.getBoundingClientRect().right)) continue;
            faults.push('center of '+label(e)+' ['+coords(r)+'] covered by '+label(hit));
        }
    }
    return [...new Set(faults)];
}"""


async def measure(page, route, state, report):
    for issue in await page.evaluate(MEASURE):
        report(route, state, issue)


async def check_deck(page, route, report):
    next_button = page.locator("button#next")
    if not await next_button.count():
        return
    counter = page.locator("#slide-count, #slideCount, #count")
    count = re.search(r"/\s*(\d+)", await counter.inner_text())
    if not count:
        report(route, "deck", "missing slide count")
        return
    for number in range(2, int(count.group(1)) + 1):
        await next_button.click()
        await counter.filter(has_text=re.compile(rf"^\s*{number}\s*/")).wait_for()
        await measure(page, route, f"slide {number}", report)
        if number == 2:
            answer = page.get_by_text(re.compile(r"^Reveal (?:the )?answer$", re.I)).filter(visible=True)
            if await answer.count():
                await answer.first.click()
                await measure(page, route, "worked answer open", report)
            else:
                report(route, "second slide", "missing revealable answer")


async def check_module(page, route, report):
    tabs = page.locator("#siteNav button[data-tab]")
    if not await tabs.count():
        report(route, "module", "missing section navigation")
        return
    for tab in await tabs.all():
        name = await tab.get_attribute("data-tab")
        if name == "overview":
            continue
        if not await tab.is_visible():
            toggle = page.locator("#menuToggle")
            await toggle.click()
            await measure(page, route, "module menu open", report)
            if not await tab.is_visible():
                report(route, name, "section inaccessible through mobile menu")
                continue
        await tab.click()
        section = page.locator(f'[data-section="{name}"],#page-{name}')
        if not await section.first.is_visible():
            report(route, name, "selected panel hidden")
            continue
        await measure(page, route, name, report)
        for frame in await section.locator("iframe:visible").all():
            if not await frame.get_attribute("title"):
                report(route, name, "visible iframe lacks an accessible title")
            if not await frame.get_attribute("src"):
                report(route, name, "visible iframe lacks a source")
                continue
            source = await frame.evaluate("f => f.src")
            if urlsplit(source).netloc != urlsplit(page.url).netloc:
                continue
            await frame.scroll_into_view_if_needed()
            handle = await frame.element_handle()
            # Firefox can finish loading the requested resource before it announces
            # the iframe navigation to Playwright. Check the rendered document.
            try:
                await page.wait_for_function("""frame => {
                    const doc = frame.contentDocument;
                    return doc && doc.readyState === "complete" &&
                           doc.location.pathname === new URL(frame.src).pathname &&
                           doc.getElementById("tr-global-nav") !== null;
                }""", arg=handle)
            except BrowserError as exc:
                report(route, name + " iframe", f"Could not render {source}: {exc}")
                continue
            child = await handle.content_frame()
            if child is None:
                report(route, name, "visible iframe has no document")
                continue
            await measure(child, route, name + " iframe", report)


async def run_viewport(browser, args, paths, width, height):
    context = await browser.new_context(viewport={"width":width,"height":height},
                                        reduced_motion="reduce", service_workers="block")
    # The question form is the only third-party frame. Course requests can
    # reach the local server without a Playwright callback on every asset.
    await context.route("https://docs.google.com/forms/**", lambda route:
                        route.fulfill(status=200, content_type="text/html", body=""))
    page = await context.new_page()
    page.set_default_timeout(10000)
    failures = []
    def report(path, state, description):
        line = f"{width}x{height} {path} [{state}] {description}"
        if line not in failures:
            failures.append(line)
            print(line, flush=True)

    for path in paths:
        url = urljoin(args.url.rstrip("/")+"/",path)
        try:
            response = await page.goto(url, wait_until="load", timeout=18000)
            if response is None or not response.ok:
                report(path, "load", f"HTTP {response.status if response else 'missing'}")
                continue
            await measure(page, path, "entry", report)
            links = await page.locator("#tr-global-nav a:visible").evaluate_all(
                "links => links.map(a => a.href)"
            )
            for name in ("index.html", "navigate.html"):
                target = urljoin(args.url.rstrip("/") + "/", name)
                if target not in links:
                    report(path, "entry", f"missing visible navigation to {name}")
            if path.endswith("/slides.html"):
                await check_deck(page, path, report)
            elif path.endswith("/index.html") and path.rsplit("/", 1)[0] in INTERACTIVE_SAMPLES:
                await check_module(page, path, report)
            if args.screenshots and path in args.capture:
                name = path.replace("/","_").removesuffix(".html")
                await page.screenshot(path=args.screenshots/f"{width}x{height}-{name}.png")
        except BrowserError as exc:
            report(path, "interaction", str(exc))
    await context.close()
    print(f"{width}x{height}: rendered {len(paths)} pages, {len(failures)} issues", flush=True)
    return len(failures)


async def main(args):
    paths = sorted(p.relative_to(args.root).as_posix()
                   for p in args.root.rglob("*.html") if ".git" not in p.parts)
    if args.match:
        paths = [p for p in paths if args.match in p]
    if not paths:
        raise SystemExit("No HTML pages selected")
    if args.screenshots:
        args.screenshots.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as pw:
        engine = getattr(pw,args.browser)
        binary = os.environ.get("CHROME_BIN") if args.browser == "chromium" else None
        browser = await engine.launch(executable_path=binary)
        try:
            failures = await asyncio.gather(*(run_viewport(browser,args,paths,w,h) for w,h in VIEWPORTS))
        finally:
            await browser.close()
    if sum(failures):
        raise SystemExit(f"{sum(failures)} rendered issues across {len(paths)} pages and {len(VIEWPORTS)} viewports")


if __name__ == "__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url", help="Root URL of served TeachReach checkout")
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--match", help="Inspect only paths containing this text")
    parser.add_argument("--engine","--browser",dest="browser", choices=["chromium","firefox","webkit"], default="chromium")
    parser.add_argument("--screenshots",type=Path,help="Save selected views for manual inspection")
    parser.add_argument("--capture",nargs="*",default=["index.html","navigate.html",
        "courses/ml-foundations/module-04/slides.html","courses/neurosymbolic-ai/module-16/slides.html"])
    asyncio.run(main(parser.parse_args()))
