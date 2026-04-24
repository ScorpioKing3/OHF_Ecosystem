from playwright.sync_api import sync_playwright

def run_test(page):
    page.on("console", lambda msg: print(f"Browser console: {msg.text}"))
    page.goto("http://localhost:3000/hub.html")
    page.wait_for_timeout(1000)

    print("Attempting Guest Login without entering anything in the form...")
    page.locator("#guest-btn").click()
    page.wait_for_timeout(2000)

    error_text = page.locator("#auth-error").inner_text()
    print(f"Auth Error (Guest): {error_text}")

    # We expect 'Firebase: Error (auth/admin-restricted-operation).' because anon auth is disabled,
    # but NOT standard HTML validation popups preventing the click from happening.

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_test(page)
        browser.close()
