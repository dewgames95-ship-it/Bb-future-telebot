import sys; sys.argv = sys.argv[:2]; sys.path.insert(0, sys.argv[0].rsplit("/", 1)[0]); import liq
B = liq.B
def run(k_thr=1.0, rng=0.03, slm=1.0, min_rr=1.0, fee=0.0005, tp_mode="cluster"):
    longs, shorts = {}, {}; tr = []; opn = None; atr = None; avg = None
    for i in range(1, len(B)):
        t, o, h, l, c, oi = B[i]; doi = oi - B[i-1][5]
        a = max(h, B[i-1][4]) - min(l, B[i-1][4]); atr = a if atr is None else atr + (a - atr) / 14
        avg = abs(doi) if avg is None else avg + (abs(doi) - avg) / 96
        if opn:
            d, e, sl, tp = opn
            hs = l <= sl if d > 0 else h >= sl; ht = h >= tp if d > 0 else l <= tp
            if hs or ht: tr.append(((sl if hs else tp) - e) / e * d - 2 * fee); opn = None
        sL = sum(v for k, v in longs.items() if l <= k); sS = sum(v for k, v in shorts.items() if h >= k)
        if not opn and i > 100 and doi < 0:
            if sL >= k_thr * avg and sL > sS and c < o:          # long liquidation cascade -> SELL
                tg = {k: v for k, v in longs.items() if c * (1 - rng) < k < l}
                tp = max(tg, key=tg.get) if (tg and tp_mode == "cluster") else c - 1.5 * atr
                sl = h + slm * 0.2 * atr
                if (c - tp) >= min_rr * (sl - c): opn = (-1, c, sl, tp)
            elif sS >= k_thr * avg and sS > sL and c > o:        # short squeeze -> BUY
                tg = {k: v for k, v in shorts.items() if h < k < c * (1 + rng)}
                tp = max(tg, key=tg.get) if (tg and tp_mode == "cluster") else c + 1.5 * atr
                sl = l - slm * 0.2 * atr
                if (tp - c) >= min_rr * (c - sl): opn = (1, c, sl, tp)
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
for kw in ({}, {"k_thr": 0.5}, {"k_thr": 0.25}, {"k_thr": 2}, {"tp_mode": "atr"}, {"k_thr": 0.5, "tp_mode": "atr"}, {"k_thr": 0.5, "min_rr": 1.5}):
    r = run(**kw); h = len(r) // 2
    print(f"{str(kw):<34} trades {len(r):3d} " + (f"win {sum(x>0 for x in r)/len(r)*100:4.1f}% total {sum(r)*100:+6.2f}% avg {sum(r)/len(r)*100:+.3f}% | halves {sum(r[:h])*100:+.2f} {sum(r[h:])*100:+.2f}" if r else ""))
