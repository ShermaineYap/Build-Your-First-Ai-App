"""Count bank/account mentions in the first three recruiter messages, where no money is asked for."""
import json, re, sys, urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3200"
BANKISH = re.compile(r"Bank Seri Murni|8888|akaun bank anda|your bank account", re.I)
REPLIES = {"like_share": ["kerja apa ni?", "ok join", "terima kasih"], "fee_recruiter": ["which company?", "ok", "when start?"]}


def post(body):
    req = urllib.request.Request(BASE + "/api/turn", data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.loads(r.read())


hits = total = 0
for scen in REPLIES:
    for lang in ["english", "campur", "bm"]:
        h = []
        for i in range(3):
            d = post({"scenarioId": scen, "language": lang, "history": h})
            total += 1
            m = BANKISH.search(d["text"])
            if m:
                hits += 1
                print(f"BANK in {scen}/{lang}/{d['stageId']}: ...{d['text'][max(0, m.start() - 50):m.end() + 30]}...")
            h += [{"from": "scammer", "text": d["text"]}, {"from": "student", "text": REPLIES[scen][i]}]
print(f"early messages mentioning a bank or account: {hits}/{total}")
