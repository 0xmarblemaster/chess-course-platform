"""Browser check for the trainers slider + coach videos (.ralph-trainers-video-spec.md).

Run from the repo root: python3 tests/trainers-carousel.browser.py
Serves public/ on :8790 itself; screenshots go to /tmp/trainers-shots/.
"""
import os
import subprocess
import sys
import time
import urllib.request

from playwright.sync_api import sync_playwright

PORT = 8790
BASE = f"http://127.0.0.1:{PORT}"
PAGES = ["/main/", "/main/en/", "/main/kk/"]
VIEWPORTS = {"desktop": (1440, 900), "mobile": (390, 844), "narrow": (320, 640)}
SHOTS = "/tmp/trainers-shots"
failures = []


def check(cond, msg):
    print(("  ok   " if cond else "  FAIL ") + msg)
    if not cond:
        failures.append(msg)


def step(page, button):
    """Click Back/Next and wait for the smooth scroll to land (the counter changes, then scrollLeft stops moving)."""
    before = page.locator(".tr-count").inner_text()
    if isinstance(button, str):
        page.keyboard.press(button)
    else:
        button.click()
    page.wait_for_function("t => document.querySelector('.tr-count').textContent !== t", arg=before, timeout=5000)
    page.wait_for_function(
        """() => new Promise(r => { const t = document.querySelector('#trainers .trainers'), x = t.scrollLeft;
            setTimeout(() => r(t.scrollLeft === x), 250); })"""
    )


def run(browser, path, label, size):
    print(f"{path} @ {label} {size[0]}x{size[1]}")
    ctx = browser.new_context(viewport={"width": size[0], "height": size[1]})
    page = ctx.new_page()
    mp4 = []
    page.on("request", lambda r: mp4.append(r.url) if ".mp4" in r.url else None)
    page.goto(BASE + path, wait_until="load")
    section = page.locator("#trainers")
    section.scroll_into_view_if_needed()
    page.wait_for_timeout(300)
    prev, nxt, count = page.locator('[data-tr="prev"]'), page.locator('[data-tr="next"]'), page.locator(".tr-count")

    check(page.locator("#trainers li.trainer").count() == 5, "5 cards")
    check(prev.is_disabled(), "Back disabled at start")
    first = count.inner_text()
    check(first == ("1–3 / 5" if label == "desktop" else "1 / 5"), f"start counter {first!r}")
    overflow = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    # the trainers section never sticks out of the viewport (the track scrolls inside itself)
    sticking = page.evaluate("""() => { const W = document.documentElement.clientWidth;
        return [...document.querySelectorAll('#trainers *')].filter(e => !e.closest('.trainers') && e.getBoundingClientRect().right > W + 1).length
            + (document.querySelector('#trainers .trainers').getBoundingClientRect().right > W + 1 ? 1 : 0) }""")
    check(sticking == 0, "trainers section fits the viewport")
    if label == "narrow":
        # at 320px the header burger/branch tabs already overflow at HEAD (pre-existing, outside this section)
        print(f"  note page overflow at 320px: {overflow}px (pre-existing header)")
    else:
        check(overflow <= 0, f"no horizontal page overflow ({overflow}px)")
    lang = path.strip("/").replace("main", "").strip("/") or "ru"
    section.screenshot(path=f"{SHOTS}/{lang}-{label}-start.png")

    clicks = 0
    while not nxt.is_disabled() and clicks < 10:
        step(page, nxt)
        clicks += 1
    last = count.inner_text()
    check(nxt.is_disabled() and clicks == (2 if label == "desktop" else 4), f"Next until disabled ({clicks} clicks)")
    check(last != first and last.endswith("5 / 5"), f"end counter {last!r}")
    check(not prev.is_disabled(), "Back enabled at end")
    section.screenshot(path=f"{SHOTS}/{lang}-{label}-end.png")

    # keyboard: ArrowLeft on the focused region moves back one card
    page.locator(".tr-slider").focus()
    step(page, "ArrowLeft")
    check(count.inner_text() != last, f"ArrowLeft moves ({count.inner_text()!r})")
    while not prev.is_disabled():
        step(page, prev)

    check(not mp4, f"no .mp4 request before play ({len(mp4)})")
    if label == "narrow":
        ctx.close()
        return

    # play card 1, then card 2 → card 1 paused (mute so headless autoplay policy can't block play())
    page.evaluate("document.querySelectorAll('.trainer-video').forEach(v => v.muted = true)")
    plays = page.locator(".trainer-play")
    plays.nth(0).click()
    page.wait_for_function("!document.querySelectorAll('.trainer-video')[0].paused", timeout=10000)
    check(page.evaluate("document.querySelectorAll('.trainer-video')[0].controls"), "card 1 shows controls after play")
    check(plays.nth(0).is_hidden(), "card 1 overlay hidden")
    check(mp4 != [], "mp4 requested after play")
    if label == "mobile":
        step(page, nxt)
        check(page.evaluate("document.querySelectorAll('.trainer-video')[0].paused"), "Next pauses the playing video")
    plays.nth(1).click()
    page.wait_for_function("!document.querySelectorAll('.trainer-video')[1].paused", timeout=10000)
    check(page.evaluate("document.querySelectorAll('.trainer-video')[0].paused"), "card 1 paused after playing card 2")
    section.screenshot(path=f"{SHOTS}/{lang}-{label}-playing.png")

    # ended → poster + overlay again (http.server has no Range support, so fire the event instead of seeking)
    page.evaluate("document.querySelectorAll('.trainer-video')[1].dispatchEvent(new Event('ended'))")
    page.wait_for_function("!document.querySelectorAll('.trainer-video')[1].controls", timeout=10000)
    check(plays.nth(1).is_visible(), "overlay back after ended")

    # scrolling the page away pauses (IntersectionObserver)
    plays.nth(1).click()
    page.wait_for_function("!document.querySelectorAll('.trainer-video')[1].paused", timeout=10000)
    page.locator("#signup").scroll_into_view_if_needed()
    page.wait_for_function("document.querySelectorAll('.trainer-video')[1].paused", timeout=5000)
    check(True, "leaving the viewport pauses the video")
    ctx.close()


def main():
    os.makedirs(SHOTS, exist_ok=True)
    server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "--bind", "127.0.0.1", "--directory", "public"],
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
            for path in PAGES:
                for label, size in VIEWPORTS.items():
                    run(browser, path, label, size)
            browser.close()
    finally:
        server.terminate()
    print(f"\n{len(failures)} failure(s)" if failures else "\nall browser checks passed")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
