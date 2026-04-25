from playwright.sync_api import sync_playwright
import time

def run_test(page):
    page.goto("http://localhost:3000/void-gambit.html")
    page.wait_for_timeout(2000)
    page.screenshot(path="/home/jules/verification/screenshots/void_gambit_menu.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        run_test(page)
        context.close()
        browser.close()
