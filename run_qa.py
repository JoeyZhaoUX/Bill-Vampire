import sys
from playwright.sync_api import sync_playwright
import time

def run_qa():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        print("Navigating to local site...")
        page.goto('http://localhost:5173')
        page.wait_for_load_state('networkidle')
        
        # Take a screenshot of the landing page
        page.screenshot(path='qa_landing.png', full_page=True)
        print("Captured landing page.")
        
        # Click the Get Started/Scan button
        # In this app, what is the first button? Let's check Landing.jsx
        # It's usually "Scan my subscriptions" or similar
        buttons = page.locator('button, a').all_inner_texts()
        print("Available texts:", [b.strip() for b in buttons if b.strip()])
        
        # Just click the first obvious call to action
        try:
            # Look for button containing "Fix a charge"
            page.locator('text=Fix a charge').first.click(timeout=3000)
            page.wait_for_load_state('networkidle')
        except Exception:
            try:
                page.locator('text=Build the first kit').first.click(timeout=3000)
                page.wait_for_load_state('networkidle')
            except Exception as e:
                print("Could not find start button:", e)

        page.screenshot(path='qa_scan.png', full_page=True)
        print("Captured scan/onboarding page.")
        
        # Let's type something into the scan input
        # Let's see what inputs we have
        try:
            page.locator('textarea').fill("I got charged $99 by Microsoft 365")
            print("Scan page buttons:", [b.strip() for b in page.locator('button').all_inner_texts() if b.strip()])
            # Try to just click the button with text containing "Build my free preview"
            page.locator('button:has-text("Build my free preview")').first.click(timeout=3000)
            # wait for analysis to complete (it goes to /verdict)
            page.wait_for_selector('text=Step 2', timeout=15000)
            page.wait_for_timeout(3000) # Wait for animations
            page.screenshot(path='qa_verdict.png', full_page=True)
            print("Captured verdict page.")
        except Exception as e:
            print("Could not do scan flow:", e)
            
        browser.close()

if __name__ == '__main__':
    run_qa()
