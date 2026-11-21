"""Plays one full chat through the running app's API, using the scenario's sample replies."""
import json, sys, time, urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3100"
SCEN = sys.argv[2] if len(sys.argv) > 2 else "fee_recruiter"
LANG = sys.argv[3] if len(sys.argv) > 3 else "campur"
WALK_AFTER = int(sys.argv[4]) if len(sys.argv) > 4 else 4  # walk away after this many recruiter messages
REPLIES = {
    "like_share": ["hi, how u get my number? what kind of job is this", "ok can, so just like the posts only? need to join telegram ah?", "wah really got RM15? ok nice", "hmm why need to pay first?", "ok"],
    "fee_recruiter": ["oh really? which company is this? I don't remember applying", "can I know more about the company first before I give my IC?", "ok thanks. so when I start ah?", "why the account name is personal one ah?", "ok"],
    "money_mule": ["what is payment processing agent? is this legit company?", "why cannot they pay the company directly?", "hmm ok I see the money. so I just transfer the rest?", "eh no la", "ok"],
}[SCEN]

def post(path, body, cookie=None):
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode(), headers={"Content-Type": "application/json", **({"Cookie": cookie} if cookie else {})})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, json.loads(r.read()), r.headers.get("Set-Cookie")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}"), None

history, cookie = [], None
for i in range(WALK_AFTER):
    t0 = time.time()
    st, d, sc = post("/api/turn", {"scenarioId": SCEN, "language": LANG, "history": history}, cookie)
    cookie = cookie or (sc.split(";")[0] if sc else None)
    if st != 200:
        print("TURN FAILED", st, d); sys.exit(1)
    history.append({"from": "scammer", "text": d["text"]})
    print(f"[{d['stageId']} via {d['provider']} {time.time()-t0:.1f}s regen={d['regenerated']} sanitized={d['sanitized']}]\n{d['text']}\n")
    if i < WALK_AFTER - 1:
        history.append({"from": "student", "text": REPLIES[i]})
        print(f"  > {REPLIES[i]}\n")

st, d, _ = post("/api/debrief", {"scenarioId": SCEN, "language": LANG, "history": history, "walkedAway": True})
print("DEBRIEF", st, "marked:", d.get("marked"), "via", d.get("provider"))
print(json.dumps(d["score"], indent=1))
for f in d["judge"]["flags"]: print("flag", f)
for r in d["judge"]["replies"]: print("reply", r)
