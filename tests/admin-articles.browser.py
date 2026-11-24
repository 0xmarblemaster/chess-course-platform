"""Browser check for the articles admin (/admin/articles, .ralph-articles-admin-spec.md §4).

Needs the local stack (nothing touches the real DB):
  bash tests/support/articles-stack.sh start && set -a && . /tmp/articles-stack/env && set +a
  python3 tests/admin-articles.browser.py
The sign-in gate (form, wrong password, non-admin, admin, sign-out), then — signed in as the
stub's admin by putting its articles-project session into localStorage — list, filters, create
(validation, rich text, cover upload, preview), save draft, publish, unpublish, delete, API keys,
mobile. Rows it creates use the prefix "test-" and are deleted at the end.
Screenshots: /root/clawd/files/5731393254/articles-admin/.
"""
import json
import os
import re
import sys
import time
import urllib.request

from playwright.sync_api import expect, sync_playwright

BASE = os.environ.get("ARTICLES_BASE", "http://127.0.0.1:3917")
# The articles project, with the same fallbacks as the app (src/lib/articles/db.ts, browser.ts).
SB = os.environ.get("ARTICLES_SUPABASE_URL") or os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SERVICE = os.environ.get("ARTICLES_SUPABASE_SECRET_KEY") or os.environ["SUPABASE_SERVICE_ROLE_KEY"]
ANON = os.environ.get("NEXT_PUBLIC_ARTICLES_SUPABASE_ANON_KEY") or os.environ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
STORAGE_KEY = "ce-articles-auth"  # auth.storageKey of the articles browser client
ADMIN = (os.environ.get("ARTICLES_ADMIN_EMAIL", "admin@articles.test"), os.environ.get("ARTICLES_ADMIN_PASSWORD", "admin-pass-123"))
STUDENT = (os.environ.get("ARTICLES_USER_EMAIL", "student@articles.test"), os.environ.get("ARTICLES_USER_PASSWORD", "student-pass-123"))
SHOTS = "/root/clawd/files/5731393254/articles-admin"
RUN = format(int(time.time()), "x")
SLUG = f"test-admin-{RUN}"
KEY_NAME = f"test-key-ui-{RUN}"
# smallest valid PNG (1×1)
PNG = bytes.fromhex("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360f8cfc0f01f0005000201e5273de80000000049454e44ae426082")
failures = []


def check(cond, msg):
    print(("  ok   " if cond else "  FAIL ") + msg)
    if not cond:
        failures.append(msg)


