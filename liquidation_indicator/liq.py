import json, sys, math
D = sys.argv[1]
C = {int(x[0]): [float(v) for v in x[1:5]] for x in json.load(open(D + "/c15.json"))}
O = {int(x[0]): float(x[3]) for x in json.load(open(D + "/oi15.json"))}   # OI in USD
ts = sorted(t for t in C if t in O)
B = [(t, *C[t], O[t]) for t in ts]   # t,o,h,l,c,oi
LEV = ((10, .30), (25, .30), (50, .25), (100, .15)); MM = 0.004; BIN = 0.001
def run(B, thr_pct=0.80, fee=0.0005):
    longs, shorts = {}, {}   # bin -> usd (liq price bins)
    trades, sigs, opn = [], [], None; atr = None; snap = None
    for i in range(1, len(B)):
        t, o, h, l, c, oi = B[i]; doi = oi - B[i-1][5]
        tr = max(h, B[i-1][4]) - min(l, B[i-1][4]); atr = tr if atr is None else atr + (tr - atr) / 14
        # --- manage open trade (decided on earlier closed bar -> no repaint)
        if opn:
            d, e, sl, tp = opn
            hit_sl = l <= sl if d > 0 else h >= sl; hit_tp = h >= tp if d > 0 else l <= tp
            if hit_sl or hit_tp:
                ex = sl if hit_sl else tp; r = (ex - e) / e * d - 2 * fee; trades.append(r); opn = None
        # --- sweep detection on this closed bar
        def biggest(side, lo, hi):
            m = longs if side == "L" else shorts
            ks = [k for k in m if lo <= k <= hi]; return max(ks, key=lambda k: m[k]) if ks else None
        allv = sorted(list(longs.values()) + list(shorts.values()))
        thr = allv[int(len(allv) * thr_pct)] if len(allv) > 20 else float("inf")
        swept_L = [k for k in longs if l <= k * (1 + BIN) and k < c and longs[k] >= thr]   # liquidity under price taken, close back above
        swept_S = [k for k in shorts if h >= k * (1 - BIN) and k > c and shorts[k] >= thr]
        if not opn and atr:
            if swept_L and c > o:
                up = [k for k in shorts if k > c * 1.002 and shorts[k] >= thr]
                tp = min(up) * (1 - BIN) if up else c + 2 * atr; sl = l - 0.2 * atr
                if (tp - c) > 0.8 * (c - sl): opn = (1, c, sl, tp); sigs.append((i, "BUY", c, sl, tp))
            elif swept_S and c < o:
                dn = [k for k in longs if k < c * 0.998 and longs[k] >= thr]
                tp = max(dn) * (1 + BIN) if dn else c - 2 * atr; sl = h + 0.2 * atr
                if (c - tp) > 0.8 * (sl - c): opn = (-1, c, sl, tp); sigs.append((i, "SELL", c, sl, tp))
        # --- remove swept liquidity
        for k in [k for k in longs if l <= k]: del longs[k]
        for k in [k for k in shorts if h >= k]: del shorts[k]
        # --- add new positions (OI increase) / decay (OI decrease)
        p = (h + l + c) / 3
        if doi > 0:
            w = 0.5 + 0.5 * ((c - o) / (h - l) if h > l else 0)
            for L, wt in LEV:
                kl = round(p * (1 - 1 / L + MM) / (p * BIN)) * p * BIN; ks = round(p * (1 + 1 / L - MM) / (p * BIN)) * p * BIN
                longs[kl] = longs.get(kl, 0) + doi * w * wt; shorts[ks] = shorts.get(ks, 0) + doi * (1 - w) * wt
        elif doi < 0:
            tot = sum(longs.values()) + sum(shorts.values())
            f = max(0.0, 1 + doi / B[i-1][5])
            for m in (longs, shorts):
                for k in m: m[k] *= f
        if i == len(B) - 1: snap = (dict(longs), dict(shorts))
    return trades, sigs, snap
if __name__ == "__main__":
    trades, sigs, _ = run(B)
    days = (B[-1][0] - B[0][0]) / 86400000
    w = sum(r > 0 for r in trades)
    print(f"bars {len(B)} days {days:.1f} signals {len(sigs)} trades {len(trades)} win {w/len(trades)*100 if trades else 0:.1f}% "
          f"sum ret {sum(trades)*100:+.2f}% avg {sum(trades)/max(1,len(trades))*100:+.3f}%/trade (fees 0.05%/side)")
    half = len(trades) // 2
    print("first half", f"{sum(trades[:half])*100:+.2f}%", "second half", f"{sum(trades[half:])*100:+.2f}%")
