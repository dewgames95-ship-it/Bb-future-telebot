import sys, math; sys.argv = sys.argv[:2]; sys.path.insert(0, sys.argv[0].rsplit("/", 1)[0]); import liq
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, FancyBboxPatch
B = liq.B; RATIO, RNG, TPA, SLA, FEE, BAL, RISK = 3.0, 0.02, 1.5, 1.5, 0.0005, 1000.0, 1.0
longs, shorts = {}, {}; atr = None; trades = []; opn = None; eq = BAL; peak = BAL; mdd = 0; gw = gl = 0
for i in range(1, len(B)):
    t, o, h, l, c, oi = B[i]; doi = oi - B[i-1][5]
    a = max(h, B[i-1][4]) - min(l, B[i-1][4]); atr = a if atr is None else atr + (a - atr) / 14
    if opn and i > opn["i"]:
        d = opn["d"]; hs = l <= opn["sl"] if d > 0 else h >= opn["sl"]; ht = h >= opn["tp"] if d > 0 else l <= opn["tp"]
        if hs or ht:
            ex = opn["sl"] if hs else opn["tp"]; ret = (ex - opn["e"]) / opn["e"] * d
            pnl = opn["pos"] * ret - opn["pos"] * 2 * FEE; eq += pnl; peak = max(peak, eq); mdd = max(mdd, (peak - eq) / peak * 100)
            gw += max(pnl, 0); gl += max(-pnl, 0); opn.update(x=i, ex=ex, win=ht and not hs, ret=ret); trades.append(opn); opn = None
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
    up = sum(v for k, v in shorts.items() if k < c * (1 + RNG)); dn = sum(v for k, v in longs.items() if k > c * (1 - RNG))
    d = 1 if up > RATIO * dn and up > 0 else -1 if dn > RATIO * up and dn > 0 else 0
    if not opn and d and i > 100:
        slp = SLA * atr / c; pos = min(eq * RISK / 100 / slp, eq * 20)
        opn = dict(i=i, d=d, e=c, tp=c + d * TPA * atr, sl=c - d * SLA * atr, pos=pos, mine=up if d > 0 else dn, other=dn if d > 0 else up)
n = len(trades); wins = sum(t["win"] for t in trades)
print("trades", n, "win", wins / n * 100, "eq", eq, "mdd", mdd, "pf", gw / gl if gl else 0)
# ---- portrait render
N = 48; FUT = 14; x0 = len(B) - N; bars = B[-N:]
bg = "#131722"; up_c, dn_c = "#26a69a", "#ef5350"
fig = plt.figure(figsize=(5.4, 9.6), dpi=200); fig.patch.set_facecolor(bg)
ax = fig.add_axes([0.02, 0.06, 0.84, 0.86]); ax.set_facecolor(bg)
c_last = bars[-1][4]; lo = min(b[3] for b in bars); hi = max(b[2] for b in bars)
ylo, yhi = min(lo, c_last * 0.985) - 50, max(hi, c_last * 1.015) + 50
vmax = max([v for k, v in list(longs.items()) + list(shorts.items()) if ylo < k < yhi] + [1])
for m, col, nm in ((longs, "#ff9800", "longs ↓"), (shorts, "#00e5ff", "shorts ↑")):
    for k, v in m.items():
        if ylo < k < yhi and v > vmax * 0.05:
            ax.add_patch(Rectangle((N - 40, k - c_last * 0.0005), 40 + FUT, c_last * 0.001, color=col, alpha=min(0.55, 0.1 + 0.45 * v / vmax), lw=0))
            if v >= sorted([vv for kk, vv in m.items() if ylo < kk < yhi])[-3]: ax.text(N + FUT - 0.5, k, f"${v/1e6:.1f}M {nm}", color=col, fontsize=6.5, va="center", ha="right", fontweight="bold")
for tr in trades:
    if tr["i"] < x0: continue
    a, b = tr["i"] - x0, tr["x"] - x0; d = tr["d"]
    ax.add_patch(Rectangle((a, min(tr["e"], tr["tp"])), b - a, abs(tr["tp"] - tr["e"]), color=up_c, alpha=0.18, lw=0))
    ax.add_patch(Rectangle((a, min(tr["e"], tr["sl"])), b - a, abs(tr["sl"] - tr["e"]), color=dn_c, alpha=0.18, lw=0))
    if False: ax.text(a + 0.3, tr["tp"], f"TARGET {'+' if d>0 else '-'}{abs(tr['tp']-tr['e'])/tr['e']*100:.2f}%", color="white", fontsize=5.5, va="bottom" if d > 0 else "top")
    if False: ax.text(a + 0.3, tr["sl"], f"STOP {abs(tr['sl']-tr['e'])/tr['e']*100:.2f}%", color="white", fontsize=5.5, va="top" if d > 0 else "bottom")
    ax.text(b, tr["ex"], ("+" if tr["win"] else "") + f" {tr['ret']*100:+.2f}%", color=up_c if tr["win"] else dn_c, fontsize=6.5, fontweight="bold", ha="left", va="center")
    y = B[tr["i"]][3] - 25 if d > 0 else B[tr["i"]][2] + 25
    ax.text(a, y, ("BUY" if d > 0 else "SELL") + f"\n${tr['mine']/1e6:.1f}M " + ("shorts above" if d > 0 else "longs below"),
            color="white", fontsize=6, ha="center", va="top" if d > 0 else "bottom", fontweight="bold",
            bbox=dict(boxstyle="round,pad=0.3", fc=up_c if d > 0 else dn_c, ec="none"))
