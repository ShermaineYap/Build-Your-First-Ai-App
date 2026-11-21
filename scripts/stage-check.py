"""Do early messages (hook, trust) avoid asking for money? Plays 9 sessions x 2 messages via the running API."""
import json, re, sys, urllib.request
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3100"
MONEY = re.compile(r"Bank Seri Murni|8888|deposit|top[\s-]?up|bayar|transfer|bank[\s-]?in|yuran|fee", re.I)
def post(body):
    req = urllib.request.Request(BASE + "/api/turn", data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=90) as r: return json.loads(r.read())
first = {"like_share": "hi, what job is this?", "fee_recruiter": "which company is this?", "money_mule": "what is this job about?"}
bad, total = 0, 0
for scen in ["like_share", "fee_recruiter"]:   # money_mule's trust stage legitimately explains forwarding money
    for lang in ["english", "campur", "bm"]:
        h = []
        for i in range(2):
            d = post({"scenarioId": scen, "language": lang, "history": h})
            hit = MONEY.search(d["text"]); total += 1; bad += bool(hit)
            if hit: print(f"MONEY in {scen}/{lang}/{d['stageId']}: ...{d['text'][max(0,hit.start()-60):hit.end()+40]}...")
            h += [{"from": "scammer", "text": d["text"]}, {"from": "student", "text": first[scen]}]
print(f"early messages mentioning money: {bad}/{total}")
