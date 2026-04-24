from playwright.sync_api import sync_playwright
import time

def run_cuj(page):
    page.goto("http://localhost:3000")
    page.wait_for_timeout(1000)

    # Click Community Hub
    page.get_by_role("link", name="Community Hub").click()
    page.wait_for_timeout(1000)

    # We will sign up with a new email/password to test the happy path
    # (Anonymous Auth is disabled on this Firebase project, throwing admin-restricted-operation)
    timestamp = str(int(time.time()))
    page.locator("#toggle-auth-mode").click() # Switch to signup
    page.wait_for_timeout(500)
    page.locator("#username").fill(f"TestAgent_{timestamp}")
    page.locator("#email").fill(f"testagent_{timestamp}@example.com")
    page.locator("#password").fill("securepassword123")
    page.locator("#action-btn").click()

    # Wait for dashboard to be visible
    page.locator("#dashboard-section").wait_for(state="visible", timeout=10000)
    page.wait_for_timeout(1000)

    # Take screenshot of the initial dashboard loaded
    page.screenshot(path="/home/jules/verification/screenshots/dashboard_initial.png")
    page.wait_for_timeout(1000)

    # 2. Add an invalid wallet address
    page.locator("#manualWalletInput").fill("invalid_address")
    page.wait_for_timeout(500)

    # Handle the alert dynamically
    page.once("dialog", lambda dialog: dialog.accept())
    page.locator("#connect-wallet-btn").click()
    page.wait_for_timeout(1000)

    # Take screenshot of the error modal if any (it's an alert, so we screenshot the unchanged dashboard)
    page.screenshot(path="/home/jules/verification/screenshots/dashboard_invalid.png")
    page.wait_for_timeout(500)

    # 3. Add a valid wallet address
    page.locator("#manualWalletInput").fill("0x1234567890123456789012345678901234567890")
    page.wait_for_timeout(500)
    page.locator("#connect-wallet-btn").click()
    page.wait_for_timeout(1500)

    # Take screenshot of the success dashboard loaded
    page.screenshot(path="/home/jules/verification/screenshots/dashboard_linked.png")
    page.wait_for_timeout(1000)


if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        except Exception as e:
            page.screenshot(path="/home/jules/verification/screenshots/error.png")
            raise e
        finally:
            context.close()
            browser.close()
