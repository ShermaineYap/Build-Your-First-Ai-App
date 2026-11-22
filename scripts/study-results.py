"""Summarise pilot-study codes. Usage: python3 scripts/study-results.py codes.txt  (one code per line, e.g. SS-AB-5-7-KQX)"""
import re, statistics, sys
rows = []
for line in open(sys.argv[1]):
    m = re.search(r"SS-(AB|BA)-([0-8])-([0-8])-[A-Z]{3}", line.upper())
    if m: rows.append((m[1], int(m[2]), int(m[3])))
if not rows: sys.exit("no valid codes found")
n = len(rows)
pre = [r[1] for r in rows]; post = [r[2] for r in rows]; diff = [b - a for a, b in zip(pre, post)]
print(f"participants: {n} (order AB: {sum(r[0]=='AB' for r in rows)}, BA: {sum(r[0]=='BA' for r in rows)})")
print(f"before: mean {statistics.mean(pre):.2f}/8 | after: mean {statistics.mean(post):.2f}/8 | change: mean {statistics.mean(diff):+.2f}")
print(f"improved: {sum(d>0 for d in diff)}, same: {sum(d==0 for d in diff)}, worse: {sum(d<0 for d in diff)}")
for o in ("AB", "BA"):
    sub = [r for r in rows if r[0] == o]
    if sub: print(f"  order {o}: before {statistics.mean(r[1] for r in sub):.2f}, after {statistics.mean(r[2] for r in sub):.2f} (n={len(sub)})")
if n >= 6:
    # Exact two-sided sign test on non-zero changes: no extra libraries needed.
    from math import comb
    k, m = sum(d > 0 for d in diff), sum(d != 0 for d in diff)
    p = min(1, 2 * sum(comb(m, i) for i in range(max(k, m - k), m + 1)) / 2**m) if m else 1
    print(f"sign test (non-zero changes = {m}): p = {p:.3f}  (pilot only; small n)")
