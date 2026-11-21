import asyncio, sys
from playwright.async_api import async_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3100"
OUT = "/home/claude/scamsparring/shots"

async def run():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        errors = []
        for name, vp in [("desktop", {"width": 1280, "height": 900}), ("phone", {"width": 390, "height": 844})]:
            pg = await b.new_page(viewport=vp, device_scale_factor=2 if name == "phone" else 1)
            pg.on("console", lambda m: errors.append(f"{name} console {m.type}: {m.text}") if m.type in ("error",) else None)
            pg.on("pageerror", lambda e: errors.append(f"{name} pageerror: {e}"))
            await pg.goto(BASE, wait_until="networkidle")
            await pg.screenshot(path=f"{OUT}/{name}-home.png", full_page=True)
            # replay with the BM fee recruiter (short), then the money mule one for the full debrief
            await pg.get_by_role("button", name="Recruiter wanting a fee").click()
            await pg.wait_for_timeout(5000)
            await pg.screenshot(path=f"{OUT}/{name}-replay-chat.png")
            await pg.get_by_role("button", name="Skip to the marking").click()
            await pg.wait_for_timeout(1200)
            await pg.screenshot(path=f"{OUT}/{name}-debrief-bm.png", full_page=True)
            await pg.get_by_role("button", name="Pick another scam").click()
            await pg.get_by_role("button", name="Payment agent").click()
            await pg.get_by_role("button", name="Skip to the marking").click()
            await pg.wait_for_timeout(1200)
            await pg.screenshot(path=f"{OUT}/{name}-debrief-mule.png", full_page=True)
            await pg.close()
        await b.close()
        print("\n".join(errors) or "no console errors")

asyncio.run(run())
