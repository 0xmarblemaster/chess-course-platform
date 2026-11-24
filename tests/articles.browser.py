"""Browser check for the articles block on the landing and the /articles pages (.ralph-articles-spec.md).

Run from the repo root: python3 tests/articles.browser.py
Serves public/ on :8791 itself; screenshots go to /tmp/articles-shots/.
"""
import os
import subprocess
import sys
import time
import urllib.request

from playwright.sync_api import sync_playwright

PORT = 8791
BASE = f"http://127.0.0.1:{PORT}"
LANGS = {"ru": "Статьи", "en": "Articles", "kk": "Мақалалар"}
LANDING = {"ru": "/main/", "en": "/main/en/", "kk": "/main/kk/"}
ARTICLES = {"ru": "/main/articles/", "en": "/main/articles/en/", "kk": "/main/articles/kk/"}
VIEWPORTS = {"desktop": (1440, 900), "mobile": (390, 844)}
SHOTS = "/tmp/articles-shots"
failures = []


def check(cond, msg):
    print(("  ok   " if cond else "  FAIL ") + msg)
    if not cond:
        failures.append(msg)


def no_overflow(page):
    return page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")


def landing(browser, lang, label, size):
    print(f"{LANDING[lang]} @ {label}")
    ctx = browser.new_context(viewport={"width": size[0], "height": size[1]})
    page = ctx.new_page()
    page.goto(BASE + LANDING[lang], wait_until="load")
    check(no_overflow(page), "no horizontal page overflow")
    sec = page.locator("#articles")
    sec.evaluate("e => e.scrollIntoView({ behavior: 'instant', block: 'start' })")
    page.wait_for_timeout(300)
    boxes = [c.bounding_box() for c in sec.locator(".qb").all()]
    check(len(boxes) == 4, "4 cards")
    rail = sec.locator(".qb-rail")
    if label == "desktop":
        check(len({round(b["y"]) for b in boxes}) == 1, "all 4 cards in one row")
        vw = size[0]
        check(all(b["x"] >= 0 and b["x"] + b["width"] <= vw for b in boxes), "all 4 cards visible")
        check(rail.evaluate("r => r.scrollWidth <= r.clientWidth"), "rail does not scroll")
    else:
        check(rail.evaluate("r => r.scrollWidth > r.clientWidth + 50"), "rail scrolls horizontally")
        check(boxes[1]["x"] < size[0], "next card peeks in")
        rail.evaluate("r => { r.style.scrollBehavior = 'auto'; r.scrollLeft = 400 }")
        page.wait_for_timeout(300)
        check(rail.evaluate("r => r.scrollLeft") > 0, "rail moved after scrolling")
        rail.evaluate("r => r.scrollLeft = 0")
        page.wait_for_timeout(200)
    sec.screenshot(path=f"{SHOTS}/landing-{lang}-{label}.png")

    if label == "mobile":
        page.evaluate("window.scrollTo(0, 0)")
        page.locator(".burger").click()
        link = page.locator("#main-nav a[href='#articles']")
        check(link.is_visible() and link.inner_text().strip() == LANGS[lang], f"burger shows the {LANGS[lang]} link")
        page.screenshot(path=f"{SHOTS}/burger-{lang}.png")
        link.click()
        page.wait_for_timeout(1200)
        check(page.locator(".burger").get_attribute("aria-expanded") == "false", "burger closes on click")
        top = page.evaluate("document.getElementById('articles').getBoundingClientRect().top")
        check(0 <= top < 120, f"scrolled to #articles (top={top:.0f})")
    ctx.close()


def articles(browser, lang, label, size):
    print(f"{ARTICLES[lang]} @ {label}")
    ctx = browser.new_context(viewport={"width": size[0], "height": size[1]})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(BASE + ARTICLES[lang], wait_until="load")
    check(no_overflow(page), "no horizontal page overflow")
    page.screenshot(path=f"{SHOTS}/articles-{lang}-{label}.png", full_page=True)
    cards = page.locator(".pa-list [data-cat]")
    total = cards.count()
    check(total >= 6, f"{total} cards")
    chip = page.locator(".pa-chip[data-filter='tournaments']")
    chip.click()
    check(chip.get_attribute("aria-pressed") == "true", "chip is pressed")
    visible = [c.get_attribute("data-cat") for c in cards.all() if c.is_visible()]
    check(visible and all(v == "tournaments" for v in visible), f"only tournament cards shown ({len(visible)})")
    page.locator(".pa-list").screenshot(path=f"{SHOTS}/articles-{lang}-{label}-filtered.png")
    page.locator(".pa-chip[data-filter='all']").click()
    check(sum(c.is_visible() for c in cards.all()) == total, "'all' shows every card again")
    check(not errors, f"no JS errors {errors}")
    ctx.close()

    ctx = browser.new_context(viewport={"width": size[0], "height": size[1]})
    page = ctx.new_page()
    page.goto(BASE + ARTICLES[lang] + "#focus", wait_until="load")
    # html has scroll-behavior:smooth, so wait for the jump to finish
    ys = []
    for _ in range(40):
        ys.append(page.evaluate("scrollY"))
        if len(ys) >= 4 and ys[-1] > 0 and len(set(ys[-4:])) == 1:
            break
        page.wait_for_timeout(250)
    header = page.evaluate("document.querySelector('.site-header').getBoundingClientRect().bottom")
    h2 = page.locator("#focus h2").bounding_box()
    check(header <= h2["y"] < size[1] / 2, f"#focus heading below the sticky header (header {header:.0f}, h2 {h2['y']:.0f})")
    page.screenshot(path=f"{SHOTS}/articles-{lang}-{label}-focus.png")
    ctx.close()


def header_fit(browser):
    """The menu gained an item: the header must still fit between the burger breakpoint and full desktop."""
    print("header fit")
    for lang, path in ARTICLES.items():
        for w in (1121, 1160, 1280, 1366, 1440, 1920):
            page = browser.new_page(viewport={"width": w, "height": 800})
            page.goto(BASE + path, wait_until="load")
            page.evaluate("document.fonts.ready.then(() => 0)")
            spill = page.evaluate("""Math.round(document.querySelector('.header-actions').getBoundingClientRect().right
                - document.querySelector('.header-inner').getBoundingClientRect().right)""")
            check(no_overflow(page) and spill <= 0, f"{lang} @ {w}px: header row fits the page width (spill {spill}px)")
            if lang == "kk" and w == 1280:
                page.locator(".burger").click()
                check(page.locator("#main-nav a[aria-current='page']").is_visible(), "kk @ 1280px: burger menu opens")
                page.screenshot(path=f"{SHOTS}/burger-kk-1280.png")
            page.close()


def main():
    os.makedirs(SHOTS, exist_ok=True)
    server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "--directory", "public"],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                urllib.request.urlopen(BASE + "/main/", timeout=1)
                break
            except OSError:
                time.sleep(0.1)
        with sync_playwright() as p:
            browser = p.chromium.launch()
            header_fit(browser)
            for lang in LANGS:
                for label, size in VIEWPORTS.items():
                    landing(browser, lang, label, size)
                    articles(browser, lang, label, size)
            browser.close()
    finally:
        server.terminate()
    if failures:
        print(f"\n{len(failures)} failure(s)")
        sys.exit(1)
    print("\nall passed")


if __name__ == "__main__":
    main()
