"""Compare human labels with the AI judge's hidden labels.
Usage: python3 compare-labels.py human.json   (a JSON list of 40 labels in row order: refused/questioned/complied/neutral)"""
import json, sys
from collections import Counter

LAB = "/home/claude/scamsparring/labelling"
human = json.load(open(sys.argv[1]))
ai_chats = json.load(open(f"{LAB}/ai_labels_HIDDEN.json"))
ai = []
for c in ai_chats:
    by_turn = {r["turn"]: r["verdict"] for r in c["replies"]}
    ai += [by_turn.get(t, "missing") for t in range(1, 5)]
assert len(human) == len(ai) == 40, (len(human), len(ai))

pairs = [(h, a) for h, a in zip(human, ai) if h]
agree = sum(h == a for h, a in pairs)
print(f"labelled by you: {len(pairs)}/40 | exact agreement: {agree}/{len(pairs)} = {agree / len(pairs):.0%}")

# What matters most for the score: did the student go along (complied) or not?
c_agree = sum((h == "complied") == (a == "complied") for h, a in pairs)
print(f"agreement on 'went along' vs not (what the score penalises): {c_agree}/{len(pairs)} = {c_agree / len(pairs):.0%}")

# Cohen's kappa: agreement beyond chance
labels = ["refused", "questioned", "complied", "neutral"]
n = len(pairs)
po = agree / n
hc, ac = Counter(h for h, _ in pairs), Counter(a for _, a in pairs)
pe = sum(hc[l] * ac[l] for l in labels) / (n * n)
print(f"Cohen's kappa: {(po - pe) / (1 - pe):.2f}" if pe < 1 else "kappa undefined")

print("\nconfusion (rows = you, columns = AI):")
print(" " * 12 + "".join(f"{l[:9]:>11}" for l in labels + ["missing"]))
for h in labels:
    print(f"{h:>12}" + "".join(f"{sum(1 for x, y in pairs if x == h and y == a):>11}" for a in labels + ["missing"]))
print("\ndisagreements:")
for i, (h, a) in enumerate(zip(human, ai), 1):
    if h and h != a:
        print(f"  row {i}: you={h}, AI={a}")