def http(method, url, body=None, headers=None):
    req = urllib.request.Request(url, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Content-Type": "application/json", **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def session(email, password):
    status, body = http("POST", f"{SB}/auth/v1/token?grant_type=password", {"email": email, "password": password}, {"apikey": ANON})
    assert status == 200, f"sign-in failed for {email}: {status} {body}"
    return json.loads(body)


def signed_in(browser, sess, size):
    """A context whose localStorage already holds the articles-project session."""
    ctx = browser.new_context(viewport={"width": size[0], "height": size[1]})
    ctx.add_init_script(f"localStorage.setItem({json.dumps(STORAGE_KEY)}, {json.dumps(json.dumps(sess))})")
    return ctx


def public_status(path):
    for _ in range(10):
        status, _ = http("GET", BASE + path)
        yield status
        time.sleep(0.5)


def wait_status(path, want):
    return any(s == want for s in public_status(path))


def no_overflow(page):
    return page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")


def row(page, slug):
    return page.locator(f"[data-slug='{slug}']:visible")


def sign_in(page, email, password):
    page.get_by_label("Email").fill(email)
    page.get_by_label("Пароль").fill(password)
    page.get_by_role("button", name="Войти").click()


def guard(browser):
    print("sign-in gate")
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()
    page.goto(BASE + "/admin/articles")
    expect(page.get_by_role("heading", name="Вход для администраторов")).to_be_visible(timeout=30000)
    check("/admin/articles" in page.url, "signed out: sign-in form on /admin/articles itself")
    check(page.locator("form").get_by_role("link").count() == 0, "no sign-up / magic links on the form")
    page.screenshot(path=f"{SHOTS}/admin-login.png")
    sign_in(page, ADMIN[0], "wrong-password")
    expect(page.locator("form").get_by_role("alert")).to_contain_text("Invalid login credentials", timeout=15000)
    check(True, "wrong password: error shown")
    sign_in(page, *STUDENT)
    expect(page.get_by_text("Нет прав администратора")).to_be_visible(timeout=15000)
    check(True, "non-admin: 'Нет прав администратора'")
    page.get_by_role("button", name="Выйти").click()
    expect(page.get_by_role("heading", name="Вход для администраторов")).to_be_visible(timeout=15000)
    check(True, "non-admin can sign out")
    sign_in(page, *ADMIN)
    expect(page.get_by_role("heading", name="Articles", exact=True)).to_be_visible(timeout=30000)
    check(True, "admin signs in through the form")
    keys = page.evaluate("Object.keys(localStorage)")
    check(STORAGE_KEY in keys and not any(k.startswith("sb-") for k in keys), f"session stored under {STORAGE_KEY} only")
    page.get_by_role("button", name="Выйти").click()
    expect(page.get_by_role("heading", name="Вход для администраторов")).to_be_visible(timeout=15000)
    check(STORAGE_KEY not in page.evaluate("Object.keys(localStorage)"), "header 'Выйти' signs out")
    ctx.close()


def desktop_flow(browser, admin):
    print("list (desktop)")
    ctx = signed_in(browser, admin, (1440, 900))
    page = ctx.new_page()
    page.on("dialog", lambda d: d.accept())
    page.goto(BASE + "/admin/articles")
    expect(page.get_by_role("heading", name="Articles", exact=True)).to_be_visible(timeout=30000)
    expect(row(page, "age-to-start")).to_be_visible(timeout=30000)
    check(page.locator("tbody tr").count() >= 6, f"{page.locator('tbody tr').count()} articles in the table")
    check(row(page, "age-to-start").get_by_text("Published").is_visible() and "★" in row(page, "age-to-start").inner_text(), "status badge + featured")
    view = row(page, "focus").get_by_role("link", name="View on site")
    check(view.get_attribute("href") == "/articles/focus", "View on site → /articles/focus")
    page.screenshot(path=f"{SHOTS}/admin-list-desktop.png", full_page=True)
    page.get_by_label("Search").fill("ФИДЕ")
    check(page.locator("tbody tr").count() == 1 and row(page, "fide-rating").is_visible(), "search by title")
    page.get_by_label("Search").fill("")
    page.get_by_label("Topic").select_option("tournaments")
    check(page.locator("tbody tr").count() == 2, "filter by topic")
    page.get_by_label("Topic").select_option("")
    page.get_by_label("Status").select_option("draft")
    check(page.locator("tbody tr").count() == 0, "filter by status (no drafts yet)")
    page.get_by_label("Status").select_option("")

    print("editor: create")
    page.get_by_role("link", name="New article").click()
    expect(page.get_by_role("heading", name="New article")).to_be_visible(timeout=30000)
    page.get_by_label("Title (RU)").fill("Тестовая статья из админки")
    check(page.get_by_label("Slug").input_value() == "testovaya-statya-iz-adminki", "slug auto-filled from the RU title")
    page.get_by_role("tab", name="EN").click()
    page.get_by_label("Title (EN)").fill("Admin test article")
    check(page.get_by_label("Slug").input_value() == "admin-test-article", "EN title takes over the slug")
    page.get_by_label("Slug").fill("Bad Slug")
    page.get_by_role("button", name="Save draft", exact=True).click()
    check(page.locator("#err-slug").is_visible(), "inline slug error")
    page.get_by_label("Slug").fill(SLUG)
    page.get_by_label("Topic").select_option("tournaments")

    page.get_by_role("tab", name="RU").click()
    page.get_by_label("Teaser (RU)").fill("Короткий тизер для проверки.")
    page.get_by_label("Author byline (RU)").fill("Тест Тестов, тренер")
    body = page.get_by_role("textbox", name="Text (RU)")
    body.click()
    page.keyboard.type("Первый абзац статьи. " * 30)
    page.keyboard.press("Control+A")
    page.get_by_role("button", name="Bold", exact=True).click()
    page.keyboard.press("End")
    page.keyboard.press("Enter")
    page.get_by_role("button", name="Heading", exact=True).click()
    page.keyboard.type("Подзаголовок")
    body.blur()
    est = page.get_by_label("Read minutes").input_value()
    check(est.isdigit() and int(est) >= 1, f"read minutes estimated from the text ({est})")
    check(page.get_by_text("Unsaved changes").is_visible(), "unsaved-changes marker")

    page.get_by_role("button", name="Publish", exact=True).click()
    check(page.locator("#err-body-en").is_visible() or page.locator("#err-title-kk").count() > 0, "publishing without EN/KZ text → inline errors")
    check(page.get_by_text("Please fix the highlighted fields").is_visible(), "error toast")

    page.get_by_role("button", name="Save draft", exact=True).click()
    page.wait_for_url(f"**/admin/articles/{SLUG}", timeout=30000)
    expect(page.get_by_text("Draft saved")).to_be_visible(timeout=15000)
    check(True, "draft saved → editor at /admin/articles/<slug>")
    frame = page.frame_locator("iframe[title='Article preview']")
    expect(frame.locator(".pa-article > h2")).to_have_text("Тестовая статья из админки", timeout=15000)
    check(frame.locator(".pa-text strong").count() >= 1 and frame.locator(".pa-text h2").count() == 1, "preview renders bold + heading in the public look")
    check(wait_status(f"/articles/{SLUG}", 404), "draft is not public (/articles/<slug> → 404)")

    print("editor: cover, translations, publish")
    page.locator("input[type=file][aria-label='Cover file']").set_input_files({"name": "cover.png", "mimeType": "image/png", "buffer": PNG})
    expect(page.get_by_alt_text("Cover preview")).to_have_attribute("src", re.compile(r"/article-covers/.+\.png$"), timeout=15000)
    check(True, "cover uploaded, preview shown")
    for tab, title, text in (("EN", "Admin test article", "English body text."), ("KZ", "Әкімші сынақ мақаласы", "Қазақша мәтін.")):
        page.get_by_role("tab", name=tab).click()
        page.get_by_label(f"Title ({tab})").fill(title)
        page.get_by_label(f"Teaser ({tab})").fill(f"{title} teaser")
        page.get_by_role("textbox", name=f"Text ({tab})").click()
        page.keyboard.type(text)
    page.screenshot(path=f"{SHOTS}/admin-editor-desktop.png", full_page=True)
    page.get_by_role("button", name="Publish", exact=True).click()
    expect(page.get_by_text("Published — live on the site")).to_be_visible(timeout=15000)
    check(page.get_by_text("Published", exact=True).first.is_visible(), "status badge: Published")
    check(wait_status(f"/articles/{SLUG}", 200) and wait_status(f"/kz/articles/{SLUG}", 200), "published → /articles/<slug> and /kz/… are live")
    _, html = http("GET", f"{BASE}/en/articles/{SLUG}")
    check("<h1>Admin test article</h1>" in html and "<strong>" not in html.split("<h1>")[0], "public page shows the EN title")

    print("editor: edit")
    page.get_by_role("tab", name="RU").click()
    page.get_by_label("Title (RU)").fill("Тестовая статья — правка")
    page.get_by_role("button", name="Update published", exact=True).click()
    expect(page.get_by_text("Published — live on the site")).to_be_visible(timeout=15000)
    _, html = http("GET", f"{BASE}/articles/{SLUG}")
    for _ in range(10):
        if "Тестовая статья — правка" in html:
            break
        time.sleep(0.5)
        _, html = http("GET", f"{BASE}/articles/{SLUG}")
    check("Тестовая статья — правка" in html, "edit is live on the article page")

    print("list: unpublish, publish, delete")
    page.get_by_role("button", name="Back to list", exact=True).click()
    expect(row(page, SLUG)).to_be_visible(timeout=30000)
    row(page, SLUG).get_by_role("button", name="Unpublish", exact=True).click()
    expect(row(page, SLUG).get_by_text("Draft")).to_be_visible(timeout=15000)
    check(wait_status(f"/articles/{SLUG}", 404), "unpublished → 404")
    row(page, SLUG).get_by_role("button", name="Publish", exact=True).click()
    expect(row(page, SLUG).get_by_text("Published")).to_be_visible(timeout=15000)
    check(wait_status(f"/articles/{SLUG}", 200), "published again from the list")
    row(page, SLUG).get_by_role("button", name="Delete", exact=True).click()
    dialog = page.get_by_role("alertdialog")
    check(dialog.is_visible() and "can't be undone" in dialog.inner_text(), "delete asks for confirmation")
    dialog.get_by_role("button", name="Delete", exact=True).click()
    expect(row(page, SLUG)).to_have_count(0, timeout=15000)
    check(wait_status(f"/articles/{SLUG}", 404), "deleted → 404")

    print("API keys")
    page.get_by_role("link", name="API keys").click()
    expect(page.get_by_role("heading", name="Articles API keys")).to_be_visible(timeout=30000)
    page.get_by_role("button", name="Create key", exact=True).click()
    check(page.get_by_text("Give the key a name").is_visible(), "key name required")
    page.get_by_label("Key name").fill(KEY_NAME)
    page.get_by_role("button", name="Create key", exact=True).click()
    new_key = page.get_by_test_id("new-key")
    expect(new_key).to_be_visible(timeout=15000)
    key = new_key.inner_text().strip()
    check(key.startswith("cea_") and "won't be shown again" in page.get_by_role("alert").filter(has_text="Copy the key").inner_text(), "plain key shown once with a warning")
    status, _ = http("GET", f"{BASE}/api/articles?all=1", headers={"Authorization": f"Bearer {key}"})
    check(status == 200, "the new key works")
    page.screenshot(path=f"{SHOTS}/admin-keys-desktop.png", full_page=True)
    page.get_by_role("button", name="Done", exact=True).click()
    item = page.locator("li", has_text=KEY_NAME)
    item.get_by_role("button", name="Revoke", exact=True).click()
    page.get_by_role("alertdialog").get_by_role("button", name="Revoke", exact=True).click()
    expect(item.get_by_text("Revoked")).to_be_visible(timeout=15000)
    status, _ = http("GET", f"{BASE}/api/articles?all=1", headers={"Authorization": f"Bearer {key}"})
    check(status == 401, "revoked key → 401")
    ctx.close()


def mobile(browser, admin):
    print("mobile (390)")
    ctx = signed_in(browser, admin, (390, 844))
    page = ctx.new_page()
    page.goto(BASE + "/admin/articles")
    expect(row(page, "age-to-start")).to_be_visible(timeout=30000)
    check(no_overflow(page), "list: no horizontal overflow")
    check(row(page, "age-to-start").get_by_role("link", name="Edit").is_visible(), "list: card layout with actions")
    page.screenshot(path=f"{SHOTS}/admin-list-mobile.png", full_page=True)
    row(page, "age-to-start").get_by_role("link", name="Edit").click()
    expect(page.get_by_label("Title (RU)")).to_have_value("С какого возраста отдавать ребёнка в шахматы?", timeout=30000)
    check(no_overflow(page), "editor: no horizontal overflow")
    check(page.get_by_role("button", name="Update published", exact=True).is_visible(), "editor: save buttons reachable")
    page.screenshot(path=f"{SHOTS}/admin-editor-mobile.png", full_page=True)
    ctx.close()


def cleanup():
    h = {"apikey": SERVICE, "Authorization": f"Bearer {SERVICE}"}
    http("DELETE", f"{SB}/rest/v1/articles?slug=like.test-*", headers=h)
    http("DELETE", f"{SB}/rest/v1/article_api_keys?name=like.test-key-*", headers=h)
    _, left = http("GET", f"{SB}/rest/v1/articles?slug=like.test-*&select=slug", headers=h)
    check(json.loads(left) == [], "cleanup: no test- articles left")


def main():
    os.makedirs(SHOTS, exist_ok=True)
    admin = session(*ADMIN)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            guard(browser)
            desktop_flow(browser, admin)
            mobile(browser, admin)
            browser.close()
    finally:
        cleanup()
    if failures:
        print(f"\n{len(failures)} failure(s)")
        sys.exit(1)
    print("\nall passed")


if __name__ == "__main__":
    main()
