from playwright.sync_api import sync_playwright
import time

def run_test(page):
    page.on("console", lambda msg: print(f"Browser console: {msg.text}"))
    page.goto("http://localhost:3000/hub.html")
    page.wait_for_timeout(1000)

    print("Attempting Email/Password Signup...")
    page.locator("#toggle-auth-mode").click() # Switch to signup
    page.wait_for_timeout(500)
    page.locator("#username").fill("TestUser" + str(int(time.time())))
    page.locator("#email").fill("test_" + str(int(time.time())) + "@example.com")
    page.locator("#password").fill("password123")
    page.locator("#action-btn").click()
    page.wait_for_timeout(2000)

    error_text2 = page.locator("#auth-error").inner_text()
    print(f"Auth Error (Signup): {error_text2}")

    is_visible = page.locator("#dashboard-section").is_visible()
    print(f"Dashboard visible? {is_visible}")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_test(page)
        browser.close()
