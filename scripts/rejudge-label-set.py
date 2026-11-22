"""Re-run only the marking on the saved labelling chats, so the hidden AI labels match the live marker."""
import json, sys, time, urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3200"
LAB = "/home/claude/scamsparring/labelling"
chats = json.load(open(f"{LAB}/chats.json"))
out = []
for c in chats:
    body = {"scenarioId": c["scenario"], "language": c["language"], "history": c["history"], "walkedAway": True}
    req = urllib.request.Request(BASE + "/api/debrief", data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        d = json.loads(r.read())
    out.append({"chat": c["chat"], "replies": d["judge"]["replies"], "flags": d["judge"]["flags"], "provider": d.get("provider"), "model": d.get("model")})
    print(c["chat"], d.get("model"), "| replies labelled:", len(d["judge"]["replies"]), "| quotes:", sum(bool(f["quote"]) for f in d["judge"]["flags"]), "/", len(d["judge"]["flags"]))
    time.sleep(12)
json.dump(out, open(f"{LAB}/ai_labels_HIDDEN.json", "w"), ensure_ascii=False, indent=1)
