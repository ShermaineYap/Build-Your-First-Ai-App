"""Click through the study page on a phone viewport and check the code."""
import asyncio, re, sys
from playwright.async_api import async_playwright, expect
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3200"
OUT = "/home/claude/scamsparring/shots"
async def run():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(BASE + "/study"); await pg.screenshot(path=f"{OUT}/study-intro.png", full_page=True)
        await pg.get_by_role("button", name="Start").click()
        nxt = pg.get_by_role("button", name="Next: practice chat")
        await expect(nxt).to_be_disabled()
        for r in await pg.get_by_text("Scam", exact=True).all(): await r.click()
        await expect(nxt).to_be_enabled(); await pg.screenshot(path=f"{OUT}/study-quiz.png")
        await nxt.click()
        go = pg.get_by_role("button", name="Next: 8 more messages"); await expect(go).to_be_disabled()
        await pg.get_by_label("I finished a practice chat").check(); await go.click()
        for r in await pg.get_by_text("Legit", exact=True).all(): await r.click()
        await pg.get_by_role("button", name="See my code").click()
        code = await pg.get_by_label("Your result code").inner_text()
        print("code:", code, "| valid:", bool(re.fullmatch(r"SS-(AB|BA)-5-3-[A-Z]{3}", code)))
        await pg.screenshot(path=f"{OUT}/study-done.png", full_page=True)
        print("page errors:", errs or "none"); await b.close()
asyncio.run(run())
