"""Browser check for the founder letter reel (#about, option A).

Run from the repo root: python3 tests/founder-letter.browser.py
Serves public/ on :8791 itself; screenshots go to /tmp/founder-shots/.
"""
import os
import subprocess
import sys
import time
import urllib.request

from playwright.sync_api import sync_playwright

PORT = 8791
BASE = f"http://127.0.0.1:{PORT}"
PAGES = ["/main/", "/main/en/", "/main/kk/"]
VIEWPORTS = {"desktop": (1440, 900), "mobile": (390, 844), "narrow": (320, 640)}
SHOTS = "/tmp/founder-shots"
failures = []


def check(cond, msg):
    print(("  ok   " if cond else "  FAIL ") + msg)
    if not cond:
        failures.append(msg)


def run(browser, path, label, size):
    print(f"{path} @ {label} {size[0]}x{size[1]}")
    page = browser.new_context(viewport={"width": size[0], "height": size[1]}).new_page()
    mp4 = []
    page.on("request", lambda r: mp4.append(r.url) if ".mp4" in r.url else None)
    page.goto(BASE + path, wait_until="networkidle")
    about = page.locator("#about")
    about.scroll_into_view_if_needed()
    page.wait_for_timeout(300)
    reel = page.locator("#about .v2-reel").bounding_box()
    if label == "desktop":
        body = page.locator("#about .v2-letter-body").bounding_box()
        check(reel["x"] + reel["width"] <= body["x"], "reel sits left of the letter")
    else:
        text = page.locator("#about .v2-pledge").bounding_box()
        sign = page.locator("#about .v2-sign").bounding_box()
        check(text["y"] + text["height"] <= reel["y"], "reel sits below the letter text")
        check(reel["y"] + reel["height"] <= sign["y"], "reel sits above the signature")
    check(abs(reel["height"] / reel["width"] - 16 / 9) < 0.02, "reel is 9:16")
    overflow = page.evaluate("[...document.querySelectorAll('#about *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).length")
    check(overflow == 0, f"no horizontal overflow in #about ({overflow})")
    check(page.locator("#about .v2-monogram").is_visible(), "monogram visible")
    about.screenshot(path=f"{SHOTS}/{path.strip('/').replace('/', '-')}-{label}.png")
    check(not mp4, f"no .mp4 request before play ({len(mp4)})")
    if label != "desktop":
        return
    page.evaluate("document.querySelectorAll('video').forEach(v => v.muted = true)")
    page.locator(".v2-reel-play").click()
    page.wait_for_function("!document.querySelector('.v2-reel-video').paused", timeout=10000)
    check(page.evaluate("document.querySelector('.v2-reel-video').controls"), "controls after play")
    check(not page.locator(".v2-reel-play").is_visible(), "play overlay hidden while playing")
    page.locator("#trainers").scroll_into_view_if_needed()
    page.locator(".trainer-play").first.click()
    page.wait_for_function("!document.querySelectorAll('.trainer-video')[0].paused", timeout=10000)
    check(page.evaluate("document.querySelector('.v2-reel-video').paused"), "playing a trainer video pauses the reel")
    page.evaluate("document.querySelector('.v2-reel-video').dispatchEvent(new Event('ended'))")
    page.wait_for_function("!document.querySelector('.v2-reel-video').controls", timeout=5000)
    check(page.locator(".v2-reel-play").get_attribute("hidden") is None, "overlay back after ended")


def main():
    os.makedirs(SHOTS, exist_ok=True)
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", "public", "-b", "127.0.0.1"],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                urllib.request.urlopen(BASE + "/main/")
                break
            except Exception:
                time.sleep(0.1)
        with sync_playwright() as p:
            browser = p.chromium.launch(args=["--no-sandbox", "--autoplay-policy=no-user-gesture-required"])
            for path in PAGES:
                for label, size in VIEWPORTS.items():
                    run(browser, path, label, size)
            browser.close()
    finally:
        srv.terminate()
    print(f"\n{'FAIL' if failures else 'PASS'}: {len(failures)} failure(s)")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
