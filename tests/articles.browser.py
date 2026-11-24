"""Browser check for the articles block on the landing, the /articles index and the article pages
/articles/<slug> (.ralph-articles-spec.md, .ralph-articles-admin-spec.md §7).

Run from the repo root: python3 tests/articles.browser.py
Serves public/ on :8791 itself (the static files = what /articles falls back to without the DB);
with ARTICLES_BASE=http://127.0.0.1:3917 (tests/support/articles-stack.sh) it also checks the
DB-rendered index, one article page per language, landing card → article page and old
/articles#<slug> links on the running app.
Screenshots: /tmp/articles-shots/ (static), /root/clawd/files/5731393254/articles-admin/ (app).
"""
import json
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
URLS = {"ru": "/articles", "en": "/en/articles", "kk": "/kz/articles"}  # where landing cards point
VIEWPORTS = {"desktop": (1440, 900), "mobile": (390, 844)}
SHOTS = "/tmp/articles-shots"
APP_SHOTS = "/root/clawd/files/5731393254/articles-admin"
ARTICLE = "focus"  # the article page checked in every language
APP = os.environ.get("ARTICLES_BASE")
APP_MODE = False  # article pages and redirects exist only on the app, not on the static server
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
    check(page.locator(".pa-article, .pa-full").count() == 0, "index only: no full articles")
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

    if APP_MODE:
        # Old shared links /articles#<slug> land on the article's own page.
        page = ctx.new_page()
        page.goto(BASE + ARTICLES[lang] + "#" + ARTICLE, wait_until="load")
        page.wait_for_url(f"**{ARTICLES[lang]}/{ARTICLE}")
        check(page.locator("h1").count() == 1 and page.locator(".pa-article").count() == 1, f"#{ARTICLE} redirects to {ARTICLES[lang]}/{ARTICLE}")
    ctx.close()


def article_page(browser, lang, label, size):
    path = f"{ARTICLES[lang]}/{ARTICLE}"
    print(f"{path} @ {label}")
    ctx = browser.new_context(viewport={"width": size[0], "height": size[1]})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    res = page.goto(BASE + path, wait_until="load")
    page.evaluate("document.fonts.ready.then(() => 0)")
    check(res.status == 200, "200")
    check(no_overflow(page), "no horizontal page overflow")
    check(page.locator(".pa-article").count() == 1 and page.locator("h1").is_visible(), "one article, title visible")
    check(page.locator(".pa-crumbs a").count() == 2, "breadcrumb: home → articles → title")
    text = page.locator(".pa-text p").first.bounding_box()
    check(text and text["width"] <= size[0], "body text within the viewport")
    cta = page.locator(".pa-box .btn")
    cta.scroll_into_view_if_needed()
    box = cta.bounding_box()
    check(cta.is_visible() and box["x"] >= 0 and box["x"] + box["width"] <= size[0], "free-trial CTA visible")
    check(page.locator(".pa-box-wa").is_visible(), "WhatsApp link visible")
    more = page.locator(".pa-more .pa-card")
    check(2 <= more.count() <= 3, f"{more.count()} more articles")
    check(page.locator(".pa-back").is_visible(), "back to all articles")
    check(not errors, f"no JS errors {errors}")
    page.evaluate("window.scrollTo(0, 0)")
    page.screenshot(path=f"{SHOTS}/article-{lang}-{label}.png", full_page=True)
    more.first.click()
    page.wait_for_load_state("load")
    check(page.locator(".pa-article").count() == 1 and f"/{ARTICLE}" not in page.url, f"a 'more' card opens another article ({page.url.split('/')[-1]})")
    ctx.close()


def landing_click(browser, lang, label, size):
    print(f"{LANDING[lang]} → article @ {label}")
    ctx = browser.new_context(viewport={"width": size[0], "height": size[1]})
    page = ctx.new_page()
    page.goto(BASE + LANDING[lang], wait_until="networkidle")
    card = page.locator("#articles .qb").first
    href = card.get_attribute("href")
    card.scroll_into_view_if_needed()
    card.click()
    page.wait_for_url(f"**{href}")
    check(page.url.endswith(href) and page.locator(".pa-article").count() == 1, f"first card opens {href}")
    ctx.close()


def landing_swap(browser, lang):
    """v2.js swaps the 4 cards for /api/articles results; anything else leaves the static cards."""
    print(f"{LANDING[lang]}: cards from /api/articles")
    fake = [{"slug": f"test-swap-{i}", "topic": "tournaments", "title": f"Swapped {i}", "teaser": f"Teaser {i}", "read_minutes": 9}
            for i in range(4)]
    for label, articles_json, swapped in (("4 articles", fake, True), ("3 articles", fake[:3], False), ("API error", None, False)):
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        def handle(route):
            if articles_json is None:
                route.fulfill(status=503, body="{}")
            else:
                route.fulfill(status=200, content_type="application/json", body=json.dumps({"articles": articles_json}))
        page.route("**/api/articles?*", handle)
        with page.expect_response("**/api/articles?*"):
            page.goto(BASE + LANDING[lang], wait_until="load")
        page.wait_for_timeout(200)
        cards = page.locator("#articles .qb")
        hrefs = [c.get_attribute("href") for c in cards.all()]
        titles = [c.locator("h3").inner_text() for c in cards.all()]
        check(cards.count() == 4, f"{label}: still 4 cards")
        if swapped:
            check(all(h == f"{URLS[lang]}/test-swap-{i}" for i, h in enumerate(hrefs)), f"{label}: links point to /articles/<api slug>")
            check(titles == [f"Swapped {i}" for i in range(4)], f"{label}: titles swapped")
            check(all("9" in c.locator(".qb-foot > span").first.inner_text() for c in cards.all()), f"{label}: read minutes swapped")
            tag = {"ru": "Турниры", "en": "Tournaments", "kk": "Турнирлер"}[lang]
            check(all(c.locator(".qb-tag").text_content() == tag for c in cards.all()), f"{label}: topic label localized")
        else:
            check(hrefs[0] == f"{URLS[lang]}/age-to-start" and "Swapped" not in "".join(titles), f"{label}: static cards kept")
        page.close()


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


def run_all(browser):
    header_fit(browser)
    for lang in LANGS:
        landing_swap(browser, lang)
        for label, size in VIEWPORTS.items():
            landing(browser, lang, label, size)
            articles(browser, lang, label, size)
            if APP_MODE:
                article_page(browser, lang, label, size)
                landing_click(browser, lang, label, size)


def main():
    global BASE, LANDING, ARTICLES, SHOTS, APP_MODE
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
            run_all(browser)
            if APP:
                # Same checks on the app: /articles rendered from the DB, landing at its short URLs.
                BASE, SHOTS, APP_MODE = APP, APP_SHOTS, True
                LANDING = {"ru": "/ru", "en": "/en", "kk": "/kz"}
                ARTICLES = URLS
                os.makedirs(SHOTS, exist_ok=True)
                print(f"\n--- app at {APP} ---")
                for lang, path in ARTICLES.items():
                    page = browser.new_page()
                    page.goto(BASE + path, wait_until="load")
                    check("MOCK ARTICLES" not in page.content(), f"{path} is rendered from the DB")
                    page.close()
                run_all(browser)
            browser.close()
    finally:
        server.terminate()
    if failures:
        print(f"\n{len(failures)} failure(s)")
        sys.exit(1)
    print("\nall passed")


if __name__ == "__main__":
    main()
