import sys; sys.argv = sys.argv[:2]; sys.path.insert(0, sys.argv[0].rsplit("/", 1)[0]); import liq
B = liq.B
def run(min_share=3.0, need_oi_drop=True, rng_pct=0.03, min_rr=1.2, fee=0.0005, reverse=False):
    longs, shorts = {}, {}; tr = []; opn = None; atr = None; avg = None
    for i in range(1, len(B)):
        t, o, h, l, c, oi = B[i]; doi = oi - B[i-1][5]
        a = max(h, B[i-1][4]) - min(l, B[i-1][4]); atr = a if atr is None else atr + (a - atr) / 14
        if opn:
            d, e, sl, tp = opn
            hs = l <= sl if d > 0 else h >= sl; ht = h >= tp if d > 0 else l <= tp
            if hs or ht: tr.append(((sl if hs else tp) - e) / e * d - 2 * fee); opn = None
        tot = sum(longs.values()) + sum(shorts.values())
        avg = abs(doi) if avg is None else avg + (abs(doi) - avg) / 96
        thr = min_share * avg
        sweptL = sum(v for k, v in longs.items() if l <= k); sweptS = sum(v for k, v in shorts.items() if h >= k)
        sig = None
        if not opn and tot > 0 and i > 100 and (not need_oi_drop or doi < 0):
            if sweptL >= thr and c > max([k for k in longs if l <= k] or [c]):
                tg = {k: v for k, v in shorts.items() if c * 1.002 < k < c * (1 + rng_pct)}
                if tg:
                    tp = max(tg, key=tg.get); sl = l - 0.2 * atr
                    if (tp - c) >= min_rr * (c - sl): sig = (1, c, sl, tp)
            elif sweptS >= thr and c < min([k for k in shorts if h >= k] or [c]):
                tg = {k: v for k, v in longs.items() if c * (1 - rng_pct) < k < c * 0.998}
                if tg:
                    tp = max(tg, key=tg.get); sl = h + 0.2 * atr
                    if (c - tp) >= min_rr * (sl - c): sig = (-1, c, sl, tp)
        if sig:
            if reverse: d, e, sl, tp = sig; sig = (-d, e, tp, sl)
            opn = sig
        for k in [k for k in longs if l <= k]: del longs[k]
        for k in [k for k in shorts if h >= k]: del shorts[k]
        p = (h + l + c) / 3
        if doi > 0:
            w = 0.5 + 0.5 * ((c - o) / (h - l) if h > l else 0)
            for L, wt in liq.LEV:
                x, y = round(p*(1-1/L+liq.MM), -1), round(p*(1+1/L-liq.MM), -1)
                longs[x] = longs.get(x, 0) + doi*w*wt; shorts[y] = shorts.get(y, 0) + doi*(1-w)*wt
        elif doi < 0:
            f = max(0.0, 1 + doi / B[i-1][5])
            for m in (longs, shorts):
                for k in m: m[k] *= f
    return tr
for kw in ({}, {"min_share": 1}, {"min_share": 6}, {"need_oi_drop": False}, {"min_rr": 2}, {"rng_pct": 0.05}, {"reverse": True}):
    r = run(**kw); h = len(r) // 2
    if r: print(f"{str(kw):<26} trades {len(r):3d} win {sum(x>0 for x in r)/len(r)*100:4.1f}% total {sum(r)*100:+6.2f}% avg {sum(r)/len(r)*100:+.3f}% | halves {sum(r[:h])*100:+.2f} {sum(r[h:])*100:+.2f}")
    else: print(kw, "no trades")
