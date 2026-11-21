"""Live end-to-end test in a real browser: start a chat, reply, PII guard, walk away, debrief."""
import asyncio, sys, time
from playwright.async_api import async_playwright, expect
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3100"
OUT = "/home/claude/scamsparring/shots"

async def run():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(BASE)
        await pg.get_by_label("The recruiter who wants a fee").check()
        await pg.get_by_text("English", exact=True).click()
        t = time.time()
        await pg.get_by_role("button", name="Start practice chat").click()
        box = pg.get_by_label("Your reply")
        await expect(box).to_be_enabled(timeout=30000)
        print(f"first message in {time.time()-t:.1f}s")
        # personal data guard
        await box.fill("sure, my IC is 990101-14-5678")
        await pg.get_by_role("button", name="Send").click()
        await expect(pg.get_by_text("That looks like an IC number")).to_be_visible(timeout=3000)
        print("PII guard: blocked IC number, message not sent")
        await pg.screenshot(path=f"{OUT}/phone-live-pii.png")
        await box.fill("which company is this? I never applied")
        await box.press("Enter")
        await expect(box).to_be_enabled(timeout=30000)
        n = await pg.locator("[class*=them]").count()
        print("recruiter messages shown:", n)
        await pg.screenshot(path=f"{OUT}/phone-live-chat.png")
        await pg.get_by_role("button", name="Walk away").click()
        await expect(pg.locator("[class*=scoreCircle]")).to_be_visible(timeout=40000)
        score = await pg.locator("[class*=scoreCircle]").inner_text()
        marks = await pg.locator("mark").count()
        print("debrief score:", score, "| highlighted phrases:", marks)
        await pg.screenshot(path=f"{OUT}/phone-live-debrief.png", full_page=True)
        print("page errors:", errs or "none")
        await b.close()

asyncio.run(run())
