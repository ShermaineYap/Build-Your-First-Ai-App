"""Generate chats with varied student replies for hand-labelling. AI judge labels are saved separately and kept hidden."""
import json, sys, urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3200"
OUT = "/home/claude/scamsparring/labelling"
PLANS = [
    ("like_share", "campur", ["what job is this ah?", "ok sounds easy", "wah got RM15 really ah", "ok how to top up?"]),
    ("like_share", "english", ["who gave you my number?", "why must join telegram? can just do here?", "nice, thanks", "no way I'm paying to work"]),
    ("like_share", "bm", ["kerja apa ni?", "ok saya join", "terima kasih!", "boleh bayar lepas dapat gaji?"]),
    ("fee_recruiter", "english", ["I don't remember applying, which company?", "ok here is my name, Ali bin Abu", "great, see you Monday", "let me think first"]),
    ("fee_recruiter", "campur", ["wah serious? no interview?", "can share company website first?", "ok", "why personal account? not paying"]),
    ("fee_recruiter", "bm", ["ok berminat", "nama saya Siti Aminah, IC nanti saya hantar", "bila start?", "ok saya transfer sekarang"]),
    ("money_mule", "english", ["how does it work?", "isn't this a mule account?", "ok", "I'm out, not sharing anything"]),
    ("money_mule", "campur", ["ok can, need what?", "so I just forward the money?", "ok done forward already", "ok I send you my login"]),
    ("money_mule", "bm", ["ini sah ke?", "kenapa tak bayar terus kepada syarikat?", "hmm", "tak nak, saya report polis"]),
    ("like_share", "campur", ["ok", "send me the details", "can I withdraw the RM15 first?", "later lah, busy now"]),
]


def post(path, body):
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.loads(r.read())


chats, ai = [], []
for n, (scen, lang, replies) in enumerate(PLANS, 1):
    h = []
    for rep in replies:
        d = post("/api/turn", {"scenarioId": scen, "language": lang, "history": h})
        h += [{"from": "scammer", "text": d["text"]}, {"from": "student", "text": rep}]
    deb = post("/api/debrief", {"scenarioId": scen, "language": lang, "history": h, "walkedAway": True})
    chats.append({"chat": n, "scenario": scen, "language": lang, "history": h})
    ai.append({"chat": n, "replies": deb["judge"]["replies"], "flags": deb["judge"]["flags"]})
    quotes = sum(bool(f["quote"]) for f in deb["judge"]["flags"])
    print(n, scen, lang, "| replies labelled:", len(deb["judge"]["replies"]), "| quotes found:", quotes, "/", len(deb["judge"]["flags"]))

json.dump(chats, open(f"{OUT}/chats.json", "w"), ensure_ascii=False, indent=1)
json.dump(ai, open(f"{OUT}/ai_labels_HIDDEN.json", "w"), ensure_ascii=False, indent=1)
