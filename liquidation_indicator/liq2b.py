import sys, random; sys.argv = sys.argv[:2]
sys.path.insert(0, sys.argv[0].rsplit("/", 1)[0]); import liq
B = liq.B
def magnet(ratio_min=2.0, rng_pct=0.02, fee=0.0005, rand=False, tpc=False, slm=1.5):
    longs, shorts = {}, {}; trades = []; opn = None; atr = None; R = random.Random(2)
    for i in range(1, len(B)):
        t, o, h, l, c, oi = B[i]; doi = oi - B[i-1][5]
        tr = max(h, B[i-1][4]) - min(l, B[i-1][4]); atr = tr if atr is None else atr + (tr - atr) / 14
        if opn:
            d, e, sl, tp = opn
            hs = l <= sl if d > 0 else h >= sl; ht = h >= tp if d > 0 else l <= tp
            if hs or ht: trades.append(((sl if hs else tp) - e) / e * d - 2 * fee); opn = None
        for k in [k for k in longs if l <= k]: del longs[k]
        for k in [k for k in shorts if h >= k]: del shorts[k]
        p = (h + l + c) / 3
        if doi > 0:
            w = 0.5 + 0.5 * ((c - o) / (h - l) if h > l else 0)
            for L, wt in liq.LEV:
                longs[round(p*(1-1/L+liq.MM), -1)] = longs.get(round(p*(1-1/L+liq.MM), -1), 0) + doi*w*wt
                shorts[round(p*(1+1/L-liq.MM), -1)] = shorts.get(round(p*(1+1/L-liq.MM), -1), 0) + doi*(1-w)*wt
        elif doi < 0:
            tot = sum(longs.values()) + sum(shorts.values()); f = max(0.0, 1 + doi / B[i-1][5])
            for m in (longs, shorts):
                for k in m: m[k] *= f
        if opn or not atr or i < 100: continue
        up = sum(v for k, v in shorts.items() if k < c * (1 + rng_pct)); dn = sum(v for k, v in longs.items() if k > c * (1 - rng_pct))
        if rand: d = R.choice((1, -1))
        elif up > ratio_min * dn: d = 1
        elif dn > ratio_min * up: d = -1
        else: continue
        tp = c + d * 1.5 * atr
        if tpc:
            m = shorts if d == 1 else longs
            cand = {k: v for k, v in m.items() if (k > c if d == 1 else k < c) and abs(k - c) <= rng_pct * c}
            if cand: k = max(cand, key=cand.get); tp = c + d * min(max(abs(k - c), 1.0 * atr), 3 * atr)
        opn = (d, c, c - d * slm * atr, tp)
    return trades
for name, kw in (("magnet3 base", {"ratio_min": 3}), ("magnet3 TP=cluster SL1.5", {"ratio_min": 3, "tpc": True}), ("magnet3 TP=cluster SL1", {"ratio_min": 3, "tpc": True, "slm": 1}), ("magnet3 TP=cluster SL2", {"ratio_min": 3, "tpc": True, "slm": 2}), ("magnet2 TP=cluster SL1.5", {"tpc": True}), ("magnet3 maker fee 0.02%", {"ratio_min": 3, "fee": 0.0002})):
    tr = magnet(**kw); h = len(tr) // 2
    print(f"{name:<26} trades {len(tr):4d} win {sum(r>0 for r in tr)/max(1,len(tr))*100:4.1f}% total {sum(tr)*100:+6.2f}% avg {sum(tr)/max(1,len(tr))*100:+.3f}% | halves {sum(tr[:h])*100:+.2f}% {sum(tr[h:])*100:+.2f}%")