for j, b in enumerate(bars):
    t, o, h, l, c, oi = b; col = up_c if c >= o else dn_c
    ax.plot([j, j], [l, h], color=col, lw=0.7); ax.add_patch(Rectangle((j - 0.35, min(o, c)), 0.7, max(abs(c - o), 2), color=col))
up = sum(v for k, v in shorts.items() if abs(k - c_last) / c_last < RNG); dn = sum(v for k, v in longs.items() if abs(k - c_last) / c_last < RNG)
mm = shorts if up >= dn else longs; cand = {k: v for k, v in mm.items() if abs(k - c_last) / c_last < RNG}
if cand:
    tg = max(cand, key=cand.get); ax.plot([N - 1, N + FUT - 4], [c_last, tg], color="white", alpha=0.35, lw=1.5, ls=":")
    ax.text(N + FUT - 4, tg, f" {tg:,.0f}", color="white", alpha=0.7, fontsize=7, va="center")
ax.axhline(c_last, color="#2962ff", lw=0.6, ls=":")
ax.set_xlim(-1, N + FUT); ax.set_ylim(ylo, yhi); ax.grid(color="#1e2230", lw=0.5); ax.set_xticks([])
ax.yaxis.tick_right(); ax.tick_params(colors="#b2b5be", labelsize=6.5)
for s in ax.spines.values(): s.set_visible(False)
fig.text(0.03, 0.965, "BTCUSDT.P · 15  ·  Whale Liquidation Magnet", color="#d1d4dc", fontsize=9, fontweight="bold")
fig.text(0.03, 0.945, "orange = longs get liquidated · cyan = shorts get liquidated", color="#888", fontsize=6.5)
rows = [("BACKTEST 15m", "BTCUSDT.P"), ("Trades", f"{n} (few)" if n < 100 else str(n)), ("Win rate", f"{wins/n*100:.1f}%"),
        ("Profit factor", f"{gw/gl:.2f}"), ("Net", f"{(eq-BAL)/BAL*100:+.2f}%"), ("Max drawdown", f"-{mdd:.2f}%"),
        ("$1000 →", f"${eq:,.2f}"), ("Risk/trade", f"1% = ${eq*0.01:.2f}"), ("Fee/side", "0.05%")]
tx, ty = 0.50, 0.915
fig.patches.append(FancyBboxPatch((tx - 0.01, ty - 0.022 * len(rows) + 0.005), 0.36, 0.022 * len(rows) + 0.008, transform=fig.transFigure,
                                   boxstyle="round,pad=0.004", fc="#131722", ec="#363a45", alpha=0.92))
for r, (k, v) in enumerate(rows):
    y = ty - r * 0.022; good = not (v.startswith("-") or (k == "Net" and v.startswith("-")))
    col = "white" if r == 0 or k in ("Trades", "Risk/trade", "Fee/side") else ("#26a69a" if (k == "Win rate" and wins/n >= .5) or (k == "Profit factor" and gw >= gl) or (k in ("Net", "$1000 →") and eq >= BAL) else "#ef5350")
    fig.text(tx, y, k, color="#aaa" if r else "white", fontsize=6.5, fontweight="bold" if r == 0 else None)
    fig.text(tx + 0.34, y, v, color=col, fontsize=6.5, ha="right", fontweight="bold")
# tooltip mock
fig.patches.append(FancyBboxPatch((0.04, 0.012), 0.92, 0.04, transform=fig.transFigure, boxstyle="round,pad=0.004", fc="#2a2e39", ec="none"))
fig.text(0.06, 0.03, "Tap any BUY / SELL label → full reason: $ above vs below, target %, stop %, size & leverage", color="#d1d4dc", fontsize=6)
plt.savefig("/home/user/Bb-future-telebot/liquidation_indicator/sample_mobile.png", facecolor=bg); print("saved")
