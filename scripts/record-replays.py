"""Record demo replays by playing scripted students through the running app's real API."""
import json, sys, urllib.request, datetime

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3100"
PLANS = [
    # id, scenario, language, replies (None = walk away at that point), label
    ("like-share-campur", "like_share", "campur",
     ["hi, how u get my number? what kind of job is this", "ok can, so just like the posts only? need to join telegram ah?", "wah really got RM15? ok nice", None],
     "Like-and-share job, in Campur: gets paid RM15, walks away at the top-up"),
    ("fee-recruiter-bm", "fee_recruiter", "bm",
     ["eh syarikat apa ni? saya tak ingat mohon kerja ni", None],
     "Recruiter wanting a fee, in BM: asks questions, walks away at the IC request"),
    ("money-mule-english", "money_mule", "english",
     ["what is payment processing agent? is this legit company?", "ok sounds easy, many students do it right?", "ok I see the money. so I just transfer the rest?", "ok can, what do you need?", "alright I'll do it now"],
     "Payment agent (money mule), in English: goes along to the end"),
]

def post(path, body):
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.loads(r.read())

out = []
for rid, scen, lang, replies, label in PLANS:
    history, walked, model = [], False, ""
    for reply in replies + ["__END__"]:
        d = post("/api/turn", {"scenarioId": scen, "language": lang, "history": history})
        model = f"{d['provider']}/{d['model']}"
        history.append({"from": "scammer", "text": d["text"]})
        if reply is None:
            walked = True; break
        if reply == "__END__":
            break
        history.append({"from": "student", "text": reply})
        if sum(1 for t in history if t["from"] == "scammer") >= 5:
            break
    deb = post("/api/debrief", {"scenarioId": scen, "language": lang, "history": history, "walkedAway": walked})
    out.append({"id": rid, "scenarioId": scen, "language": lang, "label": label, "history": history, "walkedAway": walked,
                "debrief": {"judge": deb["judge"], "score": deb["score"], "marked": deb["marked"]},
                "recordedAt": datetime.date.today().isoformat(), "model": model})
    print(rid, "score", deb["score"]["score"], deb["score"]["label"], "| flags", [bool(f["quote"]) for f in deb["judge"]["flags"]], "| verdicts", [r["verdict"] for r in deb["judge"]["replies"]])

json.dump(out, open("src/data/replays.json", "w"), ensure_ascii=False, indent=1)
