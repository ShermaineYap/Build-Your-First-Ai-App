"""Simulate several people chatting at once: N full 5-message sessions plus marking, started together."""
import json, sys, time, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3200"
N = int(sys.argv[2]) if len(sys.argv) > 2 else 3
SCEN = ["like_share", "fee_recruiter", "money_mule"]
REPLY = ["what is this?", "hmm ok", "really?", "why need to pay?"]


def post(path, body):
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, {}


def session(i):
    scen, h, models, t0 = SCEN[i % 3], [], [], time.time()
    for k in range(5):
        st, d = post("/api/turn", {"scenarioId": scen, "language": "campur", "history": h})
        if st != 200:
            return f"session {i}: FAILED at message {k + 1} (HTTP {st}) after {time.time() - t0:.0f}s"
        models.append(d["model"].split("/")[-1])
        h.append({"from": "scammer", "text": d["text"]})
        if k < 4:
            h.append({"from": "student", "text": REPLY[k]})
    st, d = post("/api/debrief", {"scenarioId": scen, "language": "campur", "history": h, "walkedAway": True})
    marked = d.get("marked") if st == 200 else f"HTTP {st}"
    return f"session {i}: ok in {time.time() - t0:.0f}s | chat models {models} | marked={marked}"


with ThreadPoolExecutor(N) as ex:
    for line in ex.map(session, range(N)):
        print(line)
