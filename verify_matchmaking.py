from playwright.sync_api import sync_playwright
import time
import os

def run_test(page):
    page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

    # 1. Sign up on Hub to get User and 100+ RADH
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

    # Need to simulate earning RADH to have 100 for the arena fee
    # We can execute window.recordMatchResult(100, 10) directly via JS
    page.evaluate("window.recordMatchResult(100, 10)")
    page.wait_for_timeout(1000)

    # 2. Go to Void Gambit
    page.goto("http://localhost:3000/void-gambit.html")
    page.wait_for_timeout(2000)

    # 3. Click Enter Arena
    page.get_by_text("Enter Arena").click()
    page.wait_for_timeout(1000)

    # Capture Screenshot in the matchmaking state
    page.screenshot(path="/home/jules/verification/screenshots/matchmaking.png")
    page.wait_for_timeout(3000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="/home/jules/verification/videos")
        page = context.new_page()
        try:
            run_test(page)
        finally:
            context.close()
            browser.close()