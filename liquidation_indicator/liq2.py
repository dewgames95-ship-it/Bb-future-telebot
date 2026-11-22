import sys, random; sys.argv = sys.argv[:2]
sys.path.insert(0, sys.argv[0].rsplit("/", 1)[0]); import liq
B = liq.B
def magnet(ratio_min=2.0, rng_pct=0.02, fee=0.0005, rand=False):
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
        opn = (d, c, c - d * 1.5 * atr, c + d * 1.5 * atr)
    return trades
for name, kw in (("magnet 2x", {}), ("magnet 3x", {"ratio_min": 3}), ("anti-magnet(fade) 2x", None), ("random", {"rand": True})):
    if kw is None:
        tr = [-(r + 0.001) - 0.001 for r in magnet()]   # reverse direction approx (same fees)
    else: tr = magnet(**kw)
    h = len(tr) // 2
    print(f"{name:<22} trades {len(tr):4d} win {sum(r>0 for r in tr)/max(1,len(tr))*100:4.1f}% total {sum(tr)*100:+6.2f}% avg {sum(tr)/max(1,len(tr))*100:+.3f}% | halves {sum(tr[:h])*100:+.2f}% {sum(tr[h:])*100:+.2f}%")
