#!/usr/bin/env python3
# =============================================================================
#  XAUUSD Rule 2 Martingale + Fixed 0.01 Bot  —  strategy-final.py  (single file)
#  v2 (Nov 2026): source = Rule 2 (0.01→0.02→0.04, SL at 0.04 → reset 0.01, any TP → 0.01),
#  one forward channel 'Fixed' (every signal, 0.01), local 1m-candle charts (no chart API),
#  daily (Mon–Sat 13:00 IST) / weekly (every 7 days, pinned) / monthly (every 30 days, pinned) reports.
#  Token: env BOT_TOKEN (systemd EnvironmentFile), OPEN_ADMIN=True -> anyone in DM gets the admin panel.
# =============================================================================
#  REQUIREMENTS
#    - Python >= 3.9
#    - pip install requests pillow matplotlib      (see requirements.txt)
#        requests>=2.28   matplotlib>=3.6   pillow>=9.4
#    - Fonts (for the 💎 in the chart watermark), Debian/Ubuntu:
#        sudo apt-get install -y fonts-noto-color-emoji
#      (DejaVu Sans Bold ships with matplotlib; if the emoji font is missing the
#       watermark is drawn without the 💎 — nothing breaks.)
#
#  RUN ON A VPS
#    1) Copy strategy-final.py (+ requirements.txt) to e.g. /opt/strategybot/
#    2) python3 -m pip install -r requirements.txt
#    3) Quick start:   cd /opt/strategybot && nohup python3 strategy-final.py > out.log 2>&1 &
#    4) Recommended — systemd (auto-restart, survives reboot):
#         /etc/systemd/system/strategybot.service
#         ---------------------------------------
#         [Unit]
#         Description=XAUUSD Martingale Strategy Bot
#         After=network-online.target
#         Wants=network-online.target
#
#         [Service]
#         WorkingDirectory=/opt/strategybot
#         ExecStart=/usr/bin/python3 /opt/strategybot/strategy-final.py
#         Restart=always
#         RestartSec=5
#         User=root
#
#         [Install]
#         WantedBy=multi-user.target
#         ---------------------------------------
#       sudo systemctl daemon-reload && sudo systemctl enable --now strategybot
#       (enable = starts on every boot; Restart=always = restarted if it ever exits)
#
#    5) Fallback without systemd — run_forever.sh (start once with: nohup ./run_forever.sh &):
#         #!/bin/bash
#         cd "$(dirname "$0")"
#         while true; do
#           python3 strategy-final.py >> out.log 2>&1
#           echo "$(date) exited $? - restarting in 5s" >> out.log; sleep 5
#         done
#       and add to crontab -e:   @reboot cd /opt/strategybot && nohup ./run_forever.sh >/dev/null 2>&1 &
#
#  ENGINE / SELF-HEALING
#    - The engine ARMS on the first admin /start and that is saved in the state file:
#      after any crash/restart/reboot it resumes automatically (no /start needed).
#    - A watchdog restarts any dead worker (price / engine / scheduler / telegram);
#      if workers keep dying (>20 in 10 min) or a fatal error happens, the process
#      re-execs itself (os.execv). systemd/run_forever.sh are the outer safety net.
#    - State is written atomically; rotating backups strategybot_state.json.bak1..bak5
#      (every 5 min). A corrupt state file is auto-restored from the newest good backup.
#       logs: journalctl -u strategybot -f   or   strategybot.log next to the script
#
#  SESSIONS / ADMIN UI
#    - Auto signals only inside SESSIONS (UTC, editable in CONFIG); 20:30-24:00 UTC is the
#      no-session / rollover window. Session end cancels the pending delay; the first trade
#      of the next session comes 2-5 min after it starts. Force Signal works any time.
#    - Admin reply keyboard: Dashboard / Force Signal / Open Trades / Menu; everything else
#      is inline under the dashboard/menu message and edits that message in place.
#    - 10 min before a session that follows a >=1h break: 'SESSION STARTING' post (or, if a trade
#      runs, a details reply to its signal); SESSION STARTS / CLOSED stickers around breaks.
#    - TP/SL: 150 ms polling, extreme bid/ask between polls, HIT_TOLERANCE_PIPS touch tolerance;
#      never processed before Entry Achieved is posted. Ranges: /TP 45-55, /SL 60-70 (TP=round(SL*0.78)).
#
#  NOTES
#    - Run exactly ONE instance per bot token (Telegram returns 409 Conflict otherwise).
#    - All times are computed in IST/UTC internally; server timezone does not matter.
#    - State: strategybot_state.json is created next to this script (atomic writes).
#    - Env: SB_TEST=1 tiny TP/SL test mode;  SB_DRY=1 no Telegram calls (logs only);
#           SB_STATE=/path/state.json to override state file location.
# =============================================================================
import sys, subprocess

def _ensure_deps():
    need = []
    for mod, pkg in (("requests", "requests"), ("matplotlib", "matplotlib"), ("PIL", "pillow")):
        try: __import__(mod)
        except ImportError: need.append(pkg)
    if not need: return
    print(f"[setup] missing packages: {need} -> trying pip install ...", file=sys.stderr)
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--quiet", *need])
    except Exception as e:
        sys.exit(f"[setup] could not install {need} ({e}).\n"
                 f"        Run manually:  {sys.executable} -m pip install {' '.join(need)}")

if sys.version_info < (3, 9): sys.exit("Python >= 3.9 required")
_ensure_deps()
import os, sys, json, time, random, logging, threading, html, io, traceback
from datetime import datetime, timedelta, timezone
from logging.handlers import RotatingFileHandler
import requests
def _load_dotenv():
    """Load KEY=VALUE lines from .env next to this script (does not override real env vars)."""
    try:
        with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")) as f:
            for ln in f:
                ln = ln.strip()
                if ln and not ln.startswith("#") and "=" in ln:
                    k, v = ln.split("=", 1); os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    except FileNotFoundError: pass
_load_dotenv()

# ================= CONFIG =================
BOT_TOKEN = os.environ.get("BOT_TOKEN") or ""   # prefer env (.env, chmod 600)
ADMIN_IDS = [1933184782, 7377411824]   # backup admins: receive all alerts, milestones, startup checks
OPEN_ADMIN = True              # True = ANY user who DMs the bot gets the full admin panel / commands
def _bot_user_id():
    """Telegram user id of this bot (token prefix). Never log the token."""
    try:
        raw = os.environ.get("BOT_TOKEN") or BOT_TOKEN or ""
        return int(raw.split(":", 1)[0]) if raw else 0
    except Exception:
        return 0
CHANNEL_ID = -1004479619376                      # Decision API channel · https://t.me/+CoKmfs4GbjU4NzZl
CHANNEL_NAME = "XAUUSD - Decision AI"
CHANNEL_STRATEGY = "Decision API · fixed 0.01 · TP/SL close"    # strategy line shown in every signal / summary
CHANNEL_WM = "XAUUSD DECISION AI"                     # unused on charts (watermark removed); kept for config compatibility
REPORT_NAMES = {"SRC": "XAUUSD - Decision AI"}
CHANNEL_LINKS = {
    "SRC": "https://t.me/+CoKmfs4GbjU4NzZl",
}
# ---- 'own' channel (Free): independent signal stream, fixed 0.01, own #S IDs, MT5 bot button, own footer
OWN_DELAY_RANGE = (600, 1200)      # random 10-20 min after each close before this channel's next signal
OWN_SESSION_GAP_SEC = 3600         # a new session's first signal >= 1 h after the previous session's last close
MT5_BTN = {"inline_keyboard": [[{"text": "👉 Start MT5 Auto Bot 🤖", "url": "https://t.me/Mt5_Signal_follow_bot"}]]}
OWN_FOOTER = "<b>⚠️ Don’t follow signals manually. Let our FREE MT5 Bot execute them automatically! 🤖👇</b>"
MILESTONES = [
    ("1d", 1, "1 day"), ("1w", 7, "1 week"), ("1m", 30, "1 month"),
    ("2m", 60, "2 months"), ("3m", 90, "3 months"), ("4m", 120, "4 months"), ("6m", 180, "6 months"),
]
STREAK_LEVEL_KEYS = ("2", "3", "4", "5", "6", "7", "8+")
SRC_MAX_LOT = 0.01                               # fixed lot: no martingale (always BASE_LOT)
# ---- TARGET channels (forwarders). Each one is fully independent: own #S001 sequence, lot, streak, open trade,
#      account, history, summaries and dedupe.  activate_after = source consecutive-SL streak (>=) at the moment a
#      source signal opens -> that signal is ALSO posted here (same direction / entry / TP / SL, this channel's own lot).
#      progression: "martingale" = double after SL up to max_lot, reset to base_lot after TP;  "fixed" = always base_lot.
#      min_balance: if the channel balance is below it, the forwarded signal is skipped (admin is told once).
CHANNELS = []   # single channel only: no Fixed / Free forwarders

PAIR = "XAUUSD"
PIP = 0.10
POLL_SEC = 0.175         # biquote quote poll interval 150 ms (backs off on 429/errors)
HIT_TOLERANCE_PIPS = 0.5 # TP/SL trigger if the extreme bid/ask between polls comes within this many pips of the level
TP_SL_RATIO = 0.78       # per trade: SL = random int in SL range, TP = round(SL * 0.78) -> SL 60–70 gives TP 47–55
MAX_SIGNAL_ID = None     # v7: no wrap. #S001..#S999, #S1000..#S9999, #S10000.. (digits grow only when needed)
BASE_LOT = 0.01
TP_RANGE = (45, 55)      # backtest best volume vs least loss: TP $4.5–$5.5; admins can change with /TP 45-55
SL_RANGE = (60, 70)      # SL $6.0–$7.0; admins can change with /SL 60-70
DELAY_RANGE = (180, 600) # random 3–10 min after a close before the next auto signal
START_BALANCE = 5000.0   # default for every channel (applied on the next reset; live balances are kept)
WIPE_BALANCE = 5000.0
LEVERAGE = 500
SPREAD_PER_001 = 0.25
STREAK_ALERT_DM = False     # v10: no 'N consecutive SL' streak-alert DMs to admins (channel posts unchanged)
STREAK_ALERT_FROM = 2      # SOURCE: admin alert at SL streak 2,3,4,5,6 and 7+ (every further SL)
TV_URL = "https://www.tradingview.com/chart/?symbol=VANTAGE%3AXAUUSD&interval=1"
TV_LABEL = "📊 Trading View Chart"
CHART_CANDLES = 99               # v8: ~10% more visible bars than v7 (90); slightly tighter, right side unchanged
CHART_CONTEXT = 50               # v8: ~10% more history bars before the entry than v7 (45)
CHART_CONTEXT_MIN = 12           # always at least this many bars before the entry
CHART_BOX_HFRAC = 0.40           # drop older history that would squeeze the TP+SL box below 40% of the height
CHART_BOX_FRAC = 0.38            # position box covers at least this share of the plot width (right side)
CHART_CANDLES_MAX = 180          # cap when the window expands left to keep the entry candle visible
CANDLE_KEEP = 3000               # ~2 days of 1m candles (enough for a 15m chart)
HISTORY_KEEP = 200               # detailed closed trades retained after 24h housekeeping
HOUSEKEEP_SEC = 24 * 3600
PRICE_STALE_SEC = 15             # no new auto signal if the quote is older than this
PRICE_STALE_ALERT_SEC = 60       # admin alert if the feed stays stale this long
CHART_TFS = (1, 5, 15)           # allowed chart timeframes (minutes)
CHART_TF_DEFAULT = 1             # default 1m; admins can change it in the panel
CHART_THEMES = ("light", "dark") # ref zip white/black themes; 'light' is our current look
CHART_THEME_DEFAULT = "light"
CHART_MEASURES = ("box", "lines")  # box = filled TP/SL zones (current default); lines = levels only
CHART_MEASURE_DEFAULT = "box"
CHART_WM_DEFAULT = False         # watermark off by default (user asked it removed)
# ~2K output: 12.8in x 8.1in at 200 dpi = 2560 x 1620. 4K skipped (Telegram JPEG + RAM on a 300M cgroup).
CHART_FIGSIZE = (12.8, 8.1)
CHART_DPI = 200
CHART_PALETTES = {
    # v5: exact palette of the user's source charts (ref_chart/chart.py THEMES "white"/"dark"; candles #089981 /
    # #f23645 = also the original XAU source). TP_TXT/SL_TXT = text on the right-axis TP/SL price tags (ref: black / white).
    "light": dict(BG="#ffffff", GRID="#eceef2", TXT="#4a4f5c", MUTED="#4a4f5c", HEAD="#131722",
                  UP="#089981", DN="#f23645", TPC="#16a34a", SLC="#e5322d", ENC="#131722",
                  TAG="white", ENC_TXT="white", TP_TXT="black", SL_TXT="white"),
    "dark":  dict(BG="#181A20", GRID="#262A33", TXT="#b2b5be", MUTED="#b2b5be", HEAD="#d1d4dc",
                  UP="#089981", DN="#f23645", TPC="#22c55e", SLC="#f0533f", ENC="#e0e3eb",
                  TAG="white", ENC_TXT="black", TP_TXT="black", SL_TXT="white"),
}
CHART_BOX_ALPHA = 0.16           # ref position-box fill opacity
CHART_LW = 1.6                   # ref line widths x1.6 (ref canvas 1600 px wide, ours 2560 px)
REPORT_HOUR = 13                 # IST hour for daily / weekly / monthly reports
NO_ENTRY_FRI_UTC = "20:00"       # Friday: no new auto entries from this UTC time until the market reopens
PRICE_URL = "https://biquote.io/api/XAUUSD"
IST = timezone(timedelta(hours=5, minutes=30))

# ---- trading sessions (UTC, "HH:MM"; end exclusive). Auto signals only inside a session.
SESSIONS_ENABLED = True
SESSIONS = [("ASIAN", "00:00", "07:00"), ("LONDON", "07:00", "12:00"), ("NEW YORK", "12:00", "20:30")]
# 20:30-24:00 UTC = NO-SESSION / rollover window (broker swap ~21:00-22:00 UTC) -> no auto signals
MAX_TRADES_PER_SESSION = 0          # 0 = unlimited auto signals per session (admin Force Signal never limited)
SESSION_EMOJI = {"ASIAN": "🌏", "LONDON": "🇬🇧", "NEW YORK": "🇺🇸", "OUTSIDE": "🌙"}
# ---- swap ESTIMATE shown in admin alerts (USD per 0.01 lot per night; broker-specific, edit to match yours)
SWAP_PER_001_LOT_LONG = 0.50        # BUY
SWAP_PER_001_LOT_SHORT = 0.30       # SELL
SWAP_TRIPLE_WEEKDAY = 2             # Wednesday rollover charges x3 (Mon=0)
LONG_TRADE_ALERT_HOURS = (5, 10)    # admin alert once when a trade runs longer than each of these
SESSION_GAP_MIN_HOURS = 1           # "starting in 10 min" post only if no session was active this long before
PRE_SESSION_MIN = 10
# stickers from set "TechnicalMindTrades" (green SESSION STARTS / red SESSION CLOSED)
STICKER_SESSION_STARTS = "CAACAgUAAxUAAWrOJOS6wFLD8_Do0EZ8oV_40L_3AAJ9AwACVul4VLAwMZvc70ooPQQ"
STICKER_SESSION_CLOSED = "CAACAgUAAxUAAWrOJOSzJJp0ExbQqy9aXkqKeSVwAAJCAwACjU54VIOZwqUL2ZBKPQQ"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.environ.get("SB_STATE") or os.path.join(BASE_DIR, "strategybot_state.json")
LOG_FILE = os.path.join(BASE_DIR, "strategybot.log")
FORCE_FLAG = os.path.join(BASE_DIR, "force.flag")   # local trigger (box only)
CANDLE_FILE = os.environ.get("SB_CANDLES") or os.path.join(os.path.dirname(STATE_FILE), "candles_1m.json")
SAVE_CHARTS = os.environ.get("SB_SAVE_CHARTS") == "1"   # also write every chart PNG to ./charts (debug / samples)
DRY_RUN = os.environ.get("SB_DRY") == "1"            # no Telegram calls
TEST_MODE = os.environ.get("SB_TEST") == "1"         # tiny TP/SL, short delay
if TEST_MODE:
    TP_RANGE, SL_RANGE, DELAY_RANGE = (2, 3), (2, 3), (5, 10)

log = logging.getLogger("sb")
API = f"https://api.telegram.org/bot{BOT_TOKEN}/"

# ================= GOOGLE DECISIONS API (BUY / SELL decider) =================
DECISION_API_KEY = os.environ.get("DECISION_API_KEY") or ""
DECISION_URL = "https://generativelanguage.googleapis.com/v1beta/decisions"
DECISION_MODEL = "gemini-decision-1"
DECISION_CANDLES = 180           # 1m candles used for indicators (bot's own + backfill)
DECISION_RETRY_SEC = 20          # API failure -> wait this long, then ask again (signal is never randomised / skipped)
DECISION_INSTR = ("You are an expert XAUUSD (gold) 1-minute scalper. Trades last only 2-10 minutes. Using the indicators "
                  "and the most recent 1m candles (short-term momentum, EMA9/EMA21 cross, RSI, candle bodies/wicks, "
                  "breakout or rejection of the recent high/low), decide which side is more likely to reach its take "
                  "profit before its stop loss within the next 2-10 minutes. Focus on the last 5-15 minutes; the higher "
                  "timeframes are only context.")
DECISION_STATS = {"calls": 0, "ok": 0, "fail": 0, "last_err": "—", "last": None, "log": []}
BACKFILL_URL = "https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1m&range=1d"
_BACKFILL = {"t": 0, "rows": []}

def backfill_rows():
    """COMEX gold 1m candles (Yahoo, ~10 min delayed), cached 60 s. Only used where the bot has no own candles."""
    if time.time() - _BACKFILL["t"] < 60: return _BACKFILL["rows"]
    _BACKFILL["t"] = time.time()
    try:
        d = requests.get(BACKFILL_URL, timeout=8, headers={"User-Agent": "Mozilla/5.0"}).json()["chart"]["result"][0]
        q = d["indicators"]["quote"][0]; out = []
        for k, ts in enumerate(d["timestamp"]):
            o, h, l, c = q["open"][k], q["high"][k], q["low"][k], q["close"][k]
            if None not in (o, h, l, c): out.append((float(ts // 60 * 60), o, h, l, c))
        _BACKFILL["rows"] = out
    except Exception as e:
        log.warning("backfill failed: %s", str(e)[:120])
    return _BACKFILL["rows"]

def merged_rows(own, n=DECISION_CANDLES):
    """Own fresh 1m candles; the older gap is filled from backfill shifted to our price level (offset at the join)."""
    own = [tuple(r) for r in (own or []) if time.time() - r[0] < 3 * 3600]
    if len(own) >= n: return own[-n:]
    bf = backfill_rows()
    if not bf: return own
    if own:
        t0 = own[0][0]; prev = [r for r in bf if r[0] < t0]
        if not prev: return own
        off = own[0][1] - prev[-1][4]
    else:
        prev = bf; off = 0.0
        if time.time() - prev[-1][0] > 3 * 3600: return own
    prev = [(r[0], r[1] + off, r[2] + off, r[3] + off, r[4] + off) for r in prev]
    return (prev + own)[-n:]

def _ema(v, n):
    k = 2 / (n + 1); e = v[0]
    for x in v[1:]: e = x * k + e * (1 - k)
    return e

def _rsi(v, n=14):
    if len(v) <= n: return 50.0
    g = [max(0, v[i] - v[i - 1]) for i in range(len(v) - n, len(v))]
    l_ = [max(0, v[i - 1] - v[i]) for i in range(len(v) - n, len(v))]
    ag, al = sum(g) / n, sum(l_) / n
    return 100.0 if al == 0 else 100 - 100 / (1 + ag / al)

def _agg(rows, m):
    out = {}
    for r in rows:
        k = int(r[0] // (m * 60))
        if k not in out: out[k] = [r[0], r[1], r[2], r[3], r[4]]
        else: o = out[k]; o[2] = max(o[2], r[2]); o[3] = min(o[3], r[3]); o[4] = r[4]
    return [tuple(x) for x in out.values()]

def decision_input(rows, bid, ask, session, now_utc=None, tp=5.0, sl=6.5):
    now_utc = now_utc or datetime.now(timezone.utc); mid = (bid + ask) / 2
    L = [f"Symbol: XAUUSD spot gold. Time {now_utc:%Y-%m-%d %H:%M} UTC, session {session}.",
         f"Live bid {bid:.2f} / ask {ask:.2f}. Trade plan: TP about ${tp:.1f} price move, SL about ${sl:.1f}, horizon 2-10 minutes."]
    if len(rows) < 5:
        L.append("Very little candle history available."); return "\n".join(L)
    c = [r[4] for r in rows] + [mid]
    tr = [max(r[2], rows[i - 1][4]) - min(r[3], rows[i - 1][4]) for i, r in enumerate(rows) if i]
    atr = sum(tr[-14:]) / max(1, len(tr[-14:]))
    e9, e21, e50 = _ema(c, 9), _ema(c, 21), _ema(c, 50)
    e9p = _ema(c[:-3], 9) if len(c) > 12 else e9
    hi15, lo15 = max(r[2] for r in rows[-15:]), min(r[3] for r in rows[-15:])
    hi60, lo60 = max(r[2] for r in rows[-60:]), min(r[3] for r in rows[-60:])
    ch = lambda n: mid - c[max(0, len(c) - 1 - n)]
    L += ["INDICATORS (1m):",
          f"Change: last 1m {ch(1):+.2f}, 3m {ch(3):+.2f}, 5m {ch(5):+.2f}, 10m {ch(10):+.2f}, 15m {ch(15):+.2f}, 30m {ch(30):+.2f}, 60m {ch(60):+.2f}.",
          f"EMA9 {e9:.2f} ({'rising' if e9 > e9p else 'falling'}), EMA21 {e21:.2f}, EMA50 {e50:.2f}; price is "
          f"{'ABOVE' if mid > e9 else 'BELOW'} EMA9 and {'ABOVE' if mid > e21 else 'BELOW'} EMA21; EMA9 {'>' if e9 > e21 else '<'} EMA21.",
          f"RSI14 1m: {_rsi(c):.1f}. ATR14 1m: {atr:.2f}.",
          f"Last 15m range {lo15:.2f}-{hi15:.2f} (price at {(mid - lo15) / max(0.01, hi15 - lo15) * 100:.0f}% of range); "
          f"last 60m range {lo60:.2f}-{hi60:.2f} (at {(mid - lo60) / max(0.01, hi60 - lo60) * 100:.0f}%).",
          f"Distance to 15m high {hi15 - mid:+.2f}, to 15m low {lo15 - mid:+.2f}."]
    for m in (5, 15):
        a = _agg(rows, m)[-6:]
        if len(a) >= 2:
            L.append(f"{m}m candles (open/high/low/close) oldest->newest: " + "; ".join(f"{x[1]:.2f}/{x[2]:.2f}/{x[3]:.2f}/{x[4]:.2f}" for x in a))
    L.append("Last 15 x 1m candles oldest->newest (time UTC open high low close | body, upper wick, lower wick):")
    for r in rows[-15:]:
        o, h, l_, cl = r[1], r[2], r[3], r[4]
        L.append(f"{datetime.fromtimestamp(r[0], timezone.utc):%H:%M} {o:.2f} {h:.2f} {l_:.2f} {cl:.2f} | "
                 f"{cl - o:+.2f}, {h - max(o, cl):.2f}, {min(o, cl) - l_:.2f}")
    return "\n".join(L)

def decide_direction(rows, bid, ask, session, timeout=20, tp=5.0, sl=6.5):
    """Ask the Decisions API: BUY or SELL. Returns (dir, info) or raises. No random fallback."""
    rows = merged_rows(rows)
    body = {"model": DECISION_MODEL, "input": decision_input(rows, bid, ask, session, tp=tp, sl=sl),
            "questions": {"direction": {"type": "choice", "instructions": DECISION_INSTR,
                                        "criteria": {"buy": f"BUY now: price likely rises ${tp:.1f} before it falls ${sl:.1f} in the next 2-10 minutes.",
                                                     "sell": f"SELL now: price likely falls ${tp:.1f} before it rises ${sl:.1f} in the next 2-10 minutes."}}}}
    DECISION_STATS["calls"] += 1
    try:
        r = requests.post(DECISION_URL, json=body, timeout=timeout,
                          headers={"x-goog-api-key": DECISION_API_KEY, "Content-Type": "application/json"})
        if r.status_code != 200:
            raise RuntimeError(f"HTTP {r.status_code}: {r.text[:200]}")
        ans = r.json()["answers"]["direction"]
        ch = str(ans.get("choice", "")).lower()
        if ch not in ("buy", "sell"): raise RuntimeError(f"bad choice {ch!r}")
        probs = {k.lower(): float(v) for k, v in (ans.get("probabilities") or {}).items()}
        info = dict(choice=ch.upper(), conf=float(ans.get("confidence") or probs.get(ch) or 0),
                    buy=probs.get("buy", 0.0), sell=probs.get("sell", 0.0), ts=time.time())
    except Exception as e:
        DECISION_STATS["fail"] += 1; DECISION_STATS["last_err"] = f"{datetime.now(IST):%d %b %H:%M:%S} {str(e)[:150]}"
        raise
    DECISION_STATS["ok"] += 1; DECISION_STATS["last"] = info
    return info["choice"], info

# ================= PURE LOGIC (unit tested) =================
def pips_between(direction, entry, price):
    d = (price - entry) if direction == "BUY" else (entry - price)
    return round(d / PIP, 1)

def money_for_pips(pips, lot):
    return round(pips * lot * 10, 2)

def spread_cost(lot):
    return round(lot / 0.01 * SPREAD_PER_001, 2)

def margin_for(price, lot):
    return round(price * 100 * lot / LEVERAGE, 2)

def close_price_for(direction, bid, ask):
    return ask if direction == "SELL" else bid

def entry_price_for(direction, bid, ask):
    return bid if direction == "SELL" else ask

def levels(direction, entry, tp_pips, sl_pips):
    if direction == "BUY":
        return round(entry + tp_pips * PIP, 3), round(entry - sl_pips * PIP, 3)
    return round(entry - tp_pips * PIP, 3), round(entry + sl_pips * PIP, 3)

def check_hit(trade, bid, ask):
    """Return 'TP', 'SL' or None using the real closing side."""
    p = close_price_for(trade["direction"], bid, ask)
    if trade["direction"] == "BUY":
        if p >= trade["tp"]: return "TP"
        if p <= trade["sl"]: return "SL"
    else:
        if p <= trade["tp"]: return "TP"
        if p >= trade["sl"]: return "SL"
    return None

def check_hit_ext(trade, ext, tol_pips=None):
    """TP/SL from the extreme bid/ask seen since the last check (ext = dict min_bid,max_bid,min_ask,max_ask),
    with a touch tolerance in pips. If both levels were touched in one window, SL wins (conservative)."""
    tol = (HIT_TOLERANCE_PIPS if tol_pips is None else tol_pips) * PIP + 1e-9
    if trade["direction"] == "BUY":      # closes on bid
        sl = ext["min_bid"] <= trade["sl"] + tol; tp = ext["max_bid"] >= trade["tp"] - tol
    else:                                # closes on ask
        sl = ext["max_ask"] >= trade["sl"] - tol; tp = ext["min_ask"] <= trade["tp"] + tol
    return "SL" if sl else ("TP" if tp else None)

def pick_tp_sl(tp_range, sl_range, ratio=None, rnd=random):
    """SL = random int in sl_range; TP = round(SL*ratio) must be inside tp_range. Returns (tp, sl, feasible)."""
    ratio = TP_SL_RATIO if ratio is None else ratio
    ok = [x for x in range(sl_range[0], sl_range[1] + 1) if tp_range[0] <= int(x * ratio + 0.5) <= tp_range[1]]
    if ok:
        sl = rnd.choice(ok); return int(sl * ratio + 0.5), sl, True
    sl = rnd.randint(*sl_range); return min(max(int(sl * ratio + 0.5), tp_range[0]), tp_range[1]), sl, False

def ranges_feasible(tp_range, sl_range, ratio=None):
    return pick_tp_sl(tp_range, sl_range, ratio)[2]

def chart_key(kind, t, reason=None):
    """Image cache key: unique per SOURCE signal instance (id + open time, survives id reuse after a sequence
    reset or S1000 wrap) + direction, so a cached image can never belong to another signal."""
    uid = f"{t.get('src_key') or t.get('key') or t.get('id')}@{int(float(t.get('opened') or 0) * 1000)}"
    return f"{kind}|{uid}|{t['direction']}" + (f"|{reason}" if reason else "")

def signal_id(seq):
    """seq 1..∞ -> (id, dedupe key). Zero-padded to at least 3 digits: S001..S999, S1000..S9999, S10000.. (no wrap).
    Keys for seq <= 999 are identical to the old scheme, so existing dedupe / history keep matching."""
    seq = max(1, int(seq)); sid = f"S{seq:03d}"
    return sid, sid

def session_window(key):
    """'YYYY-MM-DD|NAME' -> (name, start_dt, end_dt) UTC."""
    d, name = key.split("|"); day = datetime.fromisoformat(d).replace(tzinfo=timezone.utc)
    for n, a, b in SESSIONS:
        if n == name: return n, day + timedelta(minutes=_hm(a)), day + timedelta(minutes=_hm(b))
    return None

def gap_before(start_utc, hours=None):
    """True if no session was active during the `hours` before start_utc."""
    hours = SESSION_GAP_MIN_HOURS if hours is None else hours
    return all(session_at(start_utc - timedelta(minutes=m)) is None for m in range(1, int(hours * 60) + 1))

from decimal import Decimal, ROUND_HALF_UP
def qlot(x):
    """Lot rounded exactly to 0.01 (Decimal, no float drift)."""
    return float(Decimal(str(x)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

def next_martingale(lot, streak, result_win, base=None, max_lot=None, fixed=False):
    """Rule 2: TP -> base. SL -> double, up to max_lot; an SL AT max_lot resets the next lot to base.
    The SL streak keeps counting (analytics / alerts) — only the lot resets."""
    base = BASE_LOT if base is None else base
    if result_win: return qlot(base), 0
    if fixed: return qlot(base), streak + 1
    if max_lot and Decimal(str(qlot(lot))) >= Decimal(str(max_lot)): return qlot(base), streak + 1
    nl = Decimal(str(lot)) * 2
    if max_lot: nl = min(nl, Decimal(str(max_lot)))
    return qlot(nl), streak + 1

def streak_analytics(hist):
    """Source SL-streak analytics from closed trades (chronological). A loss = pips <= 0.
    runs[n] = losing runs that ended with exactly n SLs (followed by a TP), reached[n] = runs that reached >= n SLs
    (incl. the current running streak), tp_after[n] = TP that came right after exactly n SLs (n=0: TP after TP).
    recovery[n] = % of runs that reached n SLs and were then recovered by a TP before n+1."""
    runs, reached, tp_after, run, mx = {}, {}, {}, 0, 0
    sysn = sum(1 for h in hist if h.get("reason") == "FORCE")
    hist = [h for h in hist if h.get("reason") != "FORCE"]     # system closes are neither TP nor SL
    for h in sorted(hist, key=lambda h: h["closed"]):
        if h["pips"] > 0:
            tp_after[run] = tp_after.get(run, 0) + 1
            if run: runs[run] = runs.get(run, 0) + 1
            run = 0
        else:
            run += 1; mx = max(mx, run); reached[run] = reached.get(run, 0) + 1
    rec = {n: round(tp_after.get(n, 0) / reached[n] * 100, 1) for n in reached}
    return dict(runs=runs, reached=reached, tp_after=tp_after, current=run, max=mx, recovery=rec, system=sysn,
                trades=len(hist), tp=sum(1 for h in hist if h["pips"] > 0))

def is_weekend(now_utc):
    wd, h = now_utc.weekday(), now_utc.hour
    if wd == 4 and h >= 22: return True
    if wd == 5: return True
    if wd == 6 and h < 22: return True
    return False

# ---- market hours (XAUUSD spot / CFD follows the CME metals clock, New York time) ----
# Weekend: Fri 17:00 NY -> Sun 18:00 NY (= Fri 22:00 -> Sun 23:00 UTC in winter, 21:00 -> 22:00 UTC in summer).
# Daily break 17:00-18:00 NY. biquote.io flagged the feed 'stale' from Fri 13 Nov 22:03 UTC = 17:03 NY (matches).
# Holidays: whole trading day closed (from 18:00 NY the evening before until 18:00 NY on the day).
try:
    from zoneinfo import ZoneInfo
    NY_TZ = ZoneInfo("America/New_York")
except Exception:                       # no tzdata: fixed EST (winter) fallback
    NY_TZ = timezone(timedelta(hours=-5))
MARKET_HOLIDAYS_MD = ((1, 1), (12, 25))   # New Year's Day, Christmas (+ Good Friday computed below)
MARKET_CLOSED_POLL_SEC = 60               # while closed: no HTTP, just re-check the clock

def _easter(y):
    a = y % 19; b, c = divmod(y, 100); d, e = divmod(b, 4); f = (b + 8) // 25; g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30; i, k = divmod(c, 4); l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451; mo, dy = divmod(h + l - 7 * m + 114, 31)
    return datetime(y, mo, dy + 1).date()

def market_holiday(d):
    """d: date. True on a full market holiday (Jan 1, Dec 25, Good Friday)."""
    return (d.month, d.day) in MARKET_HOLIDAYS_MD or d == _easter(d.year) - timedelta(days=2)

def market_closed(now_utc=None):
    """True when XAUUSD does not trade: weekend, daily 17:00-18:00 NY break, or a holiday trading day."""
    now_utc = now_utc or datetime.now(timezone.utc)
    ny = now_utc.astimezone(NY_TZ); wd, h = ny.weekday(), ny.hour
    if wd == 5 or (wd == 4 and h >= 17) or (wd == 6 and h < 18): return True
    if h == 17: return True
    td = ny.date() + timedelta(days=1 if h >= 18 else 0)      # trading day this session belongs to
    return market_holiday(td)

def market_reopen(now_utc=None):
    """Next UTC datetime the market is open (now if open). Opens are always on a whole hour."""
    now_utc = now_utc or datetime.now(timezone.utc)
    if not market_closed(now_utc): return now_utc
    t = now_utc.replace(minute=0, second=0, microsecond=0)
    for _ in range(24 * 8):
        t += timedelta(hours=1)
        if not market_closed(t): return t
    return None

def market_last_open(now_utc=None):
    """UTC datetime the current open stretch began (None if closed / not found within 8 days)."""
    now_utc = now_utc or datetime.now(timezone.utc)
    if market_closed(now_utc): return None
    t = now_utc.replace(minute=0, second=0, microsecond=0)
    for _ in range(24 * 8):
        if market_closed(t - timedelta(minutes=1)): return t
        t -= timedelta(hours=1)
    return None

def run_days(start_ts, now_ts=None):
    """(total_days, trading_days) since start. Total = full 24 h days incl. weekends (weekly = 7, monthly = 30).
    Trading days = IST calendar dates from the start date to today that are Mon-Fri and not a market holiday."""
    now_ts = now_ts or time.time()
    if not start_ts: return 0, 0
    total = max(1, int((now_ts - start_ts) // 86400)) if now_ts > start_ts else 0
    d0 = datetime.fromtimestamp(start_ts, IST).date(); d1 = datetime.fromtimestamp(now_ts, IST).date()
    td = 0; d = d0
    while d <= d1:
        if d.weekday() < 5 and not market_holiday(d): td += 1
        d += timedelta(days=1)
    return total, td

def run_days_lines(start_ts, now_ts=None):
    tot, td = run_days(start_ts, now_ts)
    st = datetime.fromtimestamp(start_ts, IST).strftime("%d %b %Y") if start_ts else "—"
    return [f"📅 <b>Started:</b> {st}",
            f"🗓 <b>Total days:</b> {tot} (incl. weekends)",
            f"📊 <b>Trading days:</b> {td} (excl. weekends / holidays)"]

def run_days_short(start_ts, now_ts=None):
    tot, td = run_days(start_ts, now_ts)
    st = datetime.fromtimestamp(start_ts, IST).strftime("%d %b %Y") if start_ts else "—"
    return f"📅 <b>Started:</b> {st} · 🗓 <b>Days:</b> {tot} · 📊 <b>Trading days:</b> {td}"

def is_last_day(d):
    return (d + timedelta(days=1)).month != d.month

def period_due(now_ist, anchor_ts, days, hour=None):
    """Completed report periods: first due = first HOUR:00 IST at/after anchor + days, then every `days`.
    Returns how many periods are due by now (0 = none yet)."""
    hour = REPORT_HOUR if hour is None else hour
    if not anchor_ts: return 0
    a = datetime.fromtimestamp(anchor_ts, IST) + timedelta(days=days)
    first = a.replace(hour=hour, minute=0, second=0, microsecond=0)
    if first < a: first += timedelta(days=1)
    if now_ist < first: return 0
    return 1 + int((now_ist - first).total_seconds() // (days * 86400))

def due_reports(now_ist, sent, anchor_ts):
    """[(kind, sent_key, value)] due now. Daily: every day at REPORT_HOUR IST except Sunday (first one needs >= 12 h
    of running). Weekly: every 7 days, monthly: every 30 days since the channel's cycle start (anchor), at REPORT_HOUR."""
    out = []; d = now_ist.date().isoformat()
    if anchor_ts and now_ist.hour >= REPORT_HOUR and now_ist.weekday() != 6 and sent.get("daily") != d \
            and now_ist.timestamp() - anchor_ts >= 12 * 3600:
        out.append(("daily", "daily", d))
    for kind, days in (("weekly", 7), ("monthly", 30)):
        n = period_due(now_ist, anchor_ts, days)
        if n and int(sent.get(kind + "_n", 0) or 0) < n: out.append((kind, kind + "_n", n))
    return out

def _period_first(anchor_ts, days, hour=None):
    hour = REPORT_HOUR if hour is None else hour
    a = datetime.fromtimestamp(anchor_ts, IST) + timedelta(days=days)
    first = a.replace(hour=hour, minute=0, second=0, microsecond=0)
    if first < a: first += timedelta(days=1)
    return first

def last_daily_cutoff(now_ist):
    """Latest REPORT_HOUR IST boundary <= now that is a daily-report day (no Sunday report, so Sunday /
    Monday-before-1PM fall back to Saturday 1 PM, exactly what Monday's 48 h report covers)."""
    c = now_ist.replace(hour=REPORT_HOUR, minute=0, second=0, microsecond=0)
    if c > now_ist: c -= timedelta(days=1)
    while c.weekday() == 6: c -= timedelta(days=1)
    return c

def next_report_times(now_ist, sent, anchor_ts):
    """{'daily'|'weekly'|'monthly': datetime IST of the next scheduled send, or None (no cycle yet)}.
    Mirrors due_reports(): a period that is due but not yet marked sent returns `now` (posts on the next loop)."""
    out = {}
    if not anchor_ts:
        return {"daily": None, "weekly": None, "monthly": None}
    sent = sent or {}
    c = now_ist.replace(hour=REPORT_HOUR, minute=0, second=0, microsecond=0)
    if now_ist >= c and sent.get("daily") != now_ist.date().isoformat() and c.weekday() != 6 \
            and now_ist.timestamp() - anchor_ts >= 12 * 3600:
        out["daily"] = now_ist
    else:
        c = c if now_ist < c else c + timedelta(days=1)
        for _ in range(10):
            if c.weekday() != 6 and c.timestamp() - anchor_ts >= 12 * 3600: break
            c += timedelta(days=1)
        out["daily"] = c
    for kind, days in (("weekly", 7), ("monthly", 30)):
        n = period_due(now_ist, anchor_ts, days)
        if n and int(sent.get(kind + "_n", 0) or 0) < n:
            out[kind] = now_ist
        else:
            out[kind] = _period_first(anchor_ts, days) + timedelta(days=days * n)
    return out

def preview_start(kind, now_ist, anchor_ts):
    """Start of the CURRENT (in-progress) report period, anchored on the last 1 PM IST cutoff:
    daily = last daily cutoff; weekly / monthly = the next scheduled boundary minus the period."""
    if kind == "daily" or not anchor_ts:
        return last_daily_cutoff(now_ist) if kind == "daily" else now_ist - timedelta(days=7 if kind == "weekly" else 30)
    days = 7 if kind == "weekly" else 30
    n = period_due(now_ist, anchor_ts, days)
    nxt = _period_first(anchor_ts, days) + timedelta(days=days * n)
    return nxt - timedelta(days=days)

def due_summaries(now_ist, sent):      # legacy name kept (fresh-state marker only)
    return ["daily"] if now_ist.hour >= REPORT_HOUR and sent.get("daily") != now_ist.date().isoformat() else []

def friday_cutoff(now_utc):
    """True from Friday NO_ENTRY_FRI_UTC (UTC) onwards: no new auto entries until the weekend is over."""
    return now_utc.weekday() == 4 and now_utc.hour * 60 + now_utc.minute >= _hm(NO_ENTRY_FRI_UTC)

def report_stats(hs, max_lot=None):
    """Window statistics from closed trades (chronological). System closes (FORCE) count for $ / lots but not W/L."""
    hs = sorted(hs, key=lambda h: h["closed"]); wl = [h for h in hs if h.get("reason") != "FORCE"]
    won = lambda h: h.get("reason") == "TP" or (h.get("reason") not in ("SL", "STOPOUT") and h.get("pips", 0) > 0)
    wins = [h["net"] for h in wl if won(h)]; losses = [h["net"] for h in wl if not won(h)]
    gw, gl = sum(wins), -sum(losses); net = round(sum(h["net"] for h in hs), 2)
    lots = sum(h["lot"] for h in hs); spread = round(sum(spread_cost(h["lot"]) for h in hs), 2)
    aw = gw / len(wins) if wins else 0.0; al = gl / len(losses) if losses else 0.0
    eq = peak = dd = 0.0
    for h in hs:
        eq += h["net"]; peak = max(peak, eq); dd = max(dd, peak - eq)
    runs, run = {}, 0
    for h in wl:
        if won(h):
            if run: runs[run] = runs.get(run, 0) + 1
            run = 0
        else: run += 1
    mx = max(list(runs) + [run, 0])
    dist = {"1": runs.get(1, 0), "2": runs.get(2, 0), "3": runs.get(3, 0), "4+": sum(c for n, c in runs.items() if n >= 4)}
    lotc = {}
    for h in hs: k = f"{qlot(h['lot']):.2f}"; lotc[k] = lotc.get(k, 0) + 1
    resets = sum(1 for h in wl if max_lot and not won(h) and qlot(h["lot"]) >= max_lot - 1e-9)
    n = len(wl)
    return dict(trades=len(hs), wl=n, wins=len(wins), losses=len(losses), winrate=(len(wins) / n * 100 if n else 0.0),
                be_winrate=(al / (aw + al) * 100 if (aw + al) else 0.0), avg_win=aw, avg_loss=al,
                pf=(gw / gl if gl else (float("inf") if gw else 0.0)), expectancy=(net / len(hs) if hs else 0.0),
                best=max([h["net"] for h in hs], default=0.0), worst=min([h["net"] for h in hs], default=0.0),
                lots=round(lots, 2), spread=spread, net=net, gross=round(net + spread, 2), dd=round(dd, 2),
                max_streak=mx, cur_run=run, dist=dist, lot_counts=dict(sorted(lotc.items())), resets=resets,
                max_lot=max([h["lot"] for h in hs], default=0.0))

# ---- history aggregates / streak levels / housekeeping helpers ----
# A losing streak of N counts once at every level it reached (a streak of 6 is
# 2, 3, 4, 5 and 6 SL). The currently running streak is stored separately and
# included the same way (every level it has reached so far) in snapshot reports.

def empty_day():
    return dict(tp=0, sl=0, force=0, trades=0, pips=0.0, net=0.0, volume=0.0, spread=0.0,
                win_pnl=0.0, loss_pnl=0.0, win_n=0, loss_n=0, best=None, worst=None, max_lot=0.0)

def empty_hist_agg():
    return dict(upto=0.0, closed=0, trades=0, tp=0, sl=0, force=0, pips=0.0, net=0.0, volume=0.0, spread=0.0,
                win_pnl=0.0, loss_pnl=0.0, win_n=0, loss_n=0, best=None, worst=None, max_lot=0.0,
                hours={}, rows=[], streak_ends=[], streak_open=0, max_streak=0)

def merge_hist_agg(raw):
    d = empty_hist_agg()
    if isinstance(raw, dict):
        d.update({k: raw[k] for k in d if k in raw})
        if not isinstance(d.get("hours"), dict): d["hours"] = {}
        if not isinstance(d.get("rows"), list): d["rows"] = []
        if not isinstance(d.get("streak_ends"), list): d["streak_ends"] = []
    return d

def hour_key(ts):
    return datetime.fromtimestamp(ts, IST).replace(minute=0, second=0, microsecond=0).strftime("%Y-%m-%dT%H")

def hour_ts(key):
    return datetime.strptime(key, "%Y-%m-%dT%H").replace(tzinfo=IST).timestamp()

def is_win_trade(h):
    if h.get("sys") or h.get("reason") == "FORCE": return False
    return h.get("reason") == "TP" or (h.get("reason") not in ("SL", "STOPOUT") and h.get("pips", 0) > 0)

def is_sys_trade(h):
    return bool(h.get("sys") or h.get("reason") == "FORCE")

def bucket_add(b, h):
    net = float(h.get("net") or 0); pips = float(h.get("pips") or 0); lot = float(h.get("lot") or 0)
    b["trades"] += 1
    b["pips"] = round(b["pips"] + pips, 1)
    b["net"] = round(b["net"] + net, 2)
    b["volume"] = round(b["volume"] + lot, 4)
    b["spread"] = round(b.get("spread", 0) + spread_cost(lot), 2)
    b["max_lot"] = max(b.get("max_lot") or 0, lot)
    if is_sys_trade(h):
        b["force"] += 1
    elif is_win_trade(h):
        b["tp"] += 1; b["win_n"] += 1; b["win_pnl"] = round(b["win_pnl"] + net, 2)
    else:
        b["sl"] += 1; b["loss_n"] += 1; b["loss_pnl"] = round(b["loss_pnl"] + net, 2)
    b["best"] = net if b["best"] is None else max(b["best"], net)
    b["worst"] = net if b["worst"] is None else min(b["worst"], net)
    return b

def bucket_merge(a, b):
    if not b: return a
    if not a: return dict(b)
    out = dict(a)
    for k in ("tp", "sl", "force", "trades", "win_n", "loss_n"):
        out[k] = (a.get(k) or 0) + (b.get(k) or 0)
    for k in ("pips", "net", "volume", "spread", "win_pnl", "loss_pnl"):
        out[k] = round((a.get(k) or 0) + (b.get(k) or 0), 4 if k == "volume" else (1 if k == "pips" else 2))
    out["max_lot"] = max(a.get("max_lot") or 0, b.get("max_lot") or 0)
    for k in ("best", "worst"):
        av, bv = a.get(k), b.get(k)
        if av is None: out[k] = bv
        elif bv is None: out[k] = av
        else: out[k] = max(av, bv) if k == "best" else min(av, bv)
    return out

def apply_trade_to_agg(agg, h):
    bucket_add(agg, h)
    hk = hour_key(h["closed"])
    hours = agg.setdefault("hours", {})
    hours[hk] = bucket_add(hours.get(hk) or empty_day(), h)
    if is_sys_trade(h): code = 2
    elif is_win_trade(h): code = 1
    else: code = 0
    agg.setdefault("rows", []).append([float(h["closed"]), float(h.get("net") or 0),
                                       float(h.get("pips") or 0), float(h.get("lot") or 0), code])
    agg["upto"] = max(float(agg.get("upto") or 0), float(h["closed"]))
    agg["closed"] = agg.get("closed", 0) + 1
    if not is_sys_trade(h):
        run = int(agg.get("streak_open") or 0)
        if is_win_trade(h):
            if run:
                agg.setdefault("streak_ends", []).append([h["closed"], run])
                agg["max_streak"] = max(int(agg.get("max_streak") or 0), run)
            agg["streak_open"] = 0
        else:
            run += 1
            agg["streak_open"] = run
            agg["max_streak"] = max(int(agg.get("max_streak") or 0), run)
    return agg

def compact_history(history, agg=None, keep=None):
    """Fold older closed trades into hist_agg; keep the last `keep` in detail."""
    keep = HISTORY_KEEP if keep is None else keep
    agg = merge_hist_agg(agg)
    history = list(history or [])
    if len(history) <= keep:
        return history, agg
    history = sorted(history, key=lambda h: h.get("closed") or 0)
    old, rest = history[:-keep], history[-keep:]
    for h in old:
        apply_trade_to_agg(agg, h)
    # drop hour buckets older than ~200 days to keep the file small
    cut = time.time() - 200 * 86400
    hours = agg.get("hours") or {}
    agg["hours"] = {k: v for k, v in hours.items() if hour_ts(k) >= cut}
    return rest, agg

def streak_levels_from(ends, current=0, include_current=True):
    """Count each losing streak at every level it reached (2..N).
    A streak of 6 is one each of 2, 3, 4, 5 and 6 SL (1 SL is not shown).
    8+ is a single bucket (a 9-SL run adds 8+ once, not twice). The running
    streak is included the same way when include_current is True."""
    lv = {}
    def add(n):
        n = int(n or 0)
        if n < 2: return
        for i in range(2, n + 1):
            k = "8+" if i >= 8 else str(i)
            if k == "8+" and i > 8: continue   # 8,9,10… all live in one 8+ count
            lv[k] = lv.get(k, 0) + 1
    for item in ends or []:
        add(item[1] if isinstance(item, (list, tuple)) else item)
    if include_current:
        add(current)
    return lv

def format_streak_level_lines(lv, title="🧱 SL streak levels:"):
    """Show every level from 2 up to the max that was reached (8+ if needed).
    Intermediate 0× lines are included only when they sit below the max."""
    lv = lv or {}
    if lv.get("8+"):
        keys = list(STREAK_LEVEL_KEYS)
    else:
        mx = max((int(k) for k in lv if str(k).isdigit() and lv[k]), default=0)
        keys = [k for k in STREAK_LEVEL_KEYS if k.isdigit() and int(k) <= mx]
    rows = [f"   ⚠️ {k} SL: {lv.get(k, 0)}×" for k in keys]
    return ([title] + rows) if rows else [f"{title} —"]

def replay_streaks(agg, hist):
    """All streak-end events from aggregates plus detailed history, and the open run after the last trade."""
    ends = [list(x) for x in (agg.get("streak_ends") or [])]
    run = int(agg.get("streak_open") or 0)
    mx = int(agg.get("max_streak") or 0)
    for h in sorted(hist or [], key=lambda x: x.get("closed") or 0):
        if is_sys_trade(h): continue
        if is_win_trade(h):
            if run:
                ends.append([h["closed"], run]); mx = max(mx, run)
            run = 0
        else:
            run += 1; mx = max(mx, run)
    return ends, run, mx

def _row_as_trade(row):
    closed, net, pips, lot, code = row[:5]
    reason = {2: "FORCE", 1: "TP", 0: "SL"}[int(code)]
    return dict(closed=closed, net=net, pips=pips, lot=lot, reason=reason, sys=(int(code) == 2))

def period_closed_trades(agg, hist, t0, t1):
    """Closed trades in [t0, t1] — the exact set period_bundle aggregates (hist_agg rows + history)."""
    agg = merge_hist_agg(agg)
    hist = list(hist or [])
    seen, trades = set(), []
    for row in agg.get("rows") or []:
        ts = row[0]
        if t0 <= ts <= t1:
            trades.append(_row_as_trade(row)); seen.add(round(ts, 3))
    for h in hist:
        ts = h.get("closed") or 0
        if t0 <= ts <= t1 and round(float(ts), 3) not in seen:
            trades.append(h)
    return trades

def period_bundle(agg, hist, t0, t1):
    """Stats for [t0, t1] from compact rows + detailed trades (exact window, no hour-alignment issue)."""
    agg = merge_hist_agg(agg)
    hist = list(hist or [])
    out = empty_day(); day_net = {}
    trades = period_closed_trades(agg, hist, t0, t1)
    for h in trades:
        out = bucket_add(out, h)
        day = datetime.fromtimestamp(h["closed"], IST).date().isoformat()
        day_net[day] = round(day_net.get(day, 0) + float(h.get("net") or 0), 2)
    ends, run, mx = replay_streaks(agg, hist)
    ends_p = [e for e in ends if t0 <= e[0] <= t1]
    last_close = max([e[0] for e in ends] + [h.get("closed") or 0 for h in hist] + [agg.get("upto") or 0], default=0)
    include_run = bool(run and t1 >= min(time.time(), last_close) - 1)
    lv = streak_levels_from(ends_p, run if include_run else 0, include_current=include_run)
    n = out["win_n"] + out["loss_n"]
    aw = (out["win_pnl"] / out["win_n"]) if out["win_n"] else 0.0
    al = (-out["loss_pnl"] / out["loss_n"]) if out["loss_n"] else 0.0
    gw, gl = out["win_pnl"], -out["loss_pnl"]
    pf = (gw / gl) if gl else (float("inf") if gw else 0.0)
    wr = (out["win_n"] / n * 100) if n else 0.0
    be = (al / (aw + al) * 100) if (aw + al) else 0.0
    best_day = max(day_net, key=day_net.get) if day_net else None
    worst_day = min(day_net, key=day_net.get) if day_net else None
    return dict(bucket=out, winrate=wr, be_winrate=be, avg_win=aw, avg_loss=al, pf=pf,
                expectancy=(out["net"] / out["trades"] if out["trades"] else 0.0),
                exp_lot=(out["net"] / out["volume"] if out["volume"] else 0.0),
                gross=round(out["net"] + out["spread"], 2),
                levels=lv, max_streak=max([e[1] for e in ends_p] + ([run] if include_run else [0]), default=0),
                day_net=day_net, best_day=best_day, worst_day=worst_day, trades=trades)

def _norm_report_row(h, open_=False):
    """One period record for the PnL image (and the shared report_dataset)."""
    if open_:
        return dict(
            id=str(h.get("id") or ""),
            direction=h.get("dir") or h.get("direction") or "",
            reason="RUNNING", pips=None, net=None,
            lot=float(h.get("lot") or 0), entry=h.get("entry"),
            opened=float(h.get("opened") or 0), closed=0.0, duration=None,
            running=True, sys=False, compact=False,
        )
    opened = float(h.get("opened") or 0)
    closed = float(h.get("closed") or 0)
    dur = (closed - opened) if opened and closed else None
    reason = h.get("reason") or ("FORCE" if h.get("sys") else "")
    return dict(
        id=str(h.get("id") or ""),
        direction=h.get("dir") or h.get("direction") or "",
        reason=reason,
        pips=float(h.get("pips") or 0), net=float(h.get("net") or 0),
        lot=float(h.get("lot") or 0), entry=h.get("entry"),
        opened=opened, closed=closed, duration=dur,
        running=False, sys=bool(h.get("sys") or reason == "FORCE"),
        compact=not bool(h.get("id") or h.get("opened")),
    )


def report_dataset(s, start, end, open_trade=None, unrealised=0.0):
    """Single source for a period report: the same window, trade set and totals
    used by both the text summary and the PnL image.

    Closed set = period_bundle / period_closed_trades (hist_agg + history, close in [t0, t1]).
    A still-open trade is included only when it opened at/after the window start
    (same `inwin` rule as summary(): its float is added to Net, its lot to volume).
    Totals: tp/sl/force/pips = bucket; wr = tp/(tp+sl); net = realised + in-window unrealised;
    total signals = closed trades + in-window open.
    """
    t0, t1 = start.timestamp(), end.timestamp()
    bun = period_bundle(s.get("hist_agg"), s.get("history") or [], t0, t1)
    b = bun["bucket"]
    tp, sl, sysn = b["tp"], b["sl"], b["force"]
    pips, real = b["pips"], b["net"]
    ot = open_trade
    inwin = bool(ot and float(ot.get("opened") or 0) >= t0)
    unr = float(unrealised or 0.0) if inwin else 0.0
    net = round(real + unr, 2)
    wr = (tp / (tp + sl) * 100) if (tp + sl) else 0.0
    vol = b["volume"]
    if inwin:
        vol = round(vol + float(ot.get("lot") or 0), 4)
    rows = [_norm_report_row(h, open_=False) for h in (bun.get("trades") or [])]
    if inwin:
        rows.append(_norm_report_row(ot, open_=True))
    rows.sort(key=lambda r: (r["opened"] or r["closed"] or 0, r["id"] or ""))
    totals = dict(total=len(rows), tp=tp, sl=sl, force=sysn, run=(1 if inwin else 0),
                  pips=pips, real=real, unr=unr, net=net, wr=wr, volume=vol)
    return dict(start=start, end=end, rows=rows, totals=totals, bun=bun, inwin=inwin)


def _render_report_dataset(ds, period):
    """Load report_card even when the bot file is imported by path (tests)."""
    try:
        from report_card import render_from_dataset
        return render_from_dataset(ds, period=period)
    except ImportError:
        import importlib.util
        path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "report_card.py")
        spec = importlib.util.spec_from_file_location("report_card", path)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod.render_from_dataset(ds, period=period)


def fmt_streak_block(lv, heading="🧱 SL streak levels:"):
    return format_streak_level_lines(lv, heading)

def economic_net(equity, start_balance, wipes, wipe_amt=None):
    """Net vs start, accounting for each wipe-reset of WIPE_BALANCE added back."""
    wipe_amt = WIPE_BALANCE if wipe_amt is None else wipe_amt
    injected = float(start_balance) + int(wipes or 0) * float(wipe_amt)
    net = round(float(equity) - injected, 2)
    pct = (net / injected * 100) if injected else 0.0
    return net, injected, pct

def cleanup_temp_charts(base=None):
    removed = 0
    root = base or BASE_DIR
    for folder in (os.path.join(root, "charts"), os.path.join(root, "tmp")):
        if not os.path.isdir(folder): continue
        for name in os.listdir(folder):
            if name.lower().endswith(".png"):
                try: os.remove(os.path.join(folder, name)); removed += 1
                except Exception: pass
    return removed

def rotate_bot_logs(path=None, max_bytes=5_000_000, backups=2):
    """Keep the bot log under max_bytes and at most `backups` rotated files."""
    path = path or LOG_FILE
    notes = []
    try:
        if os.path.exists(path) and os.path.getsize(path) > max_bytes:
            for i in range(backups, 0, -1):
                src = path if i == 1 else f"{path}.{i-1}"
                dst = f"{path}.{i}"
                if os.path.exists(src):
                    try:
                        if os.path.exists(dst): os.remove(dst)
                        os.replace(src, dst)
                    except Exception as e:
                        notes.append(str(e))
            open(path, "a").close()
            notes.append("rotated")
        # drop extra backups beyond the keep count
        i = backups + 1
        while os.path.exists(f"{path}.{i}"):
            try: os.remove(f"{path}.{i}"); notes.append(f"dropped .{i}")
            except Exception: pass
            i += 1
    except Exception as e:
        notes.append(str(e))
    return notes

def weekend_key(now_utc):

    """Key of the current weekend (date of its Friday), or None if not weekend."""
    if not is_weekend(now_utc): return None
    return (now_utc.date() - timedelta(days=(now_utc.weekday() - 4) % 7)).isoformat()

def _hm(x):
    h, m = x.split(":"); return int(h) * 60 + int(m)

def session_at(now_utc):
    """(name, start_dt, end_dt) of the session active at now_utc, or None (no-session window / weekend)."""
    if is_weekend(now_utc): return None
    mins = now_utc.hour * 60 + now_utc.minute; day = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
    for name, a, b in SESSIONS:
        if _hm(a) <= mins < _hm(b):
            return name, day + timedelta(minutes=_hm(a)), day + timedelta(minutes=_hm(b))
    return None

def session_key(now_utc):
    ss = session_at(now_utc)
    return f"{now_utc.date().isoformat()}|{ss[0]}" if ss else None

def next_session(now_utc):
    """(name, start_dt) of the next session start strictly after now_utc (weekend skipped)."""
    day = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
    for dd in range(0, 9):
        for name, a, _ in SESSIONS:
            st = day + timedelta(days=dd, minutes=_hm(a))
            if st > now_utc and not is_weekend(st): return name, st
    return None

def swap_estimate(direction, lot, now_utc):
    per = SWAP_PER_001_LOT_LONG if direction == "BUY" else SWAP_PER_001_LOT_SHORT
    return round(per * lot / 0.01 * (3 if now_utc.weekday() == SWAP_TRIPLE_WEEKDAY else 1), 2)

def dur_stats(hist):
    """Average trade duration / time-to-TP / time-to-SL as text."""
    f = lambda xs: fmt_hm(sum(xs) / len(xs)) if xs else "—"
    d = [h["closed"] - h["opened"] for h in hist if h.get("opened")]
    return dict(n=len(d), avg=f(d), tp=f([h["closed"] - h["opened"] for h in hist if h.get("opened") and h["reason"] == "TP"]),
                sl=f([h["closed"] - h["opened"] for h in hist if h.get("opened") and h["reason"] == "SL"]))

def fmt_hm(sec):
    sec = int(max(0, sec)); h, m = sec // 3600, sec % 3600 // 60
    return f"{h}h {m}m" if h else f"{m}m"

def level_pips(trade):
    """Exact pips from actual entry/TP/SL prices — single source for message AND chart."""
    tp = abs(pips_between(trade["direction"], trade["entry"], trade["tp"]))
    sl = abs(pips_between(trade["direction"], trade["entry"], trade["sl"]))
    return tp, sl

def fmt_pips(p):
    return f"{p:g}" if float(p).is_integer() else f"{p:.1f}"

def close_pips_text(pips):
    """Signed pips text — identical in close message and close chart."""
    return f"{'+' if pips >= 0 else '-'}{fmt_pips(abs(pips))}"

def chart_level_label(kind, pips):
    """Right-edge TP/SL label: pips only (no %). kind is 'tp' or 'sl'."""
    if kind == "tp":
        return f"Target (+{fmt_pips(pips)} pips)"
    return f"Stop Loss (−{fmt_pips(pips)} pips)"

def chart_title(tf):
    """Chart header, broker-style: XAUUSD · 1m · Vantage (also 5m / 15m)."""
    return f"{PAIR}  ·  {tf}m  ·  Vantage"

def fmt_p(x): return f"{x:,.3f}"   # exact broker quote precision (3 decimals)
def fmt_money(x, bold=True):
    s = f"{'+' if x >= 0 else '-'}${abs(x):,.2f}"
    return f"<b>{s}</b>" if bold else s
def fmt_lot(l): return f"{qlot(l):.2f}"
def fmt_period(sec):
    sec = int(max(0, sec)); h, r = divmod(sec, 3600); m, s = divmod(r, 60)
    return f"{h} hr {m} min" if h else (f"{m} min {s} sec" if m else f"{s} sec")
def fmt_dur(sec):
    sec = int(max(0, sec)); h, r = divmod(sec, 3600); m, s = divmod(r, 60)
    return f"{h}h {m}m {s}s" if h else f"{m}m {s}s"


def normalize_chart_theme(v, default=CHART_THEME_DEFAULT):
    if isinstance(v, str):
        v = v.strip().lower()
        if v in ("white", "lt", "default"): v = "light"
        if v in ("black", "dk"): v = "dark"
    return v if v in CHART_THEMES else default

def normalize_chart_measure(v, default=CHART_MEASURE_DEFAULT):
    if isinstance(v, str): v = v.strip().lower()
    return v if v in CHART_MEASURES else default

def normalize_chart_wm(v, default=CHART_WM_DEFAULT):
    if v is None: return bool(default)
    return bool(v)

def chart_settings(state=None):
    """Per-channel chart options with safe defaults (light / 1m / box / no watermark / ON)."""
    s = state or {}
    return {
        "on": s.get("chart_on", True) if isinstance(s.get("chart_on"), bool) else True,
        "tf": normalize_chart_tf(s.get("chart_tf")),
        "theme": normalize_chart_theme(s.get("chart_theme")),
        "measure": normalize_chart_measure(s.get("chart_measure")),
        "wm": normalize_chart_wm(s.get("chart_wm")),
    }

def apply_chart_defaults(state):
    """Fill / clamp chart settings on a state dict (source or per-channel section)."""
    if not isinstance(state.get("chart_on"), bool): state["chart_on"] = True
    state["chart_tf"] = normalize_chart_tf(state.get("chart_tf"))
    state["chart_theme"] = normalize_chart_theme(state.get("chart_theme"))
    state["chart_measure"] = normalize_chart_measure(state.get("chart_measure"))
    state["chart_wm"] = normalize_chart_wm(state.get("chart_wm"))
    return state

def normalize_chart_tf(v, default=CHART_TF_DEFAULT):
    """Return 1, 5 or 15; anything else falls back to the default (1m)."""
    try: v = int(v)
    except (TypeError, ValueError): return default
    return v if v in CHART_TFS else default

def candle_remaining(ts, tf_min):
    """Seconds left until the current tf candle closes at time ts."""
    step = max(1, int(tf_min)) * 60
    k = int(ts // step) * step
    return max(0, int(k + step - ts))

def fmt_countdown(sec):
    sec = int(max(0, sec)); return f"{sec // 60:02d}:{sec % 60:02d}"

def aggregate_ohlc(rows, tf_min):
    """Fold 1-minute OHLC rows into tf_min candles. rows = [t, o, h, l, c]."""
    if not rows: return []
    tf_min = int(tf_min or 1)
    if tf_min <= 1: return [list(r) for r in rows]
    step = tf_min * 60; out = []
    for t, o, h, l, c in rows:
        k = int(t // step) * step
        if out and out[-1][0] == k:
            r = out[-1]; r[2] = max(r[2], h); r[3] = min(r[3], l); r[4] = c
        else:
            out.append([k, o, h, l, c])
    return out

def effective_chart_tf(user_tf, trade=None, now=None, close=None):
    """User setting, stepped up for long trades: >3h -> at least 5m, >5h -> 15m."""
    tf = normalize_chart_tf(user_tf)
    if not trade: return tf
    now = (close or {}).get("ts") if close and (close or {}).get("ts") else (time.time() if now is None else now)
    opened = trade.get("opened")
    opened = now if opened is None else opened
    age_h = (float(now) - float(opened)) / 3600.0
    if age_h > 5: return max(tf, 15)
    if age_h > 3: return max(tf, 5)
    return tf

def chart_window(cs, entry_ts=None, visible=None, pad=4, max_bars=None):
    """Last `visible` bars, expanded left so the entry candle stays on screen."""
    visible = CHART_CANDLES if visible is None else visible
    max_bars = CHART_CANDLES_MAX if max_bars is None else max_bars
    if not cs: return cs
    start = max(0, len(cs) - visible)
    if entry_ts is not None:
        ei = 0
        for i, c in enumerate(cs):
            if c[0] <= entry_ts: ei = i
        start = min(start, max(0, ei - pad))
    out = cs[start:]
    if len(out) > max_bars:
        # keep the entry at the left and as much of the right side as fits
        ei = 0
        if entry_ts is not None:
            for i, c in enumerate(out):
                if c[0] <= entry_ts: ei = i
        left = out[max(0, ei - pad): max(0, ei - pad) + 1]
        right = out[-(max_bars - len(left)):]
        out = left + [c for c in right if not left or c[0] > left[-1][0]]
    return out

def fit_chart_tf(user_tf, trade, rows_1m, now=None, close=None):
    """effective_chart_tf, then bump 1m->5m->15m if the entry would still fall off the window."""
    tf = effective_chart_tf(user_tf, trade, now, close)
    if not trade or not rows_1m: return tf
    ek = entry_candle(trade) if trade else None
    for cand in CHART_TFS:
        if cand < tf: continue
        w = chart_window(aggregate_ohlc(rows_1m, cand), ek)
        if w and w[0][0] <= ek <= w[-1][0]: return cand
    return 15

def format_tp_close(sid, price, live, pips_txt, money_txt, period):
    """TP-hit channel message: ID line on top, no trailing ID."""
    return (f"🆔 <b>#{sid}</b> Targets achieved 🤑\n"
            f"🎯 <b>Target price:</b> <code>{fmt_p(price)}</code>\n"
            f"📈 <b>Live price:</b> <code>{fmt_p(live)}</code>\n"
            f"🤑 <b>PROFIT:</b> {pips_txt} Pips • {money_txt}\n"
            f"⏰ <b>Period:</b> {period}")

# ================= STATE =================
def default_state(cfg=None):
    sb = (cfg or {}).get("start_balance", START_BALANCE); bl = (cfg or {}).get("base_lot", BASE_LOT)
    return {
        "seq": 0, "lot": bl, "streak": 0, "max_streak": 0,
        "open": None, "next_signal_at": 0, "tg_offset": 0, "channels": {},
        "acct": {"balance": sb, "realised": 0.0, "peak": sb,
                 "max_dd": 0.0, "max_dd_pct": 0.0, "wins": 0, "losses": 0,
                 "volume": 0.0, "spread_paid": 0.0, "wipes": 0},
        "history": [], "chart": {"date": "", "usage": {}, "dead": {}},
        "sent": {}, "alerted_streak": 0, "created": time.time(),
        "posted": {}, "pending_close": None, "armed": False, "armed_at": None, "chart_on": True, "chart_tf": CHART_TF_DEFAULT, "chart_theme": CHART_THEME_DEFAULT, "chart_measure": CHART_MEASURE_DEFAULT, "chart_wm": CHART_WM_DEFAULT,
        "cycle": {"start": time.time(), "start_balance": sb, "trades": 0, "peak": sb, "max_dd": 0.0},
        "signals": 0, "entries": 0, "tp": 0, "sl": 0, "forced": 0, "skipped": 0, "skip_keys": [],
        "sess_cur": None, "sess_count": {}, "sess_stats": {"date": "", "rows": {}}, "swap_alerted": "", "pips_total": 0.0,
        "kb_ver": {}, "tp_range": list(TP_RANGE), "sl_range": list(SL_RANGE), "last_sess": None,
        "hist_agg": empty_hist_agg(),
        "milestones": {"msg": {}, "snapshots": {}, "wipes": [], "sent": {}},
        "last_housekeep": 0, "dm_users": [], "start_balance": sb,
    }

class Store:
    def __init__(self, path=STATE_FILE):
        self.path, self.lock = path, threading.RLock()
        self.s = default_state(); self.fresh = not os.path.exists(path)
        for cand in [path] + [f"{path}.bak{i}" for i in range(1, self.BACKUPS + 1)]:
            if not os.path.exists(cand): continue
            try:
                with open(cand) as f: loaded = json.load(f)
                if not isinstance(loaded, dict) or "acct" not in loaded: raise ValueError("not a state file")
                base = default_state(); base.update(loaded)
                base["acct"] = {**default_state()["acct"], **loaded.get("acct", {})}
                apply_chart_defaults(base)
                base["hist_agg"] = merge_hist_agg(base.get("hist_agg"))
                ms = base.get("milestones") if isinstance(base.get("milestones"), dict) else {}
                base["milestones"] = {"msg": dict(ms.get("msg") or {}), "snapshots": dict(ms.get("snapshots") or {}),
                                      "wipes": list(ms.get("wipes") or []), "sent": dict(ms.get("sent") or {})}
                a = base["acct"]; a["lifetime_peak"] = max(float(a.get("lifetime_peak") or 0), float(a.get("peak") or 0), float(a.get("balance") or 0))
                self.s = base; self.fresh = False
                if cand != path:
                    log.error("state file corrupt -> restored from %s", cand)
                    try: os.replace(path, path + ".corrupt")
                    except Exception: pass
                    self.save()
                break
            except Exception:
                log.exception("state load failed for %s", cand)
    BACKUPS = 5
    def backup(self, every=300):
        """Rotate last-good copies: state.json.bak1 (newest) .. bak5."""
        if time.time() - getattr(self, "_last_bak", 0) < every or not os.path.exists(self.path): return
        with self.lock:
            try:
                with open(self.path) as f: json.load(f)            # only back up a valid file
                for i in range(self.BACKUPS - 1, 0, -1):
                    if os.path.exists(f"{self.path}.bak{i}"): os.replace(f"{self.path}.bak{i}", f"{self.path}.bak{i + 1}")
                import shutil; shutil.copy2(self.path, f"{self.path}.bak1"); self._last_bak = time.time()
            except Exception:
                log.exception("backup failed")
    def save(self):
        with self.lock:
            tmp = self.path + ".tmp"
            for _ in range(3):                    # serialise first (a concurrent dict change can't leave a half file)
                try: data = json.dumps(self.s, indent=1); break
                except RuntimeError: time.sleep(0.01)
            else: log.error("state save skipped (busy)"); return
            with open(tmp, "w") as f: f.write(data); f.flush(); os.fsync(f.fileno())
            os.replace(tmp, self.path)

# ================= PRICE =================
class Price:
    def __init__(self):
        self.bid = self.ask = None; self.ts = 0; self.lock = threading.Lock()
        self.sess = requests.Session()
    def fetch(self):
        r = self.sess.get(PRICE_URL, timeout=(1.5, 2.0)); r.raise_for_status(); j = r.json()   # short timeout: never stalls the loop
        bid, ask = float(j["bid"]), float(j["ask"])
        if bid <= 0 or ask <= 0 or ask < bid: raise ValueError(f"bad quote {j}")
        if j.get("stale"): raise ValueError("stale quote")
        with self.lock:
            self.bid, self.ask, self.ts = bid, ask, time.time(); e = getattr(self, "ext", None)
            cd = getattr(self, "candles", None)
            if e is None: self.ext = dict(min_bid=bid, max_bid=bid, min_ask=ask, max_ask=ask)
            else:
                e["min_bid"] = min(e["min_bid"], bid); e["max_bid"] = max(e["max_bid"], bid)
                e["min_ask"] = min(e["min_ask"], ask); e["max_ask"] = max(e["max_ask"], ask)
        if cd is not None:
            try: cd.add(bid)
            except Exception: log.debug("candle add failed")
        return bid, ask
    def take_extremes(self):
        """Extreme bid/ask since the previous call (reset to the latest quote)."""
        with self.lock:
            e = getattr(self, "ext", None)
            self.ext = dict(min_bid=self.bid, max_bid=self.bid, min_ask=self.ask, max_ask=self.ask) if self.bid else None
            return e
    def get(self, max_age=10):
        with self.lock:
            if self.bid and time.time() - self.ts <= max_age: return self.bid, self.ask
            if market_closed():       # market closed: never hit the feed; last known quote for display
                return (self.bid, self.ask) if self.bid else None
        try: return self.fetch()
        except Exception as e:
            self.warn(e); return None
    def warn(self, e):
        """Log a fetch failure at most once a minute per message (the stale flag used to log 5x per second)."""
        k = str(e)[:60]; w = getattr(self, "_warned", None)
        if w is None: w = self._warned = {}
        if time.time() - w.get(k, 0) >= 60:
            w[k] = time.time(); log.warning("price fetch fail: %s", e)
    def rate(self):
        """Measured quote fetches per second over the last ~10 s (health / tests)."""
        ts = list(getattr(self, "ticks", []))
        return round((len(ts) - 1) / (ts[-1] - ts[0]), 2) if len(ts) > 2 and ts[-1] > ts[0] else 0.0
    def loop(self, stop):
        from collections import deque
        self.ticks = deque(maxlen=60); self.beat = time.time()
        while not stop.is_set():
            t0 = time.time(); self.beat = t0
            if market_closed():
                if not getattr(self, "closed", False):
                    self.closed = True; log.info("market closed -> price feed paused (reopens %s)", market_reopen())
                stop.wait(MARKET_CLOSED_POLL_SEC); continue
            if getattr(self, "closed", False):
                self.closed = False; log.info("market open -> price feed resumed")
            try:
                self.fetch(); self.ticks.append(time.time())
                self.backoff = POLL_SEC
            except requests.HTTPError as e:
                code = e.response.status_code if e.response is not None else 0
                self.backoff = min(10, max(1, getattr(self, "backoff", 0.25) * 2)) if code == 429 else 1
                log.debug("poll http %s", code)
            except Exception as e:
                self.backoff = 1; log.debug("poll err %s", e)
            stop.wait(max(0, POLL_SEC - (time.time() - t0)) if getattr(self, "backoff", 0.25) <= POLL_SEC else self.backoff)

# ================= TELEGRAM =================
class TG:
    def __init__(self):
        self.sess = requests.Session(); self._tl = threading.local()
    @property
    def ambiguous(self): return getattr(self._tl, "amb", False)      # per thread: another thread's timeout never leaks in
    @ambiguous.setter
    def ambiguous(self, v): self._tl.amb = v
    def call(self, method, data=None, files=None, tries=5, timeout=40):
        if DRY_RUN:   # no network to Telegram; pretend success
            if method == "getUpdates": time.sleep(2); return []
            log.info("[DRY] %s -> %s", method, str((data or {}).get("text") or (data or {}).get("caption") or "")[:60].replace("\n", " | "))
            self._dry = getattr(self, "_dry", 1000) + 1
            return {"message_id": self._dry}
        for i in range(tries):
            try:
                r = self.sess.post(API + method, data=data, files=files, timeout=timeout)
                try: j = r.json()
                except ValueError:                       # HTML / empty body from a proxy or 5xx -> not delivered
                    log.warning("TG %s non-JSON reply %s (try %d)", method, r.status_code, i + 1); time.sleep(2 * (i + 1)); continue
                if j.get("ok"): return j["result"]
                if r.status_code == 429:
                    w = j.get("parameters", {}).get("retry_after", 5)
                    log.warning("flood wait %ss on %s", w, method); time.sleep(w + 1); continue
                if r.status_code >= 500: time.sleep(2 * (i + 1)); continue
                if "message is not modified" in str(j.get("description", "")): return True
                if method == "answerCallbackQuery": return None
                if data and method in ("sendMessage", "sendPhoto", "sendSticker", "editMessageText"):
                    Health.chat_err[data.get("chat_id")] = f"{datetime.now(IST):%d %b %H:%M} {method}: {str(j.get('description'))[:80]}"
                log.error("TG %s error: %s", method, j)
                if method != "getUpdates": Health.failed_posts += 1
                # retry without reply if replied message missing
                if data and "reply_to_message_id" in data and "not found" in str(j.get("description", "")):
                    data = dict(data); data.pop("reply_to_message_id"); continue
                if r.status_code == 403 and data and method != "getUpdates":   # blocked / kicked: stop spamming that chat
                    log.error("TG 403 for chat %s: %s", data.get("chat_id"), j.get("description"))
                return None
            except requests.exceptions.ConnectionError as e:   # not delivered -> safe to retry
                log.warning("TG %s conn err %s (try %d)", method, e, i + 1); time.sleep(2 * (i + 1))
            except Exception as e:   # timeout etc: may have been delivered -> never resend posts
                log.warning("TG %s ambiguous err %s", method, e)
                if method in ("sendMessage", "sendPhoto", "sendMediaGroup"): self.ambiguous = True; return None
                time.sleep(2 * (i + 1))
        return None
    def send(self, chat, text, reply_to=None, markup=None):
        if chat in Health.unreachable: return None
        d = {"chat_id": chat, "text": text, "parse_mode": "HTML", "disable_web_page_preview": "true"}
        if reply_to: d["reply_to_message_id"] = reply_to; d["allow_sending_without_reply"] = "true"
        if markup: d["reply_markup"] = json.dumps(markup)
        return self.call("sendMessage", d)
    def sticker(self, chat, file_id, reply_to=None):
        d = {"chat_id": chat, "sticker": file_id}
        if reply_to: d["reply_to_message_id"] = reply_to; d["allow_sending_without_reply"] = "true"
        return self.call("sendSticker", d, tries=3)
    def edit(self, chat, msg_id, text, markup=None):
        d = {"chat_id": chat, "message_id": msg_id, "text": text, "parse_mode": "HTML", "disable_web_page_preview": "true"}
        if markup: d["reply_markup"] = json.dumps(markup)
        return self.call("editMessageText", d, tries=2)
    def answer(self, cq_id, text=None):
        d = {"callback_query_id": cq_id}
        if text: d["text"] = text
        return self.call("answerCallbackQuery", d, tries=1)
    def photo(self, chat, img, caption="", markup=None, reply_to=None):
        """img = PNG bytes, or a Telegram file_id (str) to resend the SAME image without re-uploading."""
        d = {"chat_id": chat}
        if caption:
            d["caption"] = caption[:1024]; d["parse_mode"] = "HTML"
        if reply_to: d["reply_to_message_id"] = reply_to; d["allow_sending_without_reply"] = "true"
        if markup: d["reply_markup"] = json.dumps(markup)
        if isinstance(img, str): d["photo"] = img; return self.call("sendPhoto", d, tries=3)
        return self.call("sendPhoto", d, files={"photo": ("chart.png", img, "image/png")}, tries=3)
    def media_group(self, chat, images, reply_to=None):
        """Send one or more PNG byte-strings as a photo (album if 2+). Returns the list of sent messages (or None)."""
        images = [b for b in (images or []) if b]
        if not images: return None
        if len(images) == 1:
            m = self.photo(chat, images[0], reply_to=reply_to)
            return [m] if isinstance(m, dict) else None
        media, files = [], {}
        for i, img in enumerate(images):
            name = f"p{i}.png"
            media.append({"type": "photo", "media": f"attach://{name}"})
            files[name] = (name, img, "image/png")
        d = {"chat_id": chat, "media": json.dumps(media)}
        if reply_to: d["reply_to_message_id"] = reply_to; d["allow_sending_without_reply"] = "true"
        r = self.call("sendMediaGroup", d, files=files, tries=3, timeout=60)
        return r if isinstance(r, list) and r else None
    @staticmethod
    def file_id(m):
        try: return m["photo"][-1]["file_id"]
        except Exception: return None

TV_BTN = {"inline_keyboard": [[{"text": TV_LABEL, "url": TV_URL}]]}
KB_VER = 3   # bump when the reply keyboard layout changes -> re-sent once to each admin
ADMIN_KB = {"keyboard": [
    [{"text": "📊 Dashboard"}, {"text": "📡 Force Signal"}],
    [{"text": "📂 Open Trades"}, {"text": "⚙️ Menu"}],
    [{"text": "🧠 Decision API"}]], "resize_keyboard": True, "is_persistent": True}

def admin_kb(chart_on=True):
    """The 4-button reply keyboard (chart toggle lives in the inline menu)."""
    return ADMIN_KB

def _b(text, data): return {"text": text, "callback_data": data}
def menu_ikb(chart_on=True, chart_tf=CHART_TF_DEFAULT):
    return {"inline_keyboard": [
        [_b("📊 Stats", "stats"), _b("🌐 Sessions", "sess")],
        [_b("📅 Daily", "sum:daily"), _b("📅 Weekly", "sum:weekly")],
        [_b("📅 Monthly", "sum:monthly"), _b("🏆 All Time", "sum:alltime")],
        [_b("🖼 Chart settings", "cs")],
        [_b("📘 Help", "help"), _b("🎯 Range TP/SL", "range")],
        [_b("♻️ Reset", "reset"), _b("ℹ️ Guide", "guide")], [_b("🩺 Health", "health"), _b("🔄 Refresh", "dash")]]
        + ([[_b(f"📢 {c['key']}", f"c:{c['key']}:view") for c in CHANNELS]] if CHANNELS else [])
        + [[_b("🧠 Decision API", "dec")], [_b("💎 Channel view", "c:SRC:view"), _b("📈 Streaks", "stk:alltime")]]}
DEC_IKB = {"inline_keyboard": [[_b("🧪 Test decision now", "dec:test")], [_b("🔄 Refresh", "dec"), _b("⬅️ Back", "back")]]}
def tf_ikb(chart_tf=CHART_TF_DEFAULT, key=None):
    """Legacy 1m/5m/15m picker (also reused inside per-channel chart settings)."""
    cur = normalize_chart_tf(chart_tf)
    def lab(n): return (("✅ " if n == cur else "") + f"{n}m")
    prefix = f"cs:{key}:tf:" if key else "tf:"
    back = f"cs:{key}" if key else "back"
    return {"inline_keyboard": [[_b(lab(n), f"{prefix}{n}") for n in CHART_TFS], [_b("⬅️ Back", back)]]}
def tf_text(chart_tf=CHART_TF_DEFAULT):
    cur = normalize_chart_tf(chart_tf)
    return "\n".join([
        "🕯 <b>CHART TIMEFRAME</b>", SEP_,
        f"Current: <b>{cur}m</b>  (default 1m).",
        "Signal charts use this setting. If a trade has been open more than 3 hours the close chart steps up to at least 5m, and after 5 hours to 15m, so the BUY/SELL entry stays visible.",
        "", "Pick 1m, 5m or 15m:"])
def cs_pick_ikb():
    rows = [[_b("💎 Decision AI channel", "cs:SRC")]]
    return {"inline_keyboard": rows + [[_b("⬅️ Back", "back")]]}
def cs_pick_text():
    return "\n".join(["🖼 <b>CHART SETTINGS</b>", SEP_,
                       "Each channel has its own theme, timeframe, style and on/off switch.",
                       "Default is Light · 1m · Box · watermark off.",
                       "", "Pick a channel:"])
def cs_text(ch):
    s = chart_settings(ch.st.s)
    link = ch.channel_link() or ch.chan_link()
    return "\n".join([
        "🖼 <b>CHART SETTINGS</b>", SEP_,
        f"{'💎' if ch.key == 'SRC' else '📡'} <b>{html.escape(ch.cname)}</b>  ({ch.key})",
        f"🆔 <code>{ch.cid}</code>",
        f"🔗 {link}",
        "",
        f"🖼 <b>Chart:</b> {'ON ✅' if s['on'] else 'OFF ⛔'}",
        f"🎨 <b>Theme:</b> {s['theme'].title()}  (default Light)",
        f"🕯 <b>Timeframe:</b> {s['tf']}m  (default 1m)",
        f"📏 <b>Style:</b> {s['measure'].title()}  (default Box)",
        f"🖋 <b>Watermark:</b> {'ON' if s['wm'] else 'OFF'}  (default {'on' if ch.cfg.get('wm_on') else 'off'})" + (f" · {html.escape(ch.wm)}" if ch.cfg.get("wm_on") else ""),
        "",
        "Signal charts use this channel's settings. Close charts of a long trade still auto-step to 5m (>3 h) or 15m (>5 h) so the BUY/SELL entry stays visible.",
    ])
def cs_ikb(key, sett):
    on, th, tf, ms, wm = sett["on"], sett["theme"], sett["tf"], sett["measure"], sett["wm"]
    p = f"cs:{key}:"
    def mark(ok, label): return (("✅ " if ok else "") + label)
    return {"inline_keyboard": [
        [_b("🖼 Chart: ON" if on else "🖼 Chart: OFF", p + "on")],
        [_b(mark(th == "light", "🎨 Light"), p + "theme:light"), _b(mark(th == "dark", "🎨 Dark"), p + "theme:dark")],
        [_b(mark(tf == n, f"{n}m"), p + f"tf:{n}") for n in CHART_TFS],
        [_b(mark(ms == "box", "📏 Box"), p + "meas:box"), _b(mark(ms == "lines", "📏 Lines"), p + "meas:lines")],
        [_b("🖋 Watermark: ON" if wm else "🖋 Watermark: OFF", p + "wm")],
        [_b("⬅️ Back", "cs")],
    ]}
BACK_IKB = {"inline_keyboard": [[_b("⬅️ Back", "back")]]}
SEP_ = "━━━━━━━━━━━━━━━━━━━━"
def chan_ikb(key, chart_on=True):
    p = f"c:{key}:"
    return {"inline_keyboard": [
        [_b("📊 Stats", p + "stats"), _b("📂 Open", p + "open")],
        [_b("📅 Daily", p + "sum:daily"), _b("📅 Weekly", p + "sum:weekly")],
        [_b("📅 Monthly", p + "sum:monthly"), _b("🏆 All Time", p + "sum:alltime")],
        [_b("📡 Force Signal", p + "force"), _b("💵 Balance", p + "bal")],
        [_b("📊 Reports", p + "rep"), _b("🖼 Chart settings", f"cs:{key}")],
        [_b("♻️ Reset", "reset"), _b("🔄 Refresh", p + "view")], [_b("⬅️ Back", "back")]]}
def chan_back(key): return {"inline_keyboard": [[_b("🔄 Refresh", f"c:{key}:view"), _b("⬅️ Back", f"c:{key}:view")]]}
def chan_sum_ikb(key, kind):
    rows = [[_b("📤 Post to channel", f"c:{key}:post:{kind}")]]
    if kind in ("daily", "weekly"):      # v10: monthly / all-time stay text-only in the bot
        rows.append([_b("🖼 Generate Summary Image", f"c:{key}:gen:{kind}")])
    rows.append([_b("⬅️ Back", f"c:{key}:view")])
    return {"inline_keyboard": rows}

def pnl_ikb(key, back="back"):
    p = f"c:{key}:" if key else ""
    b = f"c:{key}:view" if key else back
    return {"inline_keyboard": [
        [_b("📅 Daily", p + "img:daily"), _b("📅 Weekly", p + "img:weekly")],
        [_b("📅 Monthly", p + "img:monthly")],
        [_b("⬅️ Back", b)],
    ]}
def rep_ikb(key):
    p = f"c:{key}:"
    return {"inline_keyboard": [
        [_b("🖼 Daily image (preview)", p + "gen:daily"), _b("🖼 Weekly image (preview)", p + "gen:weekly")],
        [_b("📅 Daily", p + "sum:daily"), _b("📅 Weekly", p + "sum:weekly")],
        [_b("📅 Monthly", p + "sum:monthly"), _b("🏆 All Time", p + "sum:alltime")],
        [_b("🔄 Refresh", p + "rep"), _b("⬅️ Back", p + "view")]]}
STK_IKB = {"inline_keyboard": [[_b("📅 Daily", "stk:daily"), _b("📅 Weekly", "stk:weekly")],
                               [_b("📅 Monthly", "stk:monthly"), _b("🏆 All Time", "stk:alltime")], [_b("⬅️ Back", "back")]]}
def summary_ikb(kind):
    rows = [[_b("📤 Post to channel", f"post:{kind}")]]
    if kind in ("daily", "weekly"):      # v10: monthly / all-time stay text-only in the bot
        rows.append([_b("🖼 Generate Summary Image", f"c:SRC:gen:{kind}")])
    rows.append([_b("⬅️ Back", "back")])
    return {"inline_keyboard": rows}
STATS_IKB = {"inline_keyboard": [[_b("🔄 Refresh", "stats"), _b("⬅️ Back", "back")]]}
OPEN_IKB = {"inline_keyboard": [[_b("🔄 Refresh", "open"), _b("⬅️ Back", "back")]]}
CONFIRM_IKB = {"inline_keyboard": [[_b("✅ Confirm Reset", "reset_ok"), _b("❌ Cancel", "back")]]}

# ================= CHART (local renderer — no external chart API) =================
def entry_candle(trade):
    """Open time (UTC epoch, minute) of the 1m candle containing the entry; stored in the trade at open."""
    return int(trade.get("entry_candle") or (trade.get("opened", time.time()) // 60 * 60))

class Candles:
    """1-minute OHLC candles built from our own biquote polls (bid). Rolling buffer persisted next to the state
    file (atomic json) so a restart keeps the chart history."""
    def __init__(self, path=None, keep=CANDLE_KEEP):
        self.path, self.keep, self.lock = path or CANDLE_FILE, keep, threading.Lock()
        self.rows = []; self._saved = 0
        try:
            with open(self.path) as f: data = json.load(f)
            self.rows = [list(map(float, r[:5])) for r in data if isinstance(r, list) and len(r) >= 5][-keep:]
        except FileNotFoundError: pass
        except Exception: log.exception("candle file unreadable -> starting empty")
    def add(self, price, ts=None):
        ts = time.time() if ts is None else ts; k = float(int(ts // 60) * 60)
        roll = False
        with self.lock:
            if self.rows and self.rows[-1][0] == k:
                r = self.rows[-1]; r[2] = max(r[2], price); r[3] = min(r[3], price); r[4] = price
            elif not self.rows or k > self.rows[-1][0]:
                self.rows.append([k, price, price, price, price]); roll = True
                del self.rows[:-self.keep]
        if roll and time.time() - self._saved >= 30: self.save()
    def save(self):
        with self.lock: data = json.dumps([[int(r[0])] + [round(x, 3) for x in r[1:]] for r in self.rows])
        try:
            tmp = self.path + ".tmp"
            with open(tmp, "w") as f: f.write(data)
            os.replace(tmp, self.path); self._saved = time.time()
        except Exception: log.exception("candle save failed")
    def get(self, n=None):
        with self.lock: rows = [tuple(r) for r in self.rows]
        return rows[-n:] if n else rows

class Chart:
    """Binance-perp style LIGHT chart drawn with matplotlib from our own 1m candles."""
    _cache = {}; _meta = {}; _fid = {}
    alert = None
    def __init__(self, store, price_hist, candles=None):
        self.st, self.hist = store, price_hist
        self.candles_src = candles or Candles()
    def _roll(self):
        c = self.st.s.setdefault("chart", {}); today = datetime.now(timezone.utc).date().isoformat()
        if c.get("date") != today:
            c.clear(); c.update(date=today, generated=0, local=0, failed=0, types={})
        for k_, v_ in (("generated", 0), ("local", 0), ("failed", 0), ("types", {})): c.setdefault(k_, v_)
        return c
    def generated(self):
        with self.st.lock: return self._roll().get("generated", 0)
    def cached(self, key, direction=None, prefer_fid=False):
        if direction and self._meta.get(key, {}).get("direction") not in (None, direction): return None
        if prefer_fid and self._fid.get(key): return self._fid[key]
        return self._cache.get(key)
    def matches(self, key, t):
        m = self._meta.get(key)
        return not m or (m["direction"] == t["direction"] and abs(m["entry"] - t["entry"]) < 1e-6 and abs(m["sl"] - t["sl"]) < 1e-6)
    def set_fid(self, key, fid):
        if fid: self._fid[key] = fid
        for k in list(self._fid)[:-40]: self._fid.pop(k, None)
    def drop(self, key):
        for d_ in (self._cache, self._meta, self._fid): d_.pop(key, None)
    def get(self, trade=None, close=None, cache=None, wm=None, now=None, tf=None,
            theme=None, measure=None, wm_on=None):
        """PNG bytes for a signal (close=None) or a TP/SL/close result; None -> caller sends text only."""
        if cache and cache in self._cache: return self._cache[cache]
        kind = (close or {}).get("reason") or "signal"
        img = None
        try: img = self.local(trade, close, wm=wm, now=now, tf=tf, theme=theme, measure=measure, wm_on=wm_on)
        except Exception: log.exception("chart render fail")
        with self.st.lock:
            c = self._roll(); c["generated"] += 1
            if img: c["local"] += 1; c["types"][kind] = c["types"].get(kind, 0) + 1
            else: c["failed"] += 1
            self.st.save()
        if cache and img:
            self._cache[cache] = img; self._meta[cache] = {k_: trade[k_] for k_ in ("direction", "entry", "sl")}
            for k in list(self._cache)[:-20]: self._cache.pop(k, None); self._meta.pop(k, None)
        return img
    def candles(self, n=None):
        return self.candles_src.get(n)

    def local(self, trade=None, close=None, wm=None, now=None, tf=None,
              theme=None, measure=None, wm_on=None):
        """2K Binance-perp style chart from our own 1m candles. Theme/measure/TF come from the channel settings;
        defaults stay the current light + box + 1m look. No external API."""
        import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
        from matplotlib.patches import Rectangle
        matplotlib.rcParams.update({"lines.antialiased": True, "patch.antialiased": True,
                                    "text.antialiased": True, "path.simplify": False})
        raw = [list(c) for c in self.candles()]          # all stored 1m candles
        now = close.get("ts") if close and close.get("ts") else (time.time() if now is None else now)
        if close:
            p_ = close["price"]; k_ = int(now // 60 * 60)
            if raw and int(raw[-1][0]) == k_:
                raw[-1] = [raw[-1][0], raw[-1][1], max(raw[-1][2], p_), min(raw[-1][3], p_), p_]
            elif not raw or k_ > raw[-1][0]:
                prev = raw[-1][4] if raw else p_
                raw.append([k_, prev, max(p_, prev), min(p_, prev), p_])
        if trade:   # the entry candle must exist (fresh start / gap) so the badge has an anchor
            ek = entry_candle(trade); ep = trade.get("entry_candle_price", trade["entry"])
            if not any(int(c[0]) == ek for c in raw):
                raw.append([ek, ep, ep, ep, ep]); raw.sort(key=lambda c: c[0])
        if not raw: return None
        user_tf = CHART_TF_DEFAULT if tf is None else tf
        if tf is None:
            try: user_tf = self.st.s.get("chart_tf", CHART_TF_DEFAULT)
            except Exception: user_tf = CHART_TF_DEFAULT
        theme = normalize_chart_theme(theme)
        measure = normalize_chart_measure(measure)
        wm_on = CHART_WM_DEFAULT if wm_on is None else bool(wm_on)
        pal = CHART_PALETTES[theme]
        BG, GRID, TXT, MUTED, HEAD = pal["BG"], pal["GRID"], pal["TXT"], pal["MUTED"], pal["HEAD"]
        UP, DN, TPC, SLC, ENC = pal["UP"], pal["DN"], pal["TPC"], pal["SLC"], pal["ENC"]
        TAG, ENC_TXT = pal["TAG"], pal["ENC_TXT"]; TP_TXT, SL_TXT = pal["TP_TXT"], pal["SL_TXT"]; S = CHART_LW
        tf = fit_chart_tf(user_tf, trade, raw, now=now, close=close)
        agg_ = aggregate_ohlc(raw, tf)
        if trade:   # v8 framing: ~50 bars of context (~10% tighter than v7), then the trade candles (entry -> now / hit)
            ek_ = entry_candle(trade); ei_ = max([i for i, c in enumerate(agg_) if c[0] <= ek_] or [0])
            st_ = max(0, ei_ - CHART_CONTEXT)
            # walk back from the entry: keep adding history only while the price range still lets the TP+SL box
            # fill >= CHART_BOX_HFRAC of the height (min CHART_CONTEXT_MIN bars) -> the box is always tall
            lv_ = [trade["tp"], trade["sl"], trade["entry"]] + ([close["price"]] if close else [])
            tail_ = agg_[ei_:]
            yl_ = min(lv_ + [c[3] for c in tail_]); yh_ = max(lv_ + [c[2] for c in tail_])
            room_ = abs(trade["tp"] - trade["sl"]) / CHART_BOX_HFRAC / 1.2
            j_ = ei_ - 1
            while j_ >= max(0, ei_ - CHART_CONTEXT):
                nl_, nh_ = min(yl_, agg_[j_][3]), max(yh_, agg_[j_][2])
                if ei_ - j_ > CHART_CONTEXT_MIN and nh_ - nl_ > max(room_, yh_ - yl_): break
                yl_, yh_ = nl_, nh_; j_ -= 1
            st_ = max(0, j_ + 1)
            if len(agg_) - st_ > CHART_CANDLES_MAX: st_ = max(0, min(ei_ - 10, len(agg_) - CHART_CANDLES_MAX))
            cs = agg_[st_:]
        else:
            cs = chart_window(agg_, None)
        if not cs: return None
        n = len(cs); right = max(9, int(n * 0.15))
        fig = plt.figure(figsize=CHART_FIGSIZE, dpi=CHART_DPI); fig.patch.set_facecolor(BG)
        ax = fig.add_axes([0.012, 0.07, 0.868, 0.835]); ax.set_facecolor(BG)
        # price span first so the minimum body height can be >= ~2 device pixels
        ys = [x for c in cs for x in (c[2], c[3])]
        if trade: ys += [trade["tp"], trade["sl"], trade["entry"]]
        if close: ys.append(close["price"])
        span = max(ys) - min(ys); pad = span * 0.10 + 0.3; lo, hi = min(ys) - pad, max(ys) + pad
        if close: hi += span * 0.07          # headroom for the TP/SL HIT banner
        if trade:
            # box >= CHART_BOX_FRAC of the width, and enough empty future space for the right-aligned labels
            ek_ = entry_candle(trade); ei_ = max([i for i in range(n) if cs[i][0] <= ek_] or [0])
            rr_ = fig.canvas.get_renderer(); Apx = ax.get_window_extent(rr_).width; Wp = 0.0
            for s_ in (chart_level_label("sl", 70), chart_level_label("tp", 55)):
                tt_ = ax.text(0, 0, s_, fontsize=11, fontweight="bold", bbox=dict(boxstyle="round,pad=0.3")); Wp = max(Wp, tt_.get_window_extent(rr_).width); tt_.remove()
            fl = min(0.45, (Wp + 40) / Apx)
            r_box = (CHART_BOX_FRAC * (n + 0.8) - (n - ei_)) / (1 - CHART_BOX_FRAC)
            r_lab = (fl * (n + 0.8) + 1.2) / (1 - fl)
            right = max(6, int(max(r_box, r_lab) + 0.999))
        ax.set_ylim(lo, hi); ax.set_xlim(-0.8, n + right)
        plot_h_px = CHART_FIGSIZE[1] * CHART_DPI * 0.835
        px = (hi - lo) / max(plot_h_px, 1)
        min_body = max(px * 2.0, (hi - lo) * 1e-5)
        wick_lw = 1.35 * 72.0 / CHART_DPI          # ~1.35 device px, antialiased
        body_lw = 72.0 / CHART_DPI                 # 1 device px crisp border
        body_w = 0.63                          # v8: ~10% thinner than v7 (0.70); spacing like the #S017 chart, slightly tighter
        for i, (t, o, h, l, c) in enumerate(cs):
            col = UP if c >= o else DN
            ax.vlines(i, l, h, color=col, lw=wick_lw, zorder=3, antialiased=True, capstyle="butt")
            body = max(abs(c - o), min_body)
            ax.add_patch(Rectangle((i - body_w / 2, min(o, c)), body_w, body, facecolor=col, edgecolor=col,
                                   lw=body_lw, zorder=3, antialiased=False, snap=True, joinstyle="miter"))
        ax.yaxis.tick_right(); ax.tick_params(axis="y", colors=MUTED, labelsize=10.5, length=0, pad=5)
        ax.yaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda v, _: f"{v:,.2f}"))
        span_min = n * tf
        tick_min = 5 if span_min <= 60 else 15 if span_min <= 150 else 30 if span_min <= 360 else 60 if span_min <= 720 else 120
        idx = []
        for i, c in enumerate(cs):
            dt = datetime.fromtimestamp(c[0], IST)
            mins = dt.hour * 60 + dt.minute
            if mins % tick_min == 0: idx.append(i)
        if len(idx) > 8: idx = idx[:: max(1, len(idx) // 7)]
        ax.set_xticks(idx); ax.set_xticklabels([datetime.fromtimestamp(cs[i][0], IST).strftime("%H:%M") for i in idx])
        ax.tick_params(axis="x", colors=MUTED, labelsize=10.5, length=0, pad=5)
        # grid exactly like the crypto chart (ref: color=GRID, lw=0.8, full opacity)
        ax.grid(color=GRID, lw=0.8, zorder=0)
        for sp in ax.spines.values(): sp.set_visible(False)
        tags = []
        def tag(y, fc, tc=TAG, live=False):
            key = f"{y:,.3f}"
            if any(f"{t0[0]:,.3f}" == key for t0 in tags):
                if not live: return                          # identical price already tagged
                tags[:] = [t0 for t0 in tags if f"{t0[0]:,.3f}" != key]
            tags.append([y, y, fc, tc, live])
        last = cs[-1][4]
        live_y = close["price"] if close else last
        live_fc = None
        if trade:
            buy = trade["direction"] == "BUY"; e = trade["entry"]
            ek = entry_candle(trade); ei = max([i for i in range(n) if cs[i][0] <= ek] or [0])
            x0, x1 = ei - 0.5, n + right - 1
            lp_tp, lp_sl = level_pips(trade)
            if measure == "box":
                ax.add_patch(Rectangle((x0, min(e, trade["tp"])), x1 - x0, abs(trade["tp"] - e), facecolor=TPC, alpha=CHART_BOX_ALPHA, lw=0, zorder=2))
                ax.add_patch(Rectangle((x0, min(e, trade["sl"])), x1 - x0, abs(trade["sl"] - e), facecolor=SLC, alpha=CHART_BOX_ALPHA, lw=0, zorder=2))
            # ref: target dashed (3,2) lw 1.0, stop-loss solid lw 1.2, entry solid lw 1.2
            ax.plot([x0, x1], [trade["tp"]] * 2, color=TPC, lw=1.0 * S, ls=(0, (3, 2)), zorder=4)
            ax.plot([x0, x1], [trade["sl"]] * 2, color=SLC, lw=1.2 * S, zorder=4)
            ax.plot([x0, x1], [e, e], color=ENC, lw=1.2 * S, zorder=4)
            # v7 (ref layout): labels right-aligned inside the box at the right edge, centred on their lines
            lx = x1 - 0.3
            ax.text(lx, trade["tp"], chart_level_label("tp", lp_tp),
                    color=TAG, fontsize=11, fontweight="bold", ha="right", va="center", zorder=6,
                    bbox=dict(boxstyle="round,pad=0.3", fc=TPC, ec=TPC))
            ax.text(lx, trade["sl"], chart_level_label("sl", lp_sl),
                    color=TAG, fontsize=11, fontweight="bold", ha="right", va="center", zorder=6,
                    bbox=dict(boxstyle="round,pad=0.3", fc=SLC, ec=SLC))
            ax.text(lx, e, "Entry", color=ENC_TXT, fontsize=10.5, fontweight="bold", ha="right", va="center", zorder=6,
                    bbox=dict(boxstyle="round,pad=0.3", fc=ENC, ec=ENC))
            # BUY below the entry candle, SELL above it (box left edge, far from the right-edge labels)
            g = (hi - lo) * 0.02; ep = trade.get("entry_candle_price", e)
            head = (min(cs[ei][3], ep) - g) if buy else (max(cs[ei][2], ep) + g)
            ax.annotate("BUY" if buy else "SELL", (ei, head), xytext=(ei, head + (-1 if buy else 1) * (hi - lo) * 0.075),
                        ha="center", va="top" if buy else "bottom", color="white", fontsize=11.5, fontweight="bold", zorder=8,
                        bbox=dict(boxstyle="round,pad=0.3", fc=TPC if buy else SLC, ec=TPC if buy else SLC),
                        arrowprops=dict(arrowstyle="-|>", color=TPC if buy else SLC, lw=2.5, mutation_scale=18 * 1.3))
            tag(trade["tp"], TPC, TP_TXT); tag(trade["sl"], SLC, SL_TXT); tag(e, ENC, ENC_TXT)
        if close:
            win = close["reason"] == "TP" or (close["reason"] not in ("SL", "STOPOUT") and close.get("pips", 0) > 0)
            cc = TPC if win else SLC
            head = {"TP": "TP HIT \u2714", "SL": "SL HIT \u2718", "STOPOUT": "STOP OUT \u2718"}.get(close["reason"], "CLOSED")
            ax.axhline(close["price"], color=cc, lw=0.9 * S, ls=(0, (4, 3)), alpha=0.9, zorder=4)
            ax.plot([n - 1], [close["price"]], marker="o", ms=10, mfc=cc, mec="white", mew=1.6, zorder=9, antialiased=True)
            badge = f" {head}  {close_pips_text(close['pips'])} pips "
            if trade:
                badge += f"  \u00b7  {fmt_period(now - trade['opened'])} "
            ax.text(0.02, 0.955, badge, transform=ax.transAxes,
                    color=TAG, fontsize=13, fontweight="bold", ha="left", va="top", zorder=11,
                    bbox=dict(boxstyle="round,pad=0.45", fc=cc, ec=cc))
            live_fc = cc
            tag(close["price"], cc, TP_TXT if close["reason"] == "TP" else "white", live=True)
        else:
            live_fc = UP if last >= cs[-1][1] else DN
            ax.axhline(last, color=live_fc, lw=0.8 * S, ls=(0, (1, 2)), alpha=0.9, zorder=4)   # ref live line
            tag(last, live_fc, "white", live=True)
        # right-axis tags. The live tag is ONE box: price on top, candle countdown (mm:ss) below; it stays exactly on
        # the live price and the other tags (TP / SL / entry) are nudged away from it so nothing overlaps.
        cd = fmt_countdown(candle_remaining(now, tf))
        rng = hi - lo; fs_tag = 10
        line_d = fs_tag * 1.2 / 72 * CHART_DPI / plot_h_px * rng       # one text line in data units
        half = line_d * 0.5 + 0.28 * fs_tag / 72 * CHART_DPI / plot_h_px * rng   # half height of a 1-line tag box
        sep = rng * 0.006
        def ext(tg_):        # (top, bottom) extent of a tag centred on its price line
            return (tg_[1] + half, tg_[1] - half - (line_d if tg_[4] else 0))
        lv_ = [t_ for t_ in tags if t_[4]]
        if lv_:
            L_ = lv_[0]; up_ = sorted([t_ for t_ in tags if not t_[4] and t_[0] >= L_[0]], key=lambda z: z[0])
            dn_ = sorted([t_ for t_ in tags if not t_[4] and t_[0] < L_[0]], key=lambda z: -z[0])
            top = ext(L_)[0]
            for t_ in up_:
                if t_[1] - half < top + sep: t_[1] = top + sep + half
                top = ext(t_)[0]
            bot = ext(L_)[1]
            for t_ in dn_:
                if t_[1] + half > bot - sep: t_[1] = bot - sep - half
                bot = ext(t_)[1]
        else:
            tags.sort(key=lambda z: z[0])
            for i in range(1, len(tags)):
                if tags[i][1] - tags[i - 1][1] < 2 * half + sep: tags[i][1] = tags[i - 1][1] + 2 * half + sep
        for y, yd, fc, tc, live in tags:
            if live:   # 2-line block centred half a line below the price so line 1 sits on the price
                ax.text(1.004, yd - line_d * 0.5, f"{y:,.3f}\n{cd}", transform=ax.get_yaxis_transform(), color=tc,
                        fontsize=fs_tag, fontweight="bold", va="center", ha="left", ma="center", linespacing=1.2,
                        clip_on=False, zorder=11, bbox=dict(boxstyle="square,pad=0.28", fc=fc, ec=fc))
            else:
                ax.text(1.004, yd, f"{y:,.3f}", transform=ax.get_yaxis_transform(), color=tc, fontsize=fs_tag, fontweight="bold",
                        va="center", ha="left", clip_on=False, zorder=10, bbox=dict(boxstyle="square,pad=0.28", fc=fc, ec=fc))
        # hide price-axis numbers that would sit behind a tag (ref behaviour)
        boxes = [ext(t_) for t_ in tags]
        ax.set_yticks([v for v in ax.get_yticks() if lo <= v <= hi and all(not (b_ - half * 0.6 <= v <= a_ + half * 0.6) for a_, b_ in boxes)])
        o, h, l, c = cs[-1][1:5]; prev = cs[-2][4] if n > 1 else o; ch = c - prev; col = UP if ch >= 0 else DN
        fig.text(0.015, 0.955, chart_title(tf), color=HEAD, fontsize=14.5, fontweight="bold", va="center")
        fig.text(0.26, 0.955, f"O {o:,.3f}  H {h:,.3f}  L {l:,.3f}  C {c:,.3f}  {ch:+.3f} ({(ch / prev * 100) if prev else 0:+.2f}%)",
                 color=col, fontsize=11, va="center")
        sub = datetime.fromtimestamp(now, IST).strftime("%d %b %Y %H:%M IST")
        if trade:
            sub = f"#{trade.get('id', '')} {trade['direction']} \u00b7 " + sub
            if close: sub += f"  \u00b7  {fmt_period(now - trade['opened'])}"
        fig.text(0.015, 0.92, sub, color=MUTED, fontsize=10.5, va="center")
        if wm_on:
            text = (wm or CHANNEL_WM or PAIR).strip()
            if text:
                try: wx, wy = wm_spot(fig, ax, cs, text, CHART_WM_FS)
                except Exception: log.exception("wm spot"); wx, wy = 0.5, 0.5
                ax.text(wx, wy, text, transform=ax.transAxes, color=MUTED, fontsize=CHART_WM_FS, fontweight="bold",
                        ha="center", va="center", alpha=CHART_WM_ALPHA, zorder=1, rotation=0)
        b = io.BytesIO(); fig.savefig(b, format="png", facecolor=BG, dpi=CHART_DPI); plt.close(fig)
        img = b.getvalue()
        if trade and SAVE_CHARTS:
            try:
                os.makedirs(os.path.join(BASE_DIR, "charts"), exist_ok=True)
                fn = f"{trade.get('id', 'X')}_{close['reason']}.png" if close else f"{trade.get('id', 'X')}.png"
                with open(os.path.join(BASE_DIR, "charts", fn), "wb") as f: f.write(img)
            except Exception: log.debug("chart save skipped")
        return img

CHART_WM_FS = 24
CHART_WM_ALPHA = 0.12
def wm_spot(fig, ax, cs, text, fs):
    """Emptiest spot for the watermark (axes fraction): score candidate centres on a 9x9 grid by the pixel area they
    overlap with candle ranges, texts/labels/tags, boxes and level lines; least overlap wins, ties -> nearer the middle."""
    import matplotlib
    fig.canvas.draw(); r = fig.canvas.get_renderer(); ab = ax.get_window_extent(r)
    probe = ax.text(0, 0, text, fontsize=fs, fontweight="bold", transform=None); bb = probe.get_window_extent(r); probe.remove()
    w, h = bb.width * 1.08, bb.height * 1.3; pad = 28            # clearance around candles / labels
    occ = []
    for i, c in enumerate(cs):
        (x0, y0), (x1, y1) = ax.transData.transform([(i - 0.5, c[3]), (i + 0.5, c[2])]); occ.append((x0 - pad, y0 - pad, x1 + pad, y1 + pad, 1.0))
    for a_ in list(ax.texts) + list(fig.texts):
        try: e = a_.get_window_extent(r); occ.append((e.x0 - pad, e.y0 - pad, e.x1 + pad, e.y1 + pad, 1.5))
        except Exception: pass
    for p_ in ax.patches:
        e = p_.get_window_extent(r)
        if e.width * e.height > 400: occ.append((e.x0, e.y0, e.x1, e.y1, 0.6))          # TP / SL boxes (bodies are tiny)
    for l_ in ax.lines:
        try:
            e = l_.get_window_extent(r); occ.append((e.x0, e.y0 - 20, e.x1, e.y1 + 20, 0.4))
        except Exception: pass
    best = None
    xs = [ab.x0 + w / 2 + 10 + k * (ab.width - w - 20) / 8 for k in range(9)]
    ys = [ab.y0 + h / 2 + 10 + k * (ab.height - h - 20) / 8 for k in range(9)]
    cx0, cy0 = (ab.x0 + ab.x1) / 2, (ab.y0 + ab.y1) / 2
    for cx in xs:
        for cy in ys:
            sc = [0.0, 0.0]
            for j_, m_ in enumerate((0, 70)):        # pass 2: extra 70 px margin -> prefer the spot with most clearance
                X0, Y0, X1, Y1 = cx - w / 2 - m_, cy - h / 2 - m_, cx + w / 2 + m_, cy + h / 2 + m_
                for (a0, b0, a1, b1, wt) in occ:
                    ix = min(X1, a1) - max(X0, a0)
                    if ix <= 0: continue
                    iy = min(Y1, b1) - max(Y0, b0)
                    if iy > 0: sc[j_] += ix * iy * wt
            key = (round(sc[0]), round(sc[1] / 2000), abs(cx - cx0) / ab.width + abs(cy - cy0) / ab.height)
            if best is None or key < best[0]: best = (key, cx, cy)
    _, cx, cy = best
    return (cx - ab.x0) / ab.width, (cy - ab.y0) / ab.height

# ================= BOT =================
class Bot:
    key, cfg, cid, cname, strategy, alert_from = "SRC", {"every": True}, CHANNEL_ID, CHANNEL_NAME, CHANNEL_STRATEGY, None
    base_lot = BASE_LOT; wm = CHANNEL_WM; max_lot = SRC_MAX_LOT
    @property
    def btn(self):   # TradingView button only when this channel's chart is ON
        return TV_BTN if self.st.s.get("chart_on", True) else None
    def menu_kb(self, chart_on=None):
        s = self.src.st.s if getattr(self, "src", None) else self.st.s
        sett = chart_settings(s)
        on = sett["on"] if chart_on is None else chart_on
        return menu_ikb(on, sett["tf"])
    def chart_opts(self):
        """kwargs for Chart.get from THIS channel's persisted settings."""
        s = chart_settings(self.st.s)
        return dict(tf=s["tf"], theme=s["theme"], measure=s["measure"],
                    wm_on=s["wm"], wm=(self.wm if s["wm"] else None))
    def next_lot(self, lot, streak, win):
        return next_martingale(lot, streak, win, max_lot=SRC_MAX_LOT, fixed=True)      # fixed 0.01, no martingale
    def __init__(self):
        self.st = Store(); self.px = Price(); self.tg = TG()
        from collections import deque
        self.hist = deque(maxlen=6 * 3600)   # 1 s samples (min+max) ~3 h
        self.candles = Candles(); self.px.candles = self.candles
        self.chart = Chart(self.st, self.hist, self.candles)
        self.stop = threading.Event(); self.pending_reset = {}; self.pending_alltime = {}; self.beat = {}; self.cb_posted = set(); self.range_msg = {}
        if self.st.fresh:   # first ever start: don't back-post today's already-passed summaries
            for k in due_summaries(datetime.now(IST), {}): self.st.s["sent"][k] = datetime.now(IST).date().isoformat()
        self.op_lock = threading.RLock()
        if not self.st.s.get("pips_total") and self.st.s["history"]:   # legacy state: rebuild lifetime pips
            self.st.s["pips_total"] = round(sum(h["pips"] for h in self.st.s["history"]), 1)
        self.src = self; self.chans = {"SRC": self}
        for cfg in CHANNELS: self.chans[cfg["key"]] = (OwnChan if cfg.get("own") else Chan)(self, cfg)
        self.reset_sel = {}; self.chart.alert = self.admin_alert; self.key_edit = {}
        for ch in self.chans.values():
            try: ch.migrate_sysclose()
            except Exception: log.exception("migrate %s", ch.key)

    # ---- account ----
    def unrealised(self, bid=None, ask=None):
        t = self.st.s["open"]
        if not t: return 0.0
        if bid is None:
            q = self.px.get()
            if not q: return t.get("last_float", 0.0)
            bid, ask = q
        p = close_price_for(t["direction"], bid, ask)
        v = money_for_pips(pips_between(t["direction"], t["entry"], p), t["lot"])
        t["last_float"] = v; return v

    def acct_view(self):
        a = self.st.s["acct"]; t = self.st.s["open"]; u = self.unrealised()
        q = self.px.get(); mg = margin_for(q[1] if q else t["entry"], t["lot"]) if t else 0.0
        eq = a["balance"] + u; n = a["wins"] + a["losses"]
        return dict(balance=a["balance"], equity=eq, realised=a["realised"], unrealised=u,
                    margin=mg, free=eq - mg, max_dd=a["max_dd"], max_dd_pct=a["max_dd_pct"],
                    wins=a["wins"], losses=a["losses"], trades=n,
                    winrate=(a["wins"] / n * 100 if n else 0), volume=a["volume"],
                    spread=a["spread_paid"], wipes=a["wipes"])

    def update_dd(self, equity):
        """Max DD is the drop from the all-time equity peak; % is relative to that peak.
        Wipe resets of the live balance do not reset lifetime_peak or max_dd."""
        a = self.st.s["acct"]
        a["peak"] = max(float(a.get("peak") or equity), equity)
        a["lifetime_peak"] = max(float(a.get("lifetime_peak") or 0), a["peak"], equity)
        peak = a["lifetime_peak"]
        dd = peak - equity
        if dd > a["max_dd"]:
            a["max_dd"] = round(dd, 2); a["max_dd_pct"] = round(dd / peak * 100, 2) if peak else 0

    # ---- signals ----
    def sess_row(self, name):
        """Today's (UTC date) per-session counters row."""
        ss = self.st.s.setdefault("sess_stats", {"date": "", "rows": {}}); today = datetime.now(timezone.utc).date().isoformat()
        if ss.get("date") != today: ss["date"], ss["rows"] = today, {}
        return ss["rows"].setdefault(name, {"signals": 0, "tp": 0, "sl": 0, "pips": 0.0, "money": 0.0})

    def dec_levels(self):
        tr = tuple(self.st.s.get("tp_range") or TP_RANGE); sr = tuple(self.st.s.get("sl_range") or SL_RANGE)
        return dict(tp=sum(tr) / 2 * PIP, sl=sum(sr) / 2 * PIP)

    def ai_decide(self):
        """Decisions API call OUTSIDE the state lock. Returns (dir, info) or (None, None) on failure (retry later)."""
        self._dec_wait = False
        if time.time() < getattr(self, "_dec_retry_at", 0): self._dec_wait = True; return None, None
        q = self.px.get(max_age=3)
        if not q: return None, None
        try:
            ss_ = session_at(datetime.now(timezone.utc))
            d, info = decide_direction(self.candles.get(DECISION_CANDLES), q[0], q[1], ss_[0] if ss_ else "OUTSIDE", **self.dec_levels())
            log.info("DECISION %s conf=%.3f buy=%.3f sell=%.3f", d, info["conf"], info["buy"], info["sell"]); return d, info
        except Exception as e:
            self._dec_wait = True; self._dec_retry_at = time.time() + DECISION_RETRY_SEC
            log.error("Decisions API failed (retry in %ss): %s", DECISION_RETRY_SEC, str(e)[:200])
            if time.time() - getattr(self, "_dec_alert_at", 0) > 1800:
                self._dec_alert_at = time.time()
                try: self.admin_alert(f"⚠️ <b>Decisions API error</b> — signal waits &amp; retries every {DECISION_RETRY_SEC}s\n<code>{html.escape(str(e)[:300])}</code>")
                except Exception: pass
            return None, None

    def open_signal(self, forced=False, mirror=None):
        """mirror = source trade dict -> post the SAME direction/entry/TP/SL/quote in this channel with its own lot."""
        ai_d = ai_info = None
        if not mirror:
            if forced: self._dec_retry_at = 0
            ai_d, ai_info = self.ai_decide()
            if not ai_d: return None
        with self.op_lock, self.st.lock:
            s = self.st.s
            if s["open"]: return None
            if mirror:
                bid, ask = mirror["bid"], mirror["ask"]; d = mirror["direction"]; entry = mirror["entry"]
                tpp, slp, tp, sl = mirror["tp_pips"], mirror["sl_pips"], mirror["tp"], mirror["sl"]
            else:
                q = self.px.get(max_age=3)
                if not q: log.warning("no price, cannot open"); return None
                bid, ask = q
                # executable side of the SAME quote: BUY fills at Ask, SELL at Bid (never mid)
                d = ai_d; entry = round(entry_price_for(d, bid, ask), 3)   # direction decided by the Decisions API (never random)
                tpp, slp, _ = pick_tp_sl(tuple(s.get("tp_range") or TP_RANGE), tuple(s.get("sl_range") or SL_RANGE))
                tp, sl = levels(d, entry, tpp, slp)
            s["seq"] += 1; sid, key = signal_id(s["seq"]); lot = qlot(s["lot"])
            key = f"{key}~{int(time.time() * 1000)}"   # unique trade uid: dedupe never collides after a reset / S1000 wrap
            t = dict(id=sid, key=key, direction=d, entry=entry, tp=tp, sl=sl, tp_pips=tpp, sl_pips=slp,
                     lot=lot, streak=s["streak"], opened=(mirror or {}).get("opened") or time.time(), msg_id=None, last_float=0.0,
                     bid=bid, ask=ask, src_key=(mirror or {}).get("key"), src_id=(mirror or {}).get("id"),
                     src_streak=(mirror or {}).get("streak"))
            if ai_info: t["ai"] = {k: (round(v, 4) if isinstance(v, float) else v) for k, v in ai_info.items()}
            if mirror and mirror.get("yrange"): t["yrange"] = list(mirror["yrange"])
            t["entry_candle"] = entry_candle(mirror or t); t["entry_candle_price"] = entry
            now_u = datetime.now(timezone.utc); ss_ = session_at(now_u)
            t["session"] = ss_[0] if ss_ else "OUTSIDE"; t["age_alerts"] = []
            self.sess_row(t["session"])["signals"] += 1
            if not forced and ss_:
                sc = s.setdefault("sess_count", {}); k_ = session_key(now_u); sc[k_] = sc.get(k_, 0) + 1
                for old in list(sc)[:-20]: sc.pop(old)
            lp_tp, lp_sl = level_pips(t); t["tp_pips"], t["sl_pips"] = lp_tp, lp_sl
            txt = self.signal_text(sid, d, lot, entry, tp, sl, lp_tp, lp_sl, s["streak"])
            emo = "🟢" if d == "BUY" else "🔴"
            txt = txt or (f"🔴 <b>TRADE SIGNAL | SCALPING ⚡</b>\n━━━━━━━━━━━━━━━━━\n"
                   f"🆔 <b>#{sid}</b>\n💎 Pair: <b>#XAUUSD</b>\n🌐 Direction: <b>{d} {emo}</b>\n"
                   f"📌 Lot Size: <b>{fmt_lot(lot)}</b>\n" + ("" if self.cfg.get("every") else f"⚠️ SL Streak: <b>{s['streak']}</b>\n") + "\n"
                   f"✅<b>ENTRY :</b> <code>{fmt_p(entry)}</code>\n\n"
                   f"🎯 <b>TARGET</b>\n<code>{fmt_p(tp)}</code>   (+{fmt_pips(lp_tp)} Pips · {fmt_money(money_for_pips(lp_tp, lot))})\n\n"
                   f"🛑 <b>STOP LOSS</b>\n<code>{fmt_p(sl)}</code>   (-{fmt_pips(lp_sl)} Pips · {fmt_money(-money_for_pips(lp_sl, lot))})\n\n"
                   f"💎 <b>{html.escape(self.cname)}</b>\n⚠️ <i>Trading involves risk. Trade responsibly.</i>")
            s["open"] = t; s["signals"] = s.get("signals", 0) + 1
            if ai_info:
                dl = s.setdefault("dec_log", []); dl.append(dict(id=sid, d=d, conf=t["ai"]["conf"], ts=int(time.time()), res=None)); del dl[:-30]
            self.st.save()
        snap = dict(t)                     # immutable snapshot: text AND chart come from the same object
        ck_ = chart_key("sig", snap) + f"|{self.key}"
        img = None
        if self.st.s.get("chart_on", True):
            img = self.chart.get(dict(snap), cache=ck_, **self.chart_opts())            # local renderer (never blocks: None -> text)
            if img is not None and not self.chart.matches(ck_, snap):                  # direction / levels mismatch -> never send it
                log.error("[%s] chart/text mismatch for #%s -> re-render", self.key, sid)
                self.chart.drop(ck_); img = self.chart.get(dict(snap), cache=ck_, **self.chart_opts())
        def _sig():
            self.tg.ambiguous = False
            m = self.tg.photo(self.cid, img, txt, self.btn) if img else None
            if m: self.chart.set_fid(ck_, TG.file_id(m))
            if not m and img and isinstance(img, str) and not self.tg.ambiguous:      # stale file_id -> upload the bytes
                b_ = self.chart.cached(ck_, snap["direction"]); m = self.tg.photo(self.cid, b_, txt, self.btn) if b_ else None
            if not m and not self.tg.ambiguous: m = self.tg.send(self.cid, txt, markup=self.btn)
            return m
        m = self.post_once(key, "signal", _sig)
        with self.st.lock:
            if m: t["msg_id"] = m["message_id"]; self.st.s["last_msg_id"] = m["message_id"]
            a = self.st.s["acct"]; a["volume"] = qlot(a["volume"] + lot)
            self.st.save()
        # trade is stored (s["open"]) and its signal posted -> mark entry achieved (no channel message)
        self.mark_entry(t)
        with self.st.lock: self.st.s["entries"] = self.st.s.get("entries", 0) + 1; self.st.save()
        if self.key == "SRC": self.px.take_extremes()   # only quotes after entry is marked count (targets share the source window)
        log.info("OPEN %s %s entry=%s tp=%s sl=%s lot=%s bid=%s ask=%s forced=%s",
                 sid, d, entry, tp, sl, lot, bid, ask, forced)
        return t

    def signal_text(self, *a):
        return None                 # None -> the original inline format (source / Fixed unchanged)

    def footer(self):
        return "⚠️ <i>Trading involves risk. Trade responsibly.</i>"

    def entry_text(self, t):
        emo = "🟢" if t["direction"] == "BUY" else "🔴"
        q = self.px.get(max_age=3); live = entry_price_for(t["direction"], *q) if q else t["entry"]
        return (f"✅ <b>Entry Achieved</b>\n💎 <b>#XAUUSD</b> • <b>{t['direction']} {emo}</b>\n"
                f"✅ <b>Entry:</b> <code>{fmt_p(t['entry'])}</code>\n💵 <b>Live price:</b> <code>{fmt_p(live)}</code>\n"
                f"{self.float_line(t, q)}\n🆔 <b>#{t['id']}</b>")

    def float_line(self, t, q=None):
        """Floating PnL at the live CLOSE side (BUY->bid, SELL->ask) vs the market entry (ask/bid): spread included."""
        q = q or self.px.get(max_age=5)
        if not q: return "📊 <b>Floating:</b> —"
        fp = pips_between(t["direction"], t["entry"], close_price_for(t["direction"], *q))
        return f"📊 <b>Floating:</b> {fp:+.1f} Pips · {fmt_money(money_for_pips(fp, t['lot']))} ({fmt_lot(t['lot'])} lot)"

    def close_trade(self, reason, bid, ask):
        with self.op_lock, self.st.lock:
            s = self.st.s; t = s["open"]
            if not t: return None
            d = t["direction"]
            if reason == "TP": price = t["tp"]; pips = t["tp_pips"]
            elif reason == "SL": price = t["sl"]; pips = -t["sl_pips"]
            else:
                price = close_price_for(d, bid, ask); pips = pips_between(d, t["entry"], price)
            live = close_price_for(d, bid, ask)
            gross = money_for_pips(pips, t["lot"]); cost = spread_cost(t["lot"])
            net = round(gross - cost, 2)
            a = s["acct"]; a["balance"] = round(a["balance"] + net, 2)
            a["realised"] = round(a["realised"] + net, 2); a["spread_paid"] = round(a["spread_paid"] + cost, 2)
            sb_ = self.cfg.get("start_balance", START_BALANCE)
            sysclose = reason == "FORCE"          # closed by system/admin: NOT a TP/SL -> streak & lot unchanged
            win = gross > 0 and not sysclose
            if sysclose: s["sys_closed"] = s.get("sys_closed", 0) + 1
            else:
                a["wins" if win else "losses"] += 1
                s["lot"], s["streak"] = self.next_lot(t["lot"], s["streak"], win)
            s["max_streak"] = max(s["max_streak"], s["streak"])
            wiped = None
            self.update_dd(a["balance"])
            cy = s.setdefault("cycle", {"start": t["opened"], "start_balance": sb_, "trades": 0, "peak": sb_, "max_dd": 0.0})
            cy["trades"] += 1; cy["peak"] = max(cy["peak"], a["balance"]); cy["max_dd"] = round(max(cy["max_dd"], cy["peak"] - a["balance"]), 2)
            if a["balance"] <= 0:                        # account wiped -> report, reset, continue
                a["wipes"] += 1
                wiped = dict(n=a["wipes"], streak=s["streak"], last_lot=t["lot"], trades=cy["trades"], start_bal=cy["start_balance"],
                             end_bal=a["balance"], loss=round(cy["start_balance"] - a["balance"], 2), peak=cy["peak"],
                             max_dd=cy["max_dd"], dur=time.time() - cy["start"])
                a["balance"] = WIPE_BALANCE
                a["peak"] = max(float(a.get("peak") or 0), WIPE_BALANCE)
                a["lifetime_peak"] = max(float(a.get("lifetime_peak") or 0), a["peak"])
                s["lot"], s["streak"], s["alerted_streak"] = qlot(self.base_lot), 0, 0
                s["cycle"] = {"start": time.time(), "start_balance": WIPE_BALANCE, "trades": 0, "peak": WIPE_BALANCE, "max_dd": 0.0}
            dur = time.time() - t["opened"]
            s["history"].append(dict(id=t["id"], dir=d, entry=t["entry"], exit=price, lot=t["lot"],
                                     pips=pips, net=net, reason=reason, opened=t["opened"], closed=time.time(),
                                     session=t.get("session", "OUTSIDE"), streak=s["streak"], sys=sysclose))
            s["history"] = s["history"][-5000:]
            k = {"TP": "tp", "SL": "sl"}.get(reason, "forced"); s[k] = s.get(k, 0) + 1
            row = self.sess_row(t.get("session", "OUTSIDE"))
            if not sysclose: row["tp" if win else "sl"] += 1
            row["pips"] = round(row["pips"] + pips, 1); row["money"] = round(row["money"] + net, 2)
            s["pips_total"] = round(s.get("pips_total", 0.0) + pips, 1)
            s["open"] = None
            s["next_signal_at"] = time.time() + random.randint(*(self.cfg.get("delay_range") or DELAY_RANGE))
            self.st.save()
            streak_now, lot_next = s["streak"], s["lot"]
        per = fmt_period(dur); m = f"{fmt_money(gross)} ({fmt_lot(t['lot'])} lot)"
        if reason == "TP":
            txt = format_tp_close(t["id"], price, live, close_pips_text(pips), m, per)
        elif reason == "SL":
            txt = (f"<b>#XAUUSD Stop Target Hit 🛑</b>\n🛑 <b>Stop price:</b> <code>{fmt_p(price)}</code>\n📉 <b>Live price:</b> <code>{fmt_p(live)}</code>\n"
                   f"😥 <b>LOSS:</b> {close_pips_text(pips)} Pips • {m}\n⏰ <b>Period:</b> {per}\n🆔 <b>#{t['id']}</b>")
        elif reason == "STOPOUT":
            txt = (f"<b>#XAUUSD Stop Out 💥</b>\n🔒 <b>Close price:</b> <code>{fmt_p(price)}</code>\n💵 <b>Live price:</b> <code>{fmt_p(live)}</code>\n"
                   f"😥 <b>LOSS:</b> {close_pips_text(pips)} Pips • {m}\n⏰ <b>Period:</b> {per}\n🆔 <b>#{t['id']}</b>")
        else:
            txt = (f"<b>#XAUUSD Closed by System 🔒</b>\n🔒 <b>Close price:</b> <code>{fmt_p(price)}</code>\n💵 <b>Live price:</b> <code>{fmt_p(live)}</code>\n"
                   f"{'🤑 <b>PROFIT:</b>' if gross >= 0 else '😥 <b>LOSS:</b>'} {close_pips_text(pips)} Pips • {m}\n⏰ <b>Period:</b> {per}\n🆔 <b>#{t['id']}</b>")
        if self.st.s.get("pending_close"): self.flush_close()      # never overwrite an undelivered close
        with self.st.lock: self.st.s["pending_close"] = {"id": t.get("key", t["id"]), "text": txt, "reply": t["msg_id"],
                                                                "trade": {k: t.get(k) for k in ("id", "key", "src_key", "direction", "entry", "tp", "sl", "yrange", "opened", "entry_candle", "entry_candle_price")},
                                                                "close": {"price": price, "pips": pips, "reason": reason, "ts": time.time()}}; self.st.save()
        self.flush_close()
        if wiped:
            w = wiped; dd_ = int(w["dur"]); dd_txt = f"{dd_ // 86400}d {dd_ % 86400 // 3600}h {dd_ % 3600 // 60}m"
            rep = "\n".join([
                f"💥 <b>WIPE REPORT #{w['n']}</b>", "━━━━━━━━━━━━━━━━━━━━",
                f"🕰️ <b>Time:</b> {datetime.now(IST):%d %b %Y %I:%M %p} IST",
                f"🆔 <b>Last trade:</b> #{t['id']} ({reason})",
                f"⚠️ <b>Streak reached:</b> {w['streak']}", f"📦 <b>Last lot:</b> {fmt_lot(w['last_lot'])}",
                f"📊 <b>Trades this cycle:</b> {w['trades']}", "",
                f"💵 <b>Start balance:</b> ${w['start_bal']:,.2f}", f"🏔 <b>Peak balance:</b> ${w['peak']:,.2f}",
                f"🧾 <b>End balance:</b> ${w['end_bal']:,.2f}", f"🔻 <b>Loss amount:</b> -${w['loss']:,.2f}",
                f"📉 <b>Max DD (cycle):</b> -${w['max_dd']:,.2f}", f"⏳ <b>Duration since last reset:</b> {dd_txt}", "",
                f"♻️ Reset → balance <b>${WIPE_BALANCE:,.0f}</b>, lot <b>{fmt_lot(self.base_lot)}</b>, streak <b>0</b>. Bot continues."])
            rep = f"📢 <b>Channel:</b> {html.escape(self.cname)} ({self.key})\n" + rep
            self.admin_alert(rep)
            try: self.note_wipe(w, t, reason)
            except Exception: log.exception("[%s] milestone wipe", self.key)
        log.info("CLOSE %s %s price=%s pips=%s net=%s streak=%s nextlot=%s", t["id"], reason, price, pips, net, streak_now, lot_next)
        if STREAK_ALERT_DM and self.alert_from and not wiped and not win and not sysclose and streak_now >= self.alert_from:
            with self.st.lock:
                notify = streak_now != self.st.s.get("alerted_streak"); self.st.s["alerted_streak"] = streak_now; self.st.save()
            if notify:
                self.admin_alert(self.streak_alert_text(streak_now, lot_next, a["balance"], t["id"]))
        if win:
            with self.st.lock: self.st.s["alerted_streak"] = 0; self.st.save()
        if self.key == "SRC":   # forwarded copies of this signal close with the SAME result on the SAME quote
            for ch in list(self.chans.values())[1:]:
                ct = ch.st.s.get("open")
                if ct and ct.get("src_key") == t.get("key"):
                    try: ch.close_trade(reason if reason in ("TP", "SL") else "FORCE", bid, ask)
                    except Exception: log.exception("mirror close %s", ch.key)
        return net

    def chan_link(self):
        """Clickable channel link: public @username / invite link (getChat, cached 6 h), else t.me/c/<id>/<last msg>."""
        c = getattr(self, "_link", None)
        if not c or time.time() - c[1] > 6 * 3600:
            url = None
            try:
                r = None if DRY_RUN else self.tg.call("getChat", {"chat_id": self.cid}, tries=1, timeout=8)
                if isinstance(r, dict): url = (f"https://t.me/{r['username']}" if r.get("username") else r.get("invite_link"))
            except Exception: log.debug("getChat %s failed", self.cid)
            c = self._link = (url, time.time())
        if c[0]: return c[0]
        cid = str(self.cid); cid = cid[4:] if cid.startswith("-100") else cid.lstrip("-")
        mid = self.st.s.get("last_msg_id") or (self.st.s.get("open") or {}).get("msg_id")
        return f"https://t.me/c/{cid}" + (f"/{mid}" if mid else "")

    def link_line(self):
        return f"🔗 <a href=\"{html.escape(self.chan_link())}\">{html.escape(self.cname)}</a> · <code>{self.cid}</code>"

    def streak_alert_text(self, n, lot_next, bal, last_id):
        lvl = "7+" if n >= 7 else str(n); act = [c for c in CHANNELS if not c.get("own") and n >= c["activate_after"] and not c.get("every")]
        sev = "🟡" if n <= 2 else ("🟠" if n <= 4 else "🔴")
        return "\n".join([f"🚨 <b>SL STREAK ALERT · LEVEL {lvl}</b> {sev}", "━━━━━━━━━━━━━━━━━━━━", "",
                          f"📢 <b>Channel:</b> {html.escape(self.cname)}", self.link_line(), f"⚠️ <b>Streak:</b> {n} consecutive SL",
                          f"📦 <b>Next lot:</b> {fmt_lot(lot_next)}", f"💵 <b>Balance:</b> ${bal:,.2f}", f"🆔 <b>Last:</b> #{last_id}", "",
                          ("♻️ <b>Rule 2 reset:</b> SL at 0.04 → next lot back to 0.01" if lot_next <= BASE_LOT + 1e-9 and n >= 3 else
                           "📦 <b>Rule 2:</b> 0.01 → 0.02 → 0.04 → reset 0.01"),
                          "📡 <b>Fixed channel:</b> every signal at 0.01 (unchanged)", "",
                          "▶️ Bot keeps running."])

    def admin_close(self):
        """Admin close of the running trade = 'Closed by System' (never an SL: streak & lot unchanged)."""
        with self.op_lock:
            if not self.st.s["open"]: return "📂 No open trade."
            q = self.px.get(max_age=5)
            if not q: return "❌ No live price right now, try again."
            tid = self.st.s["open"]["id"]; self.close_trade("FORCE", *q)
            return f"🔒 #{tid} closed by system · streak {self.st.s['streak']} · next lot {fmt_lot(self.st.s['lot'])} (unchanged)"

    def migrate_sysclose(self):
        """Old state: FORCE closes recorded before v2 were counted as win/loss and moved streak/lot.
        Re-derive streak/lot from the non-system history and un-count those records (once)."""
        s = self.st.s
        if s.get("sysfix_v2"): return False
        with self.st.lock:
            old = [h for h in s["history"] if h.get("reason") == "FORCE" and "sys" not in h]
            for h in old:
                h["sys"] = True; s["sys_closed"] = s.get("sys_closed", 0) + 1
                k = "wins" if h["pips"] > 0 else "losses"; s["acct"][k] = max(0, s["acct"][k] - 1)
            if old:
                run = 0
                for h in s["history"]:
                    if h.get("reason") == "FORCE": continue
                    run = 0 if (h["pips"] > 0 or h.get("streak") == 0) else run + 1   # TP or wipe-reset -> 0
                lot, st_ = qlot(self.base_lot), 0
                for _ in range(run): lot, st_ = self.next_lot(lot, st_, False)
                if True:
                    log.warning("[%s] migrated %d old system closes: streak %s->%s lot %s->%s", self.key, len(old), s["streak"], run, s["lot"], lot)
                    s["streak"], s["lot"] = run, lot
            s["sysfix_v2"] = True; self.st.save()
        return bool(old)

    def started_text(self):
        s = self.st.s; c = self.cfg; sb = self.start_balance()
        L = ["🚀 <b>CHANNEL STARTED</b>", "━━━━━━━━━━━━━━━━━", "", f"💎 <b>{html.escape(self.cname)}</b>",
             f"💵 <b>Account balance:</b> ${s['acct']['balance']:,.2f}", f"🏁 <b>Start balance:</b> ${sb:,.2f}",
             f"📦 <b>Lot:</b> {fmt_lot(s['lot'])}", f"⚖️ <b>Leverage:</b> 1:{LEVERAGE}"]
        if self.key != "SRC":
            L.append(f"📡 <b>Signals:</b> " + ("own signals" if c.get("own") else "every source signal" if c.get("every") else f"after {c['activate_after']} source SL")
                     + f" · {c['progression']}")
        L += ["", f"🕒 {datetime.now(IST):%d %b %Y %H:%M} IST", self.footer()]
        return "\n".join(L)

    def kickoff(self):
        """After Reset All: every channel posts its 'started' message once, before the first signal."""
        for ch in self.chans.values():
            if ch.st.s.get("announce"):
                with ch.st.lock: ch.st.s["announce"] = False; ch.st.save()
                try: ch.tg.send(ch.cid, ch.started_text(), markup=ch.btn)
                except Exception: log.exception("started %s", ch.key)

    def set_balance(self, k, amt):
        ch = self.chans[k]; self.apply_reset([k], {"history", "sequence", "balance"}, clear_open=True, balance=amt)
        with ch.st.lock: ch.st.s["announce"] = False; ch.st.save()
        log.info("BALANCE %s -> %s", k, amt); return ch

    def force_signal(self):
        if self.key == "SRC": self.kickoff()
        with self.op_lock:
            q = self.px.get(max_age=3)
            if not q: return "❌ No live price right now, try again."
            if self.st.s["open"]: self.close_trade("FORCE", *q)
            t = self.open_signal(forced=True)
            if t and self.key == "SRC": self.forward(t)
            return f"✅ Forced signal #{t['id']} {t['direction']} @ {fmt_p(t['entry'])}" if t else "❌ Failed to open"

    # ---- texts ----
    def open_text(self):
        t = self.st.s["open"]
        if not t: return "📂 No open trade."
        q = self.px.get(); u = self.unrealised()
        cur = close_price_for(t["direction"], *q) if q else 0
        pips = pips_between(t["direction"], t["entry"], cur) if q else 0
        emo = "🟢" if t["direction"] == "BUY" else "🔴"
        return (f"📂 <b>OPEN TRADE #{t['id']}</b>\n━━━━━━━━━━━━━━━━━\n"
                f"🌐 <b>Direction:</b> {t['direction']} {emo}\n📌 <b>Lot:</b> {fmt_lot(t['lot'])} • ⚠️ <b>SL Streak:</b> {t['streak']}\n\n"
                f"✅ <b>Entry:</b> <code>{fmt_p(t['entry'])}</code>\n🎯 <b>TP:</b> <code>{fmt_p(t['tp'])}</code>\n🛑 <b>SL:</b> <code>{fmt_p(t['sl'])}</code>\n"
                f"💵 <b>Live ({'ask' if t['direction']=='SELL' else 'bid'}):</b> <code>{fmt_p(cur)}</code>\n\n"
                f"📏 <b>Pips:</b> {pips:+.1f}\n💰 <b>Float PnL:</b> {fmt_money(u)}\n⏰ <b>Open for:</b> {fmt_dur(time.time()-t['opened'])}")

    def window(self, kind, now=None):
        now = now or datetime.now(IST)
        end = now.replace(minute=0, second=0, microsecond=0) if now.hour == REPORT_HOUR else now
        if kind == "daily": start = end - timedelta(days=2 if end.weekday() == 0 else 1)   # Monday covers Sat+Sun (no Sunday report)
        elif kind == "weekly": start = end - timedelta(days=7)
        elif kind == "alltime": start = datetime.fromtimestamp(self.st.s.get("created", time.time()), IST).replace(second=0, microsecond=0)
        else: start = end - timedelta(days=30)
        # never start a period report before this channel existed (Free started 15 Nov; Monday's
        # 48 h window would otherwise say 14 Nov). Midweek / older channels are unchanged.
        if kind != "alltime":
            born = self.st.s.get("created")
            if born:
                born_dt = datetime.fromtimestamp(born, IST).replace(second=0, microsecond=0)
                if start < born_dt: start = min(born_dt, end)
        return start, end

    def report_title(self):
        return REPORT_NAMES.get(self.key, self.cname)

    def channel_link(self):
        return CHANNEL_LINKS.get(self.key, "")

    def report_data(self, kind, now=None):
        """Window + trade set + totals shared by summary() and the PnL image."""
        now = now or datetime.now(IST)
        start, end = self.window(kind, now)
        v = self.acct_view()
        return report_dataset(self.st.s, start, end, open_trade=self.st.s.get("open"),
                              unrealised=v["unrealised"])

    def summary(self, kind, now=None):
        s = self.st.s; v = self.acct_view(); start, end = self.window(kind, now)
        ds = report_dataset(s, start, end, open_trade=s.get("open"), unrealised=v["unrealised"])
        bun, tot = ds["bun"], ds["totals"]
        b = bun["bucket"]
        tp, sl, sysn = tot["tp"], tot["sl"], tot["force"]
        pips, real, vol = tot["pips"], tot["real"], tot["volume"]
        t = s["open"]; inwin = ds["inwin"]
        unr, net, wr = tot["unr"], tot["net"], tot["wr"]
        t0, t1 = start.timestamp(), end.timestamp()
        secs = t1 - t0
        dur = f"{round(secs / 3600)} hrs" if secs <= 86400 + 60 else f"{round(secs / 86400)} days"
        tf = lambda d: d.strftime("%d %b %Y").upper() + " ⌛ Time: " + d.strftime("%I %p").lstrip("0").lower() + " ist"
        title = "ALL TIME" if kind == "alltime" else kind.upper()
        L = [f"📊 <b>{title} SUMMARY</b>", f"🔴 <b>{html.escape(self.report_title())}</b>", "",
             f"✅ <b>Start</b> {tf(start)}", f"📌 <b>END</b> {tf(end)}", f"🕰️ <b>Duration:</b> {dur}",
             "", "📌 <b>Result</b>", f"✅ <b>TP:</b> {tp}", f"❌ <b>SL:</b> {sl}"]
        if sysn: L.append(f"🔒 <b>Closed by system:</b> {sysn}")
        L += [f"🎯 <b>Win rate:</b> {wr:.1f}%", f"📏 <b>Pips:</b> <b>{pips:+.1f}</b>",
              "", "💰 <b>Money</b>", f"🧾 <b>Net:</b> {fmt_money(net)}", f"📚 <b>Volume:</b> {vol:.2f} lots",
              f"✅ <b>Realised PnL:</b> {fmt_money(real)}", f"📊 <b>Unrealised PnL:</b> {fmt_money(unr)}",
              "", f"📂 <b>Open trades kept:</b> {1 if t else 0}",
              (f"#{t['id']} {t['direction']} {t['entry']:.3f}  lot {fmt_lot(t['lot'])}  float {fmt_money(v['unrealised'], False)}"
               if t else "No open trade right now."),
              "", "💼 <b>Account since start</b>", "━━━━━━━━━━━━━━", ""] + self.account_lines(v)
        L += [""] + self.insight_lines(bun, start, end, kind) + [""] + self.perf_lines(v)
        return "\n".join(L)

    def start_balance(self):
        return float(self.st.s.get("start_balance") or self.cfg.get("start_balance", START_BALANCE))

    def insight_lines(self, bun, start, end, kind):
        """Short analysis block for this report window (~6-8 lines) plus this period's SL streak levels."""
        b = bun["bucket"]; days = max((end - start).total_seconds() / 86400, 1 / 24)
        pf = "∞" if bun["pf"] == float("inf") else f"{bun['pf']:.2f}"
        tpd = (b["trades"] / days) if days else 0.0
        mark = ""
        if b["win_n"] + b["loss_n"]:
            mark = " ✅" if bun["winrate"] >= bun["be_winrate"] else " ⚠️"
        def daylab(k):
            if not k: return "—"
            d = datetime.fromisoformat(k).strftime("%d %b").upper()
            return f"{d} {fmt_money(bun['day_net'][k], False)}"
        L = ["🔎 <b>Insights</b>",
             f"📈 <b>Avg win:</b> {fmt_money(bun['avg_win'], False)}  ·  📉 <b>Avg loss:</b> -${bun['avg_loss']:,.2f}",
             f"🏋️ <b>Profit factor:</b> {pf}  ·  🎲 <b>Expectancy:</b> {fmt_money(bun['expectancy'], False)}/trade · {fmt_money(bun['exp_lot'], False)}/lot",
             f"💸 <b>Net after spread:</b> {fmt_money(b['net'])}  ·  <b>Gross:</b> {fmt_money(bun['gross'])}  ·  Spread -${b['spread']:,.2f}",
             f"⚖️ <b>Break-even WR:</b> {bun['be_winrate']:.1f}% vs actual {bun['winrate']:.1f}%{mark}",
             f"📦 <b>Largest lot:</b> {fmt_lot(b['max_lot'] or 0)}  ·  📚 <b>Trades/day:</b> {tpd:.1f}",
             f"🏆 <b>Best day:</b> {daylab(bun['best_day'])}  ·  💀 <b>Worst day:</b> {daylab(bun['worst_day'])}"]
        L += format_streak_level_lines(bun["levels"], "🧱 <b>SL streak levels (period):</b>")
        return L

    def perf_lines(self, v, hs=None):
        """All-time performance. Net PnL accounts for each 5000 wipe-reset. SL levels use final-length counts."""
        s = self.st.s; sb = self.start_balance()
        run = int(time.time() - (s.get("created") or time.time()))
        d_, r_ = divmod(run, 86400); h_, r_ = divmod(r_, 3600)
        net, injected, pct = economic_net(v["equity"], sb, v["wipes"])
        ends, cur, mx = replay_streaks(s.get("hist_agg"), s.get("history") or [])
        # live streak (open trade or last close) wins if it is at least the replayed run
        cur = max(cur, int(s.get("streak") or 0))
        lv = streak_levels_from(ends, cur, include_current=True)
        lots_pnl = round(float((s.get("hist_agg") or {}).get("net") or 0) + sum(h.get("net") or 0 for h in (s.get("history") or [])), 2)
        pips_life = s.get("pips_total")
        if pips_life is None:
            pips_life = round(float((s.get("hist_agg") or {}).get("pips") or 0) + sum(h.get("pips") or 0 for h in (s.get("history") or [])), 1)
        L = ["📈 <b>PERFORMANCE</b>", "━━━━━━━━━━━━━━━━━━━━",
             f"⏳ <b>Running:</b> {d_}d {h_}h {r_ // 60}m (since start/reset)"]
        L += run_days_lines(s.get("created"))
        L += [f"🏁 <b>Start balance:</b> ${sb:,.2f}"]
        if v["wipes"]:
            L.append(f"💸 <b>Capital in:</b> ${injected:,.2f} (start + {v['wipes']} × ${WIPE_BALANCE:,.0f} reset)")
        L += [f"📉 <b>Max drawdown:</b> -${v['max_dd']:,.2f} ({v['max_dd_pct']:.2f}%)",
              f"💹 <b>Net PnL:</b> {fmt_money(net)} ({pct:+.2f}%)",
              f"📏 <b>Pips (lifetime):</b> {pips_life:+.1f}",
              f"💵 <b>$ on actual lots:</b> {fmt_money(lots_pnl)}"]
        L += format_streak_level_lines(lv, "🧱 <b>SL streak levels:</b>")
        return L

    REPORT_RENDER_TIMEOUT = 120

    def post_report(self, kind, images=True, pin=True, track=True):
        """Post the report to this channel (v10b): PnL image page(s) FIRST (album), THEN the summary text as a
        reply to the album's first message. Daily: NOT pinned. Weekly / monthly: the TEXT is pinned (silently).
        Fail-safe: a render / send error or timeout never blocks the text (it is then posted without reply)."""
        pend = self._pending_mark(kind) if track else None
        first_id = None
        try:
            if images and kind in ("daily", "weekly", "monthly"):
                first_id = self._send_report_images_safe(self.cid, kind)
        except Exception:
            log.exception("[%s] report images %s", self.key, kind); first_id = None
        m = None
        try:
            self.tg.ambiguous = False
            m = self.tg.send(self.cid, self.summary(kind), reply_to=first_id, markup=self.btn)
            if not m and first_id and not self.tg.ambiguous:      # reply refused for any reason -> plain text
                m = self.tg.send(self.cid, self.summary(kind), markup=self.btn)
        except Exception:
            log.exception("[%s] report text %s", self.key, kind)
        if track:
            if isinstance(m, dict) or self.tg.ambiguous: self._pending_clear(kind)     # delivered (or maybe): never resend
            else: self._pending_fail(kind, pend)
        if pin and isinstance(m, dict) and kind in ("weekly", "monthly"):
            pins = self.st.s.setdefault("pins", {"daily": [], "weekly": [], "monthly": []})
            try:
                self.tg.call("pinChatMessage", {"chat_id": self.cid, "message_id": m["message_id"], "disable_notification": "true"}, tries=3, timeout=15)
                with self.st.lock:
                    pins.setdefault(kind, []).append(m["message_id"]); pins[kind] = pins[kind][-50:]; self.st.save()
            except Exception: log.exception("[%s] pin %s", self.key, kind)
        return m

    # ---- crash-safe report text: a restart mid-post re-sends the TEXT once (images skipped) ----
    def _pending_mark(self, kind):
        try:
            with self.st.lock:
                p = self.st.s.setdefault("rep_pending", {})
                rec = p.get(kind) if isinstance(p.get(kind), dict) else {"ts": time.time(), "tries": 0}
                p[kind] = rec; self.st.save()
            return rec
        except Exception:
            log.exception("[%s] pending mark", self.key); return None
    def _pending_clear(self, kind):
        try:
            with self.st.lock:
                if (self.st.s.get("rep_pending") or {}).pop(kind, None) is not None: self.st.save()
        except Exception: log.exception("[%s] pending clear", self.key)
    def _pending_fail(self, kind, rec):
        try:
            with self.st.lock:
                p = self.st.s.setdefault("rep_pending", {})
                r = p.get(kind) or rec or {"ts": time.time(), "tries": 0}
                r["tries"] = int(r.get("tries") or 0) + 1
                if r["tries"] >= 3: p.pop(kind, None); log.error("[%s] %s report text failed 3x — dropped", self.key, kind)
                else: p[kind] = r
                self.st.save()
        except Exception: log.exception("[%s] pending fail", self.key)
    def retry_pending_reports(self, max_age=6 * 3600):
        """Called by the scheduler: a report whose text never went out (crash / restart / network) is sent text-only."""
        p = self.st.s.get("rep_pending") or {}
        for kind in list(p):
            r = p.get(kind) or {}
            if kind not in ("daily", "weekly", "monthly") or time.time() - float(r.get("ts") or 0) > max_age:
                self._pending_clear(kind); continue
            if time.time() - float(r.get("last_try") or 0) < 60: continue
            with self.st.lock: r["last_try"] = time.time()
            log.warning("[%s] %s report text pending -> re-sending text only", self.key, kind)
            self.post_report(kind, images=False)

    def _render_pngs_safe(self, kind, now=None, timeout=None):
        """Render in a worker thread with a timeout; returns PNG bytes list ([] on error / timeout)."""
        box = {}
        def work():
            try:
                ds = self.report_data(kind, now)
                box["pngs"] = (_render_report_dataset(ds, period=kind) or {}).get("pngs") or []
            except Exception as e:
                box["err"] = e; log.exception("[%s] PnL image render failed for %s", self.key, kind)
        th = threading.Thread(target=work, daemon=True, name=f"render-{self.key}-{kind}"); th.start()
        th.join(timeout or self.REPORT_RENDER_TIMEOUT)
        if th.is_alive():
            log.error("[%s] PnL image render timed out for %s", self.key, kind); return []
        return box.get("pngs") or []

    def _send_report_images_safe(self, chat, kind, now=None):
        """Render and send PnL image page(s). Never raises; logs on failure.
        Returns the first sent message id (int) or None."""
        if kind not in ("daily", "weekly", "monthly"):
            return None
        try:
            pngs = self._render_pngs_safe(kind, now)
            if not pngs:
                log.warning("[%s] PnL image produced no pages for %s", self.key, kind)
                return None
            self.tg.ambiguous = False
            msgs = self.tg.media_group(chat, pngs)
            first = None
            if isinstance(msgs, list) and msgs and isinstance(msgs[0], dict):
                first = msgs[0].get("message_id")
            elif not self.tg.ambiguous:
                # fallback: send pages one by one (not after a timeout: the album may have arrived)
                for i, img in enumerate(pngs):
                    m = self.tg.photo(chat, img)
                    if isinstance(m, dict):
                        if first is None: first = m.get("message_id")
                    else:
                        log.error("[%s] PnL image page %d send failed", self.key, i + 1)
                        if self.tg.ambiguous: break
            if first is not None and str(chat) == str(self.cid):
                self._note_report_images(kind, len(pngs))
            return first
        except Exception:
            log.exception("[%s] PnL image render/send failed for %s — text still goes out", self.key, kind)
            return None
        finally:
            pngs = None

    def _note_report_images(self, kind, pages):
        """Counter for the admin 📊 Reports view (channel posts only; admin previews never count)."""
        try:
            with self.st.lock:
                r = self.st.s.setdefault("rep_img", {})
                k = r.setdefault(kind, {"posts": 0, "pages": 0, "last": None})
                k["posts"] = int(k.get("posts") or 0) + 1
                k["pages"] = int(k.get("pages") or 0) + int(pages or 0)
                k["last"] = time.time()
                self.st.save()
        except Exception:
            log.exception("[%s] note report images", self.key)

    def preview_data(self, kind, now=None):
        """In-progress period for the admin preview: from the last 1 PM IST cutoff (daily) / last weekly
        boundary (weekly) up to now. Same row/total rules as the scheduled report (report_dataset)."""
        now = now or datetime.now(IST)
        anchor = self.st.s.get("rep_anchor")
        start = preview_start(kind, now, anchor)
        born = self.st.s.get("created")
        if born:
            born_dt = datetime.fromtimestamp(born, IST).replace(second=0, microsecond=0)
            if start < born_dt: start = min(born_dt, now)
        v = self.acct_view()
        return report_dataset(self.st.s, start, now, open_trade=self.st.s.get("open"), unrealised=v["unrealised"])

    def _admin_preview(self, uid, ch, kind):
        """Background: render the in-progress daily / weekly report image and show it in the admin DM only."""
        try:
            ds = ch.preview_data(kind)
            res = _render_report_dataset(ds, period=kind)
            pngs = res.get("pngs") or []
            ok = bool(pngs) and ch.tg.media_group(uid, pngs)
            tot = ds["totals"]
            fr = ds["start"].strftime("%a %d %b %I:%M %p").replace(" 0", " ")
            note = "\n".join([f"👁 <b>PREVIEW · {kind.upper()} · {html.escape(ch.key)}</b>", SEP_,
                               f"🕐 <b>From:</b> {fr} IST (last {'1 PM cutoff' if kind == 'daily' else 'weekly boundary'}) → now",
                               f"📨 <b>Signals:</b> {tot['total']} · ✅ {tot['tp']} · ❌ {tot['sl']}",
                               f"📏 <b>Pips:</b> {tot['pips']:+.1f} · 💰 <b>Net:</b> {fmt_money(tot['net'], False)}",
                               "🔒 Shown here only — nothing posted to the channel."])
            ch.tg.send(uid, note if ok else "❌ Preview image failed — check the log.")
        except Exception:
            log.exception("[%s] admin preview failed for %s", getattr(ch, "key", "?"), kind)
            try: ch.tg.send(uid, "❌ Preview image failed — check the log.")
            except Exception: pass

    def reports_text(self, now=None):
        """📊 Reports section for one channel: total PnL, images sent, next scheduled sends (IST)."""
        now = now or datetime.now(IST)
        s = self.st.s; v = self.acct_view()
        net, injected, pct = economic_net(v["equity"], self.start_balance(), v["wipes"])
        pips_life = s.get("pips_total")
        if pips_life is None:
            pips_life = round(float((s.get("hist_agg") or {}).get("pips") or 0) + sum(h.get("pips") or 0 for h in (s.get("history") or [])), 1)
        anchor = s.get("rep_anchor")
        nxt = next_report_times(now, s.get("sent") or {}, anchor)
        def when(dt):
            if dt is None: return "— (cycle not started)"
            if dt <= now: return "due now (next loop)"
            return dt.strftime("%a %d %b %Y · %I:%M %p").replace(" 0", " ") + " IST"
        ri = s.get("rep_img") or {}
        def img_line(k):
            r = ri.get(k) or {}
            last = r.get("last")
            return (f"<b>{k.title()}:</b> {int(r.get('posts') or 0)} post(s) · {int(r.get('pages') or 0)} image(s)"
                    + (f" · last {datetime.fromtimestamp(last, IST).strftime('%d %b %I:%M %p').replace(' 0', ' ')}" if last else ""))
        L = [f"📊 <b>REPORTS · {html.escape(self.key)} · {html.escape(self.cname)}</b>", SEP_, "",
             "💹 <b>TOTAL PnL (since start)</b>", SEP_,
             f"💰 <b>Net PnL:</b> {fmt_money(net)} ({pct:+.2f}%)", f"📏 <b>Pips:</b> {pips_life:+.1f}",
             f"💵 <b>Balance:</b> ${v['balance']:,.2f} · <b>Equity:</b> ${v['equity']:,.2f}", "",
             "⏳ <b>CURRENT PERIOD (so far)</b>", SEP_]
        for k in ("daily", "weekly", "monthly"):
            try:
                t = self.preview_data(k, now)["totals"]
                L.append(f"<b>{k.title()}:</b> {t['total']} sig · {t['pips']:+.1f} pips · {fmt_money(t['net'], False)}")
            except Exception:
                L.append(f"<b>{k.title()}:</b> —")
        L += ["", "🖼 <b>IMAGES SENT TO CHANNEL</b> (since v10)", SEP_] + [img_line(k) for k in ("daily", "weekly", "monthly")]
        wn, mn = int((s.get("sent") or {}).get("weekly_n") or 0), int((s.get("sent") or {}).get("monthly_n") or 0)
        L += [f"🧾 <b>Text reports:</b> weekly {wn} · monthly {mn} · last daily {(s.get('sent') or {}).get('daily') or '—'}", "",
              "⏭ <b>NEXT SCHEDULED SEND</b>", SEP_,
              f"📅 <b>Daily:</b> {when(nxt['daily'])}", f"📅 <b>Weekly:</b> {when(nxt['weekly'])}", f"📅 <b>Monthly:</b> {when(nxt['monthly'])}"]
        if self.key != "SRC" and not s.get("signals"):
            L.append("⚠️ No signals yet on this channel — scheduled reports are skipped until it activates.")
        L += ["", "🖼 Daily / weekly preview = from the last 1 PM IST cutoff to now (admin chat only)."]
        return "\n".join(L)

    def _admin_send_pnl(self, uid, ch, kind):
        """Background: render PnL images and send them to the admin DM, never the channel."""
        try:
            ok = ch._send_report_images_safe(uid, kind)
            if not ok:
                ch.tg.send(uid, "❌ PnL image failed — check the log. The text summary is unchanged.")
        except Exception:
            log.exception("[%s] admin PnL image failed for %s", getattr(ch, "key", "?"), kind)
            try: ch.tg.send(uid, "❌ PnL image failed — check the log.")
            except Exception: pass

    def account_lines(self, v):
        s = self.st.s
        return ["💼 <b>Account</b>", f"💵 <b>Balance:</b> <b>${v['balance']:,.2f}</b>", f"📈 <b>Equity:</b> <b>${v['equity']:,.2f}</b>",
                f"✅ <b>Realised PnL:</b> {fmt_money(v['realised'])}", f"📊 <b>Unrealised PnL:</b> {fmt_money(v['unrealised'])}",
                f"🏦 <b>Margin used:</b> <b>${v['margin']:,.2f}</b>", f"⚖️ <b>Leverage:</b> 1:{LEVERAGE}", "",
                "⚙️ <b>Setup</b>", f"📦 <b>Lot (next):</b> {fmt_lot(s['lot'])}",
                f"⚠️ <b>SL Streak:</b> {s['streak']} · <b>Max streak:</b> {s['max_streak']}",
                f"💸 <b>Spread rule:</b> ${SPREAD_PER_001:.2f} / 0.01", f"💸 <b>Total spread:</b> <b>${v['spread']:,.2f}</b>",
                f"📚 <b>Total volume:</b> {v['volume']:.2f} lots",
                f"📉 <b>Max DD:</b> <b>-${v['max_dd']:,.2f}</b> ({v['max_dd_pct']:.2f}%)",
                f"🎯 <b>Win rate:</b> {v['winrate']:.1f}% ({v['wins']}W/{v['losses']}L)",
                f"📨 <b>Signals:</b> {s.get('signals', 0)} · ⏭ <b>Skipped:</b> {s.get('skipped', 0)}",
                f"📂 <b>Open:</b> {1 if s['open'] else 0} · 🔒 <b>Closed:</b> {v['trades']}", f"💥 <b>Wipes:</b> {v['wipes']}"]

    def chart_lines(self):
        c = self.chart._roll(); ty = c.get("types", {})
        sett = chart_settings(self.st.s)
        return [f"🧮 <b>Charts today (UTC):</b> {c.get('generated', 0)} · ok {c.get('local', 0)} · failed {c.get('failed', 0)}",
                f"🗂 <b>By type:</b> signal {ty.get('signal', 0)} · TP {ty.get('TP', 0)} · SL {ty.get('SL', 0)} · closed {ty.get('FORCE', 0) + ty.get('STOPOUT', 0)}",
                f"🖼 <b>This channel:</b> {'ON' if sett['on'] else 'OFF'} · {sett['theme']} · {sett['tf']}m · {sett['measure']} · wm {'on' if sett['wm'] else 'off'}",
                f"🕯 <b>Stored 1m candles:</b> {len(self.candles_buf())}"]

    def candles_buf(self):
        return self.chart.candles_src.get()

    def milestone_anchor(self):
        s = self.st.s
        return float(s.get("rep_anchor") or s.get("armed_at") or s.get("created") or time.time())

    def milestone_snapshot(self, now=None):
        v = self.acct_view(); s = self.st.s
        sb = self.start_balance()
        net, injected, pct = economic_net(v["equity"], sb, v["wipes"])
        ends, cur, mx = replay_streaks(s.get("hist_agg"), s.get("history") or [])
        cur = max(cur, int(s.get("streak") or 0))
        lv = streak_levels_from(ends, cur, include_current=True)
        trades = int((s.get("hist_agg") or {}).get("closed") or 0) + len(s.get("history") or [])
        vol = v["volume"]
        return dict(ts=now or time.time(), balance=round(v["balance"], 2), equity=round(v["equity"], 2),
                    net=net, pct=round(pct, 2), max_dd=v["max_dd"], max_dd_pct=v["max_dd_pct"],
                    trades=trades, winrate=round(v["winrate"], 1), volume=round(vol, 2),
                    wipes=v["wipes"], max_streak=max(int(s.get("max_streak") or 0), mx, cur),
                    streak=cur, levels=lv, injected=injected)

    def milestone_message(self, key, days, label, snap, kind="milestone"):
        """Standalone message for one completed duration (never edited later)."""
        link = self.channel_link() or self.chan_link()
        anchor = self.milestone_anchor()
        sb = self.start_balance()
        when = datetime.fromtimestamp(snap["ts"], IST).strftime("%d %b %Y %I:%M %p") + " IST"
        start = datetime.fromtimestamp(anchor, IST).strftime("%d %b %Y %I:%M %p") + " IST"
        if kind == "wipe":
            head = f"💥 <b>WIPE ALERT</b>"
            reached = f"📅 <b>When:</b> {when}"
        else:
            head = f"📌 <b>MILESTONE · {html.escape(label.upper())}</b>"
            reached = f"📅 <b>Reached:</b> {when}  ·  {html.escape(label)} since start"
        L = [head, f"🔴 <b>{html.escape(self.report_title())}</b>",
             f"📢 <b>{html.escape(self.cname)}</b>  ({self.key})",
             f"🆔 <code>{self.cid}</code>"]
        if link: L.append(f"🔗 {link}")
        L += ["",
              f"🏁 <b>Start:</b> {start}  ·  ${sb:,.2f}",
              reached] + run_days_lines(anchor, snap["ts"]) + ["",
              f"💵 <b>Balance:</b> ${snap['balance']:,.2f}",
              f"📈 <b>Equity:</b> ${snap['equity']:,.2f}",
              f"💹 <b>Net PnL:</b> {fmt_money(snap['net'], False)} ({snap['pct']:+.2f}%)",
              f"📉 <b>Max DD:</b> -${snap['max_dd']:,.2f} ({snap['max_dd_pct']:.2f}%)",
              f"📦 <b>Trades:</b> {snap['trades']}  ·  🎯 <b>Win rate:</b> {snap['winrate']:.1f}%",
              f"📚 <b>Volume:</b> {snap['volume']:.2f} lots",
              f"💥 <b>Wipes:</b> {snap['wipes']}  ·  ⚠️ <b>Max SL streak:</b> {snap['max_streak']}"]
        lv = snap.get("levels") or {}
        if lv:
            L += [""] + format_streak_level_lines(lv)
        return "\n".join(L)

    def next_milestone_line(self, now=None):
        now = now or time.time()
        anchor = self.milestone_anchor()
        ms = (self.st.s.get("milestones") or {})
        sent = ms.get("sent") or {}
        for key, days, label in MILESTONES:
            if key in sent: continue
            due = anchor + days * 86400
            left = due - now
            if left <= 0: return f"📌 <b>Due now:</b> {label}"
            return f"📌 <b>Next milestone:</b> {label} in {fmt_hm(left)}"
        return "📌 <b>Milestones:</b> all durations posted"

    def _ms_state(self):
        return self.st.s.setdefault("milestones", {"msg": {}, "snapshots": {}, "wipes": [], "sent": {}})

    def _pin_dm(self, uid, mid):
        try:
            self.tg.call("pinChatMessage", {"chat_id": uid, "message_id": mid, "disable_notification": "true"}, tries=3, timeout=15)
            return True
        except Exception:
            log.exception("[%s] pin milestone for %s", self.key, uid)
            return False

    def _send_pinned_dms(self, text):
        """Send a NEW message to every admin/DM and pin it. Returns {uid: msg_id}."""
        ids = {}
        if DRY_RUN: return ids
        for uid in self.dm_recipients():
            m = self.tg.send(uid, text)
            if isinstance(m, dict) and m.get("message_id"):
                mid = m["message_id"]; ids[str(uid)] = mid
                self._pin_dm(uid, mid)
        return ids

    def fire_due_milestones(self, now=None):
        """When a duration since start completes, send a NEW pinned DM (one per channel). Catch-up after
        restart; a key already in milestones.sent is never sent again."""
        now = now or time.time()
        s = self.st.s
        ms = self._ms_state()
        sent = ms.setdefault("sent", {})
        snaps = ms.setdefault("snapshots", {})
        anchor = self.milestone_anchor()
        changed = False
        for key, days, label in MILESTONES:
            if now < anchor + days * 86400: continue
            if key in sent: continue
            snap = self.milestone_snapshot(now)
            snaps[key] = snap
            text = self.milestone_message(key, days, label, snap)
            rec = {"ts": now, "msg_ids": self._send_pinned_dms(text), "label": label, "days": days}
            sent[key] = rec
            changed = True
            log.info("[%s] milestone %s (%s) posted to %s DMs", self.key, key, label, len(rec["msg_ids"]))
        if changed:
            with self.st.lock: self.st.save()
        return changed

    def capture_due_milestones(self, now=None):
        """Back-compat name: fire any due milestone messages."""
        return self.fire_due_milestones(now)

    def sync_milestones(self, force=False):
        """Check about once a minute (scheduler is 5s). Never edits an old milestone message."""
        if DRY_RUN: return
        now = time.time()
        ms = self._ms_state()
        last = float(ms.get("last_check") or 0)
        if not force and now - last < 60: return
        try:
            self.fire_due_milestones(now)
        except Exception:
            log.exception("[%s] milestone fire", self.key)
        with self.st.lock:
            ms["last_check"] = now
            self.st.save()

    def note_wipe(self, w, t, reason):
        s = self.st.s
        ms = self._ms_state()
        dur = int(w.get("dur") or 0)
        dd_txt = f"{dur // 86400}d {dur % 86400 // 3600}h {dur % 3600 // 60}m"
        lots = float((s.get("acct") or {}).get("volume") or 0)
        rec = dict(ts=time.time(), n=w.get("n"), reason=reason, last_id=(t or {}).get("id"),
                   lots=round(lots, 2), trades=w.get("trades"), streak=w.get("streak"),
                   end_bal=w.get("end_bal"), dur=dd_txt)
        snap = {**self.milestone_snapshot(), "wipe": rec}
        text = self.milestone_message(f"wipe{w.get('n')}", 0, f"Wipe #{w.get('n')}", snap, kind="wipe")
        if rec.get("lots") is not None:
            text += f"\n📚 <b>Lots until wipe:</b> {rec['lots']:.2f}  ·  ⏳ {dd_txt}"
        with self.st.lock:
            ms.setdefault("wipes", []).append(rec)
            ms.setdefault("snapshots", {})[f"wipe{w.get('n')}"] = snap
            self.st.save()
        try:
            ids = self._send_pinned_dms(text)
            with self.st.lock:
                ms.setdefault("sent", {})[f"wipe{w.get('n')}"] = {"ts": rec["ts"], "msg_ids": ids, "label": f"Wipe #{w.get('n')}"}
                self.st.save()
        except Exception:
            log.exception("[%s] wipe milestone DM", self.key)

    def purge_milestone_dms(self, extra=None):
        """Unpin + delete previously tracked milestone DMs, plus any extra {uid: [msg_id, ...]} (e.g. leftover v3 pins)."""
        targets = {}
        for ch in self.chans.values():
            ms = (ch.st.s.get("milestones") or {})
            for uid, rec in (ms.get("msg") or {}).items():
                mid = (rec or {}).get("msg_id") if isinstance(rec, dict) else rec
                if mid: targets.setdefault(str(uid), set()).add(int(mid))
            for rec in (ms.get("sent") or {}).values():
                for uid, mid in ((rec or {}).get("msg_ids") or {}).items():
                    if mid: targets.setdefault(str(uid), set()).add(int(mid))
        for uid, mids in (extra or {}).items():
            for mid in mids: targets.setdefault(str(uid), set()).add(int(mid))
        removed = []
        for uid, mids in targets.items():
            for mid in sorted(mids):
                try:
                    self.tg.call("unpinChatMessage", {"chat_id": int(uid), "message_id": mid}, tries=2, timeout=10)
                except Exception:
                    pass
                ok = self.tg.call("deleteMessage", {"chat_id": int(uid), "message_id": mid}, tries=2, timeout=10)
                removed.append((uid, mid, bool(ok)))
                log.info("purge milestone DM uid=%s mid=%s ok=%s", uid, mid, bool(ok))
        return removed

    def fresh_start(self, keep_armed=True, balance=None):
        """Full data reset of every channel: balances, sequence, history, streaks, reports, milestones.
        Keeps 1m candles, Telegram offset, DM users and armed flag. Open trades are dropped silently (no close post)."""
        bal = START_BALANCE if balance is None else float(balance)
        armed = bool(self.st.s.get("armed")) if keep_armed else False
        # drop leftover v3 / previous milestone DMs first (best-effort), then wipe state
        try:
            self.purge_milestone_dms({1933184782: [20, 23]})
        except Exception:
            log.exception("purge old milestone DMs")
        done = self.apply_reset(list(self.chans), {"history", "sequence", "balance"}, clear_open=True, balance=bal)
        now = time.time()
        with self.st.lock:
            for ch in self.chans.values():
                s = ch.st.s
                s["open"] = None
                s["pending_close"] = None
                s["posted"] = {}
                s["created"] = now
                s["rep_anchor"] = now
                s["start_balance"] = bal
                s["hist_agg"] = empty_hist_agg()
                s["milestones"] = {"msg": {}, "snapshots": {}, "wipes": [], "sent": {}}
                s["sent"] = {}
                s["skipped"] = 0
                s["skip_keys"] = []
                s["signals"] = s["entries"] = s["tp"] = s["sl"] = s["forced"] = 0
                s["pips_total"] = 0.0
                s["max_streak"] = 0
                s["sys_closed"] = 0
                s["alerted_streak"] = 0
                s["sess_count"] = {}
                s["sess_stats"] = {"date": "", "rows": {}}
                s["acct"]["lifetime_peak"] = bal
                s["cycle"] = {"start": now, "start_balance": bal, "trades": 0, "peak": bal, "max_dd": 0.0}
            self.st.s["armed"] = armed
            self.st.s["armed_at"] = now if armed else None
            self.st.s["last_housekeep"] = 0
            self.st.s["created"] = now
            self.st.save()
        log.info("FRESH START channels=%s armed=%s balance=%s", done, armed, bal)
        return done

    def housekeep_channel(self):
        """Compact closed-trade history into aggregates; keep the last HISTORY_KEEP trades in detail."""
        s = self.st.s
        before = len(s.get("history") or [])
        rest, agg = compact_history(s.get("history") or [], s.get("hist_agg"))
        with self.st.lock:
            s["history"] = rest
            s["hist_agg"] = agg
            self.st.save()
        return before, len(rest), int(agg.get("closed") or 0)

    def housekeep_all(self, force=False):
        """24h housekeeping: compact history, rotate logs, remove leftover chart PNGs."""
        root = self if self.key == "SRC" else self.src
        s = root.st.s
        last = float(s.get("last_housekeep") or 0)
        if not force and last and time.time() - last < HOUSEKEEP_SEC - 60: return None
        sizes = {}
        try:
            sp = root.st.path
            sizes["state_before"] = os.path.getsize(sp) if os.path.exists(sp) else 0
        except Exception:
            sizes["state_before"] = 0
        results = {}
        for ch in root.chans.values():
            try: results[ch.key] = ch.housekeep_channel()
            except Exception: log.exception("housekeep %s", ch.key)
        pngs = cleanup_temp_charts(BASE_DIR)
        log_notes = rotate_bot_logs(LOG_FILE, 5_000_000, 2)
        try:
            sizes["state_after"] = os.path.getsize(root.st.path) if os.path.exists(root.st.path) else 0
        except Exception:
            sizes["state_after"] = sizes["state_before"]
        with root.st.lock:
            root.st.s["last_housekeep"] = time.time(); root.st.save()
        log.info("housekeep state %s->%s bytes charts_removed=%s logs=%s channels=%s",
                 sizes["state_before"], sizes["state_after"], pngs, log_notes, results)
        return dict(sizes=sizes, pngs=pngs, logs=log_notes, channels=results)

    def maybe_count_rest_skip(self, now_utc):
        """Count a pending auto-signal that was not opened because the bot is in session/weekend/Friday rest."""
        s = self.st.s
        if not s.get("armed") or s.get("open"): return
        nxt = float(s.get("next_signal_at") or 0)
        if nxt and time.time() < nxt: return
        if is_weekend(now_utc):
            self.skip("wk-" + now_utc.date().isoformat()); return
        if friday_cutoff(now_utc):
            self.skip("fri-" + now_utc.date().isoformat()); return
        if SESSIONS_ENABLED and not session_key(now_utc):
            prev = s.get("last_sess") or s.get("sess_cur") or now_utc.date().isoformat()
            self.skip("rest|" + str(prev))
        elif market_closed(now_utc):          # holiday inside session hours
            self.skip("mkt-" + now_utc.date().isoformat())

    def price_stale(self, max_age=None):
        max_age = PRICE_STALE_SEC if max_age is None else max_age
        if not self.px.ts: return True
        return (time.time() - self.px.ts) > max_age

    def stale_feed_alert(self):
        """Admin alert once per stall, only while the market is open (never on weekends / breaks / holidays)."""
        if not self.px.ts: return
        now_u = datetime.now(timezone.utc)
        if market_closed(now_u): return
        lo = market_last_open(now_u); since = max(self.px.ts, lo.timestamp() + 600 if lo else 0)   # 10 min reopen grace
        age = time.time() - since
        if age < PRICE_STALE_ALERT_SEC: return
        age = time.time() - self.px.ts
        s = self.st.s
        if float(s.get("stale_alert_for") or 0) == float(self.px.ts): return      # this stall already alerted
        with self.st.lock: s["stale_alert_at"] = time.time(); s["stale_alert_for"] = float(self.px.ts); self.st.save()
        self.admin_alert(f"⚠️ <b>PRICE FEED STALE</b>\nLast quote {int(age)}s ago. New auto signals are paused until the feed recovers. Open trades still track TP/SL on the next quote.")


    def stats_text(self):
        s = self.st.s; v = self.acct_view(); now = time.time()
        t = s["open"]; q = self.px.get(max_age=30)
        cp = sum(h["pips"] for h in s["history"]); cm = round(sum(h["net"] for h in s["history"]), 2)
        lp = pips_between(t["direction"], t["entry"], close_price_for(t["direction"], *q)) if (t and q) else 0.0
        up = int(now - Health.started); d_, r_ = divmod(up, 86400); h_, r_ = divmod(r_, 3600)
        age = now - self.px.ts if self.px.ts else None
        ths = getattr(self, "threads", None)
        eng = ("ON ✅" if s.get("armed") else "WAITING /start ⏸") if (all(x.is_alive() for x in ths) if ths else True) and not self.stop.is_set() else "OFF ⛔"
        SEP = "━━━━━━━━━━━━━━━━━━━━"
        L = ["📊 <b>MARTINGALE STATS</b>", SEP,
             f"💎 <b>Pair:</b> #XAUUSD", f"⚙️ <b>Engine:</b> {eng}", f"⏱ <b>Poll:</b> {int(POLL_SEC * 1000)} ms",
             f"📅 <b>Time:</b> {datetime.now(IST):%d %b %Y %I:%M %p} IST", "",
             "📢 <b>CHANNEL</b>", SEP,
             f"💎 <b>Name:</b> {html.escape(self.cname)}", f"🆔 <b>ID:</b> <code>{self.cid}</code>",
             f"📨 <b>Signals:</b> {s.get('signals', 0)}", f"⏭ <b>Skipped:</b> {s.get('skipped', 0)}",
             f"🟢 <b>Running:</b> {1 if t else 0} / 1", "",
             "📌 <b>RESULTS</b>", SEP,
             f"✅ <b>TP:</b> {s.get('tp', 0)}", f"❌ <b>SL:</b> {s.get('sl', 0)}", f"🔒 <b>Closed by system:</b> {s.get('sys_closed', 0)}",
             f"🎯 <b>Win rate:</b> {v['winrate']:.1f}%",
             f"💹 <b>Closed:</b> {cp:+.1f} pips · {fmt_money(cm)}",
             f"📈 <b>Running PnL:</b> {lp:+.1f} pips · {fmt_money(v['unrealised'])}", "",
             "⚙️ <b>MARTINGALE</b>", SEP,
             f"📦 <b>Lot now:</b> {fmt_lot(s['lot'])}", f"⚠️ <b>Streak:</b> {s['streak']}", f"🏔 <b>Max streak:</b> {s['max_streak']}", "",
             "💼 <b>ACCOUNT</b>", SEP,
             f"💵 <b>Balance:</b> <b>${v['balance']:,.2f}</b>", f"📈 <b>Equity:</b> <b>${v['equity']:,.2f}</b>",
             f"✅ <b>Realised:</b> {fmt_money(v['realised'])}", f"📊 <b>Unrealised:</b> {fmt_money(v['unrealised'])}",
             f"🏦 <b>Margin:</b> ${v['margin']:,.2f}", f"⚖️ <b>Leverage:</b> 1:{LEVERAGE}",
             f"📉 <b>Max DD:</b> -${v['max_dd']:,.2f} ({v['max_dd_pct']:.2f}%)",
             f"📚 <b>Volume:</b> {v['volume']:.2f} lots", f"💸 <b>Spread:</b> ${v['spread']:,.2f}", f"💥 <b>Wipes:</b> {v['wipes']}", "",
             "🩺 <b>HEALTH</b>", SEP,
             f"⏳ <b>Uptime:</b> {d_}d {h_}h {r_ // 60}m",
             f"📡 <b>Quote:</b> {'OK' if (age is not None and age < 10) else 'STALE'} · {'—' if age is None else int(age)}s old",
             f"🪙 <b>Bid / Ask:</b> <code>{(self.px.bid or 0):,.3f}</code> / <code>{(self.px.ask or 0):,.3f}</code>", "🔌 <b>Source:</b> biquote.io (MT5)",
             "🖼 <b>Charts:</b> local renderer (own 1m candles, no API)",
             ] + self.chart_lines() + [
             f"⏯ <b>Next signal:</b> " + (f"trade running (#{t['id']})" if t else f"{max(0, int(s['next_signal_at'] - now))}s"),
             f"🌙 <b>Weekend:</b> {'yes' if is_weekend(datetime.now(timezone.utc)) else 'no'}",
             self.market_line(datetime.now(timezone.utc)),
             f"⚠️ <b>Errors:</b> {Health.errors}"] + ([f"🧾 <b>Last error:</b> {html.escape(Health.last)}"] if Health.errors else [])
        return "\n".join(L)

    # ---- loops ----
    def trade_loop(self):
        while not self.stop.is_set():
            try:
                self.session_tick(datetime.now(timezone.utc))
                self.age_alerts()
                if market_closed():
                    # no quotes: open trades resume TP/SL on the first quote after reopen; pending signal = rest skip
                    if self.st.s.get("armed") and not self.st.s["open"] and time.time() >= self.st.s["next_signal_at"] \
                            and not self.posting_busy():
                        self.maybe_count_rest_skip(datetime.now(timezone.utc))
                    self.beat["engine"] = time.time(); self.stop.wait(2); continue
                q = self.px.get(max_age=3)
                if q:
                    with self.op_lock:
                        t = self.st.s["open"]
                        ext = self.px.take_extremes() or dict(min_bid=q[0], max_bid=q[0], min_ask=q[1], max_ask=q[1])
                        self.sample(ext)                     # bid high/low per second (chart scale only)
                        self.track_channels(ext, q)          # forwarded / forced trades of target channels (same quote)
                        for oc in self.chans.values():       # independent 'own' channels: their own next signal
                            if oc.cfg.get("own"):
                                try: oc.own_tick(datetime.now(timezone.utc))
                                except Exception: log.exception("own tick %s", oc.key)
                        if t and not self.entry_posted(t):
                            self.retry_entry(t)                  # TP/SL never processed before Entry Achieved is posted
                        elif t:
                            r = check_hit_ext(t, ext)
                            if r: self.close_trade(r, *q)
                            else:
                                u = self.unrealised(*q)
                                with self.st.lock: self.update_dd(self.st.s["acct"]["balance"] + u)
                                if self.st.s["acct"]["balance"] + u <= 0:
                                    self.close_trade("STOPOUT", *q)  # equity <= 0 -> wipe
                        elif not self.st.s.get("armed"):
                            pass   # engine not armed yet: waiting for first admin /start
                        elif self.posting_busy():
                            self.retry_closes()                  # close message first, then the next signal
                        elif self.auto_allowed(datetime.now(timezone.utc)) and time.time() >= self.st.s["next_signal_at"]:
                            if is_weekend(datetime.now(timezone.utc)):
                                self.skip("wk-" + datetime.now(timezone.utc).date().isoformat())
                            elif self.price_stale():
                                self.stale_feed_alert()
                            else:
                                self.kickoff(); t_new = self.open_signal()
                                if not t_new and not getattr(self, "_dec_wait", False): self.skip("err-" + datetime.now(IST).strftime("%Y%m%d%H%M"))
                                else: self.forward(t_new)
                        elif self.st.s.get("armed"):
                            self.maybe_count_rest_skip(datetime.now(timezone.utc))
                elif self.st.s.get("armed") and time.time() >= self.st.s["next_signal_at"] and not self.st.s["open"]:
                    if not self.auto_allowed(datetime.now(timezone.utc)):
                        self.maybe_count_rest_skip(datetime.now(timezone.utc))
                    elif self.price_stale():
                        self.stale_feed_alert()
                    else:
                        self.skip("err-" + datetime.now(IST).strftime("%Y%m%d%H%M"))
            except Exception:
                log.exception("trade loop")
            self.beat["engine"] = time.time()
            self.stop.wait(min(0.1, POLL_SEC))

    def sample(self, ext):
        now = time.time(); b = getattr(self, "_smp", None)
        if b is None or now - b[0] >= 1:
            if b: self.hist.append((b[0], b[1])); self.hist.append((b[0] + 0.5, b[2]))
            self._smp = [now, ext["min_bid"], ext["max_bid"]]
        else: b[1] = min(b[1], ext["min_bid"]); b[2] = max(b[2], ext["max_bid"])

    def posting_busy(self):
        """True while any channel close message is still pending (next signal waits for it)."""
        return any(ch.st.s.get("pending_close") for ch in self.chans.values() if not ch.cfg.get("own"))

    def forward(self, t):
        """Source signal opened with source SL streak t['streak'] -> post it to every target channel whose
        activate_after <= that streak (and which has no open trade and enough balance)."""
        for ch in list(self.chans.values())[1:]:
            try:
                if ch.cfg.get("own"): continue                 # independent stream: never mirrors the source
                n = ch.cfg["activate_after"]
                if t.get("streak", 0) < n: continue
                cs = ch.st.s
                if cs.get("pending_close"): ch.flush_close()
                if cs.get("open") or cs.get("pending_close"):
                    log.info("forward %s -> %s skipped: channel trade/close still pending", t["id"], ch.key); continue
                mb = ch.cfg.get("min_balance") or 0
                if mb and cs["acct"]["balance"] < mb:
                    k = f"lowbal|{ch.key}|{datetime.now(IST).date()}"
                    if k not in self.st.s.setdefault("sent", {}):
                        with self.st.lock: self.st.s["sent"][k] = 1; self.st.save()
                        self.admin_alert(f"⚠️ <b>{ch.key} SKIPPED</b>\n━━━━━━━━━━━━━━━━━━━━\n\n<b>Balance:</b> ${cs['acct']['balance']:,.2f}\n<b>Min balance:</b> ${mb:,.2f}\n<b>Signal:</b> #{t['id']}")
                    continue
                ct = ch.open_signal(forced=False, mirror=t)
                log.info("FORWARD %s (src streak %s) -> %s as #%s lot %s", t["id"], t.get("streak"), ch.key, ct and ct["id"], ct and ct["lot"])
            except Exception:
                log.exception("forward to %s", ch.key)

    def track_channels(self, ext, q):
        """Target channels: Entry gate, independent TP/SL on the SAME extremes for unlinked trades, stop-out."""
        st = self.st.s.get("open")
        for ch in list(self.chans.values())[1:]:
            try:
                ct = ch.st.s.get("open")
                if not ct: continue
                if not ch.entry_posted(ct): ch.retry_entry(ct); continue
                linked = st and ct.get("src_key") and ct["src_key"] == st.get("key")
                if not linked:
                    r = check_hit_ext(ct, ext)
                    if r: ch.close_trade(r, *q); continue
                u = ch.unrealised(*q)
                with ch.st.lock: ch.update_dd(ch.st.s["acct"]["balance"] + u)
                if ch.st.s["acct"]["balance"] + u <= 0: ch.close_trade("STOPOUT", *q)
            except Exception:
                log.exception("track %s", ch.key)

    def scheduler_loop(self):
        while not self.stop.is_set():
            try:
                if os.path.exists(FORCE_FLAG):
                    os.remove(FORCE_FLAG); log.info("force flag: %s", self.force_signal())
                if self.st.s.get("armed"):
                    self.weekend_notice(datetime.now(timezone.utc))
                    for ch in self.chans.values():          # session alerts + stickers: source and Fixed only
                        if ch.key == "SRC" or ch.cfg.get("sessions"): ch.session_posts(datetime.now(timezone.utc))
                    for ch in self.chans.values():          # every channel posts its OWN reports
                        if not ch.st.s.get("rep_anchor"):
                            with ch.st.lock: ch.st.s["rep_anchor"] = time.time(); ch.st.save()
                            log.info("[%s] report cycle starts %s", ch.key, datetime.now(IST).strftime("%d %b %H:%M IST"))
                        if ch.key != "SRC" and not ch.st.s.get("signals"): continue   # never-activated channel: no empty summaries
                        try:
                            ch.retry_pending_reports()
                            for kind, sk, val in due_reports(datetime.now(IST), ch.st.s["sent"], ch.st.s.get("rep_anchor")):
                                with ch.st.lock: ch.st.s["sent"][sk] = val; ch.st.save()      # marked BEFORE posting: restarts never double-post
                                log.info("[%s] %s report due -> posting", ch.key, kind)
                                ch.post_report(kind)
                        except Exception:
                            log.exception("[%s] report post", ch.key)               # one channel's error never blocks the others
                    now_i = datetime.now(IST)
                    if now_i.hour >= REPORT_HOUR and now_i.weekday() != 6 and self.st.s["sent"].get("streak_admin") != now_i.date().isoformat():
                        with self.st.lock: self.st.s["sent"]["streak_admin"] = now_i.date().isoformat(); self.st.save()
                        self.admin_alert(self.streak_text("daily"))
                    try: self.housekeep_all()
                    except Exception: log.exception("housekeep")
                    for ch in self.chans.values():
                        try: ch.sync_milestones()
                        except Exception: log.exception("milestones %s", ch.key)
                    try: self.stale_feed_alert()
                    except Exception: log.exception("stale alert")
                self.st.backup()
            except Exception:
                log.exception("scheduler loop")
            self.beat["scheduler"] = time.time()
            self.stop.wait(5)

    # ---- sessions ----
    def auto_allowed(self, now_utc):
        """Auto signals: only inside a session (if enabled) and below the per-session cap. Weekend handled by caller."""
        if market_closed(now_utc) and not is_weekend(now_utc): return False   # daily break / holiday: no new entry
        if friday_cutoff(now_utc): return False      # Friday evening: no new auto entries (running trade still tracked)
        if not SESSIONS_ENABLED: return True
        if is_weekend(now_utc): return True          # caller counts the weekend skip
        k = session_key(now_utc)
        if not k: return False
        if MAX_TRADES_PER_SESSION and self.st.s.get("sess_count", {}).get(k, 0) >= MAX_TRADES_PER_SESSION: return False
        return True

    def session_tick(self, now_utc):
        """Detect session start/end. End -> cancel pending delay + swap alert if a trade is open.
        Start -> first auto trade random DELAY_RANGE after the session start."""
        if not SESSIONS_ENABLED: return
        k = session_key(now_utc)
        with self.st.lock:
            s = self.st.s
            if k == s.get("sess_cur"): return
            prev = s.get("sess_cur"); s["sess_cur"] = k
            if k and prev and "|" in prev: s["last_sess"] = prev
            if k:
                s["next_signal_at"] = time.time() + random.randint(*DELAY_RANGE)
                log.info("session start %s -> first signal in %ss", k, int(s["next_signal_at"] - time.time()))
            else:
                s["next_signal_at"] = 0                       # pending 2-5 min delay cancelled
                if prev and "|" in prev: s["last_sess"] = prev
                log.info("session end (%s) -> no-session window, pending delay cancelled", prev)
            self.st.save(); t = s["open"]
        if not k and t and s.get("armed") and s.get("swap_alerted") != f"{t['id']}|{now_utc.date()}":
            with self.st.lock: s["swap_alerted"] = f"{t['id']}|{now_utc.date()}"; self.st.save()
            self.admin_alert(self.swap_text(t, now_utc))

    def swap_text(self, t, now_utc):
        sw = swap_estimate(t["direction"], t["lot"], now_utc); ns = next_session(now_utc)
        return "\n".join([
            "🌙 <b>NO ACTIVE SESSION</b>", "━━━━━━━━━━━━━━━━━━━━",
            f"⚠️ Overnight position may incur swap ≈ <b>-${sw:,.2f}</b> <i>(estimate)</i>",
            f"🆔 <b>Trade:</b> #{t['id']} {t['direction']} · lot {fmt_lot(t['lot'])}",
            f"⏰ <b>Open for:</b> {fmt_hm(time.time() - t['opened'])}",
            f"💱 <b>Swap rate:</b> ${SWAP_PER_001_LOT_LONG if t['direction'] == 'BUY' else SWAP_PER_001_LOT_SHORT:.2f} / 0.01 lot / night"
            + (" · x3 Wednesday" if now_utc.weekday() == SWAP_TRIPLE_WEEKDAY else ""),
            f"⏯ <b>Next session:</b> {ns[0]} {ns[1].astimezone(IST):%I:%M %p} IST" if ns else "",
            "", "▶️ Trade stays open; TP/SL still tracked."]).replace("\n\n\n", "\n\n")

    def age_alerts(self):
        t = self.st.s["open"]
        if not t: return
        hrs = (time.time() - t["opened"]) / 3600
        for h in LONG_TRADE_ALERT_HOURS:
            if hrs > h and h not in t.setdefault("age_alerts", []):
                with self.st.lock: t["age_alerts"].append(h); self.st.save()
                self.admin_alert(f"⏳ <b>LONG RUNNING TRADE</b>\n━━━━━━━━━━━━━━━━━━━━\n"
                                 f"🆔 <b>Trade:</b> #{t['id']} {t['direction']} · lot {fmt_lot(t['lot'])}\n"
                                 f"⏰ <b>Open for:</b> more than {h}h ({fmt_hm(time.time() - t['opened'])})\n"
                                 f"💰 <b>Float PnL:</b> {fmt_money(t.get('last_float', 0.0))}\n\n▶️ Bot keeps tracking TP/SL.")

    def admin_alert(self, text):
        for aid in ADMIN_IDS:
            if aid in Health.unreachable: continue     # admin never started the bot: logged once at startup
            self.tg.send(aid, text)

    def check_chats(self):
        """Startup: getChat for every admin + channel, and bot admin rights in channels. Logs + alerts a clear list."""
        bad = []
        me = self.tg.call("getMe", tries=2) or {}; my_id = me.get("id") if isinstance(me, dict) else None
        for aid in ADMIN_IDS:
            if not self.tg.call("getChat", {"chat_id": aid}, tries=2):
                Health.unreachable.add(aid); bad.append(f"👤 admin <code>{aid}</code> — has not started the bot (send /start once)")
                log.warning("startup: admin %s unreachable (chat not found) -> admin messages to it skipped", aid)
        for k, ch in self.chans.items():
            ok = self.tg.call("getChat", {"chat_id": ch.cid}, tries=2)
            if not ok:
                bad.append(f"📢 {k} <code>{ch.cid}</code> — chat not found (bot not added / wrong ID)"); Health.chat_err[ch.cid] = "chat not found"
                log.error("startup: channel %s %s unreachable (chat not found)", k, ch.cid); continue
            if my_id and not DRY_RUN:
                mm = self.tg.call("getChatMember", {"chat_id": ch.cid, "user_id": my_id}, tries=2) or {}
                if isinstance(mm, dict) and mm.get("status") not in ("administrator", "creator"):
                    bad.append(f"📢 {k} <code>{ch.cid}</code> — bot is not admin (status {mm.get('status')})")
                    log.error("startup: bot is not admin in %s %s", k, ch.cid)
        if bad:
            self.admin_alert("\n".join(["🩺 <b>STARTUP CHECK — UNREACHABLE CHATS</b>", SEP_, ""] + bad + ["", "▶️ Bot keeps running; fix and restart."]))
        else: log.info("startup: all admins and channels reachable")
        return bad

    def session_line(self, now_utc):
        ss = session_at(now_utc)
        if ss: return f"{SESSION_EMOJI.get(ss[0], '🌐')} <b>{ss[0]}</b> · {fmt_hm((ss[2] - now_utc).total_seconds())} left"
        ns = next_session(now_utc); why = "Weekend" if is_weekend(now_utc) else "No session"
        return f"🌙 <b>{why}</b> · next {ns[0]} in {fmt_hm((ns[1] - now_utc).total_seconds())} ({ns[1].astimezone(IST):%a %I:%M %p} IST)" if ns else f"🌙 {why}"

    def market_line(self, now_utc):
        if not market_closed(now_utc): return "🟢 <b>Market:</b> OPEN"
        ro = market_reopen(now_utc)
        why = "weekend" if is_weekend(now_utc) else "daily break" if now_utc.astimezone(NY_TZ).hour == 17 else "holiday"
        return f"🔴 <b>Market:</b> CLOSED ({why})" + (f" · reopens {ro.astimezone(IST):%a %d %b %I:%M %p} IST" if ro else "")

    def dashboard(self, uid=None):
        return self._dashboard(uid)

    def channel_dash_block(self, ch):
        """One dashboard block: name, ID, invite link, account, open trade, chart settings."""
        s = ch.st.s; v = ch.acct_view(); t = s.get("open"); sett = chart_settings(s)
        sb = ch.start_balance()
        net, _inj, pct = economic_net(v["equity"], sb, v["wipes"])
        link = ch.channel_link() or ch.chan_link()
        emo = "💎" if ch.key == "SRC" else "📡"
        L = ["", f"{emo} <b>{html.escape(ch.cname)}</b>  ({ch.key})", SEP_,
             f"🆔 <b>ID:</b> <code>{ch.cid}</code>",
             f"🔗 {link}",
             run_days_short(s.get("created")),
             f"💵 <b>Balance:</b> ${v['balance']:,.2f}",
             f"📈 <b>Equity:</b> ${v['equity']:,.2f}",
             f"💹 <b>Net PnL:</b> {fmt_money(net, False)} ({pct:+.2f}%)",
             f"📂 <b>Open:</b> " + (f"#{t['id']} {t['direction']} <code>{fmt_p(t['entry'])}</code>  lot {fmt_lot(t['lot'])}  float {fmt_money(v['unrealised'], False)}" if t else "—"),
             f"📦 <b>Next lot:</b> {fmt_lot(s['lot'])}",
             f"⚠️ <b>SL Streak:</b> {s.get('streak') or 0}  ·  max {s.get('max_streak') or 0}",
             f"📨 <b>Trades:</b> {v['trades']}  ·  🎯 <b>Win rate:</b> {v['winrate']:.1f}%",
             f"📚 <b>Volume:</b> {v['volume']:.2f} lots  ·  💥 <b>Wipes:</b> {v['wipes']}",
             f"🖼 <b>Chart:</b> {'ON' if sett['on'] else 'OFF'}  ·  🎨 {sett['theme'].title()}  ·  🕯 {sett['tf']}m  ·  📏 {sett['measure'].title()}"
             + ("  ·  🖋 WM" if sett["wm"] else ""),
             ch.next_milestone_line()]
        return L

    def _dashboard(self, uid=None):
        s = self.st.s; q = self.px.get(max_age=10); now_u = datetime.now(timezone.utc)
        ths = getattr(self, "threads", None)
        eng = ("ON ✅" if s.get("armed") else "WAITING /start ⏸") if (all(x.is_alive() for x in ths) if ths else True) and not self.stop.is_set() else "OFF ⛔"
        SEP = "━━━━━━━━━━━━━━━━━━━━"; self.sess_row("OUTSIDE"); rows = s["sess_stats"]["rows"]
        L = ["📊 <b>ADMIN DASHBOARD</b>", SEP, f"⚙️ <b>Engine:</b> {eng}",
             f"💰 <b>Gold:</b> " + (f"<code>{q[0]:,.2f}</code> / <code>{q[1]:,.2f}</code>" if q else "n/a"),
             self.market_line(now_u),
             f"🕒 <b>Time:</b> {datetime.now(IST):%d %b %I:%M %p} IST", "",
             "🌐 <b>SESSION</b>", SEP, self.session_line(now_u) if SESSIONS_ENABLED else "24/5 (sessions disabled)", ""]
        L += [f"📅 <b>TODAY</b> ({now_u:%d %b} UTC)", SEP]
        tot = {"signals": 0, "tp": 0, "sl": 0, "pips": 0.0, "money": 0.0}
        for name in [n for n, _, _ in SESSIONS] + ["OUTSIDE"]:
            r = rows.get(name, {"signals": 0, "tp": 0, "sl": 0, "pips": 0.0, "money": 0.0})
            for k in tot: tot[k] += r[k]
            if name == "OUTSIDE" and not r["signals"] and not (r["tp"] + r["sl"]): continue
            L.append(f"{SESSION_EMOJI.get(name, '🌐')} <b>{name.title()}:</b> {r['signals']} sig · {r['tp']} TP · {r['sl']} SL · {r['pips']:+.1f} pips · {fmt_money(r['money'], False)}")
        n = tot["tp"] + tot["sl"]
        L += ["", f"📨 <b>Signals:</b> {tot['signals']}", f"✅ <b>TP:</b> {tot['tp']}", f"❌ <b>SL:</b> {tot['sl']}",
              f"🎯 <b>Win rate:</b> {(tot['tp'] / n * 100 if n else 0):.1f}%", f"📏 <b>Pips:</b> {tot['pips']:+.1f}",
              f"💰 <b>PnL:</b> {fmt_money(round(tot['money'], 2))}", ""]
        d24 = dur_stats([h for h in s["history"] if h["closed"] >= time.time() - 86400]); dlt = dur_stats(s["history"])
        L += ["⏱ <b>TRADE DURATION</b>", SEP,
              f"🕐 <b>24h:</b> avg {d24['avg']} · TP {d24['tp']} · SL {d24['sl']} ({d24['n']} trades)",
              f"♾ <b>Lifetime:</b> avg {dlt['avg']} · TP {dlt['tp']} · SL {dlt['sl']} ({dlt['n']} trades)"]
        for ch in self.chans.values():
            L += ch.channel_dash_block(ch) if ch is not self else self.channel_dash_block(ch)
        return "\n".join(L)

    def channels_block(self):
        L = []
        for ch in self.chans.values():
            L += self.channel_dash_block(ch)
        return L

    def dm_recipients(self):
        ids = []; self_id = _bot_user_id()
        for x in list(ADMIN_IDS) + [int(k) for k in (self.src.st.s.get("kb_ver") or {}) if str(k).lstrip("-").isdigit()] + list(self.src.st.s.get("dm_users") or []):
            try: n = int(x)
            except (TypeError, ValueError): continue
            if n == self_id or n in Health.unreachable or n in ids: continue
            # skip chats that already 403'd (e.g. a bot cannot DM itself)
            err = str(Health.chat_err.get(n) or "")
            if "403" in err or "can't send messages to the bot" in err: continue
            ids.append(n)
        return ids or [i for i in ADMIN_IDS if i != self_id]

    def entry_posted(self, t):
        return "entry" in self.st.s.get("posted", {}).get(t.get("key", t["id"]), {})

    def mark_entry(self, t):
        """Record entry as achieved without sending a channel message. Unlocks TP/SL tracking."""
        key = t.get("key", t["id"])
        with self.st.lock:
            ev = self.st.s.setdefault("posted", {}).setdefault(key, {})
            if "entry" not in ev:
                ev["entry"] = 0
                posted = self.st.s["posted"]
                for k in list(posted)[:-500]: posted.pop(k)
                self.st.save()
        return True

    def retry_entry(self, t):
        """If entry was not marked (crash mid-open / legacy), mark it without sending a message."""
        if self.entry_posted(t): return
        self.mark_entry(t)
        if self.key == "SRC": self.px.take_extremes()
        log.info("[%s] entry marked for #%s (no Entry Achieved message)", self.key, t["id"])

    # ---- TP/SL ranges ----
    def range_text(self, note=None):
        s = self.st.s; tr, sr = s.get("tp_range") or list(TP_RANGE), s.get("sl_range") or list(SL_RANGE)
        feas = ranges_feasible(tuple(tr), tuple(sr))
        valid = [x for x in range(sr[0], sr[1] + 1) if tr[0] <= int(x * TP_SL_RATIO + 0.5) <= tr[1]]
        L = ["🎯 <b>TP / SL RANGES</b>", "━━━━━━━━━━━━━━━━━━━━",
             f"🎯 <b>TP range:</b> {tr[0]}–{tr[1]} pips", f"🛑 <b>SL range:</b> {sr[0]}–{sr[1]} pips",
             f"⚖️ <b>Rule:</b> SL random in range · TP = round(SL × {TP_SL_RATIO:g})",
             (f"✅ <b>Usable SL:</b> {valid[0]}–{valid[-1]} → TP {int(valid[0] * TP_SL_RATIO + 0.5)}–{int(valid[-1] * TP_SL_RATIO + 0.5)}" if feas
              else "⚠️ <b>Impossible:</b> no SL gives a TP inside the TP range — TP is clamped to the range until fixed."), "",
             "✏️ <b>Change:</b> send", "<code>/TP 45-55</code>", "<code>/SL 60-70</code>"]
        if note: L = [note, ""] + L
        return "\n".join(L)

    def set_range(self, which, arg):
        import re as _re
        m = _re.fullmatch(r"(\d{1,4})\s*[-–]\s*(\d{1,4})", arg or "")
        if not m: return f"❌ Format: <code>/{which} 40-60</code>"
        a, b = int(m.group(1)), int(m.group(2))
        if not (1 <= a <= b <= 2000): return "❌ Range must be 1–2000 pips and min ≤ max."
        k = "tp_range" if which == "TP" else "sl_range"
        with self.st.lock: self.st.s[k] = [a, b]; self.st.save()
        ok = ranges_feasible(tuple(self.st.s["tp_range"]), tuple(self.st.s["sl_range"]))
        log.info("range %s set to %s-%s feasible=%s", which, a, b, ok)
        return f"✅ <b>{which} range saved:</b> {a}–{b}" + ("" if ok else f"\n⚠️ <b>Warning:</b> with these ranges TP = round(SL×{TP_SL_RATIO:g}) can never fall inside the TP range.")

    # ---- session channel posts ----
    def session_summary(self, key):
        """Stats of a finished session (trades opened inside its window)."""
        name, st_, en_ = session_window(key); a, b = st_.timestamp(), en_.timestamp()
        hs = [h for h in self.st.s["history"] if a <= h.get("opened", 0) < b]
        t = self.st.s["open"]; sig = len(hs) + (1 if t and a <= t["opened"] < b else 0)
        hs_ = [h for h in hs if h.get("reason") != "FORCE"]
        tp = sum(1 for h in hs_ if h["net"] > 0); sl = len(hs_) - tp; run = mx = 0
        for h in sorted(hs_, key=lambda h: h["closed"]):
            run = run + 1 if h["net"] <= 0 else 0; mx = max(mx, run)
        return dict(name=name, start=st_, end=en_, signals=sig, tp=tp, sl=sl, wr=(tp / len(hs) * 100 if hs else 0), max_streak=mx,
                    avg=dur_stats(hs)["avg"], lots=round(sum(h["lot"] for h in hs), 2),
                    pips=round(sum(h["pips"] for h in hs), 1), money=round(sum(h["net"] for h in hs), 2))

    def pre_session_text(self, name, st_, en_):
        ist = lambda d: d.astimezone(IST).strftime("%I:%M %p")
        L = ["⏰🔔 <b>SESSION STARTING IN 10 MINUTES - BE READY</b> 🚀", "━━━━━━━━━━━━━━━━━━━━",
             f"{SESSION_EMOJI.get(name, '🌐')} <b>Session:</b> {name}",
             f"🟢 <b>Start:</b> {ist(st_)} IST", f"🔴 <b>End:</b> {ist(en_)} IST", f"🕰️ <b>Duration:</b> {fmt_hm((en_ - st_).total_seconds())}"]
        lk = self.st.s.get("last_sess")
        if lk and session_window(lk):
            x = self.session_summary(lk)
            L += ["", f"📊 <b>LAST SESSION — {x['name']}</b>", "━━━━━━━━━━━━━━━━━━━━",
                  f"🕐 <b>Time:</b> {ist(x['start'])} – {ist(x['end'])} IST", f"🕰️ <b>Duration:</b> {fmt_hm((x['end'] - x['start']).total_seconds())}",
                  f"📨 <b>Signals:</b> {x['signals']}", f"✅ <b>TP:</b> {x['tp']}", f"❌ <b>SL:</b> {x['sl']}",
                  f"🎯 <b>Win rate:</b> {x['wr']:.1f}%", f"⚠️ <b>Max SL streak:</b> {x['max_streak']}",
                  f"⏱ <b>Avg trade duration:</b> {x['avg']}", f"📚 <b>Lots traded:</b> {x['lots']:.2f}",
                  f"📏 <b>Pips:</b> <b>{x['pips']:+.1f}</b>", f"💰 <b>PnL:</b> {fmt_money(x['money'])}"]
        L += ["", f"💎 <b>{html.escape(self.cname)}</b>"]
        return "\n".join(L)

    def running_trade_text(self, t, title):
        q = self.px.get(); cur = close_price_for(t["direction"], *q) if q else None; u = self.unrealised()
        emo = "🟢" if t["direction"] == "BUY" else "🔴"
        return "\n".join([f"<b>{title}</b>", "━━━━━━━━━━━━━━━━━", f"🆔 <b>#{t['id']}</b>", "💎 <b>Pair:</b> #XAUUSD",
                          f"🌐 <b>Direction:</b> {t['direction']} {emo}", f"📌 <b>Lot:</b> {fmt_lot(t['lot'])}",
                          f"✅ <b>Entry:</b> <code>{fmt_p(t['entry'])}</code>",
                          f"💵 <b>Live price:</b> <code>{fmt_p(cur)}</code>" if cur else "💵 <b>Live price:</b> n/a",
                          f"📏 <b>Float pips:</b> {pips_between(t['direction'], t['entry'], cur):+.1f}" if cur else "📏 <b>Float pips:</b> n/a",
                          f"💰 <b>Float PnL:</b> {fmt_money(u)}", f"⏰ <b>Running:</b> {fmt_hm(time.time() - t['opened'])}"])

    def session_posts(self, now_utc):
        """10-min pre-session post (only after a >= SESSION_GAP_MIN_HOURS break), start/closed stickers. Deduped."""
        if not SESSIONS_ENABLED or not self.st.s.get("armed"): return
        ns = next_session(now_utc)
        if ns:
            name, st_ = ns; en_ = session_window(f"{st_.date().isoformat()}|{name}")[2]
            if st_ - timedelta(minutes=PRE_SESSION_MIN) <= now_utc < st_ and gap_before(st_):
                k = f"pre|{st_.date().isoformat()}|{name}"; t = self.st.s["open"]
                if t:
                    self.post_once(k, "trade_update", lambda: self.tg.send(self.cid, self.running_trade_text(
                        t, f"📍 #XAUUSD TRADE RUNNING — {name} session starts in {PRE_SESSION_MIN} min"), reply_to=t["msg_id"], markup=self.btn))
                else:
                    self.post_once(k, "pre", lambda: self.tg.send(self.cid, self.pre_session_text(name, st_, en_), markup=self.btn))
        cur = session_at(now_utc)
        if cur and (now_utc - cur[1]).total_seconds() < 300 and gap_before(cur[1], 0.5):
            self.post_once(f"start|{cur[1].date().isoformat()}|{cur[0]}", "sticker", lambda: self.tg.sticker(self.cid, STICKER_SESSION_STARTS))
        if not cur:
            # most recent session end within 5 min, followed by a break
            for m in range(0, 5):
                prev = session_at(now_utc - timedelta(minutes=m + 1))
                if prev:
                    if (now_utc - prev[2]).total_seconds() < 300:
                        self.post_once(f"closed|{prev[1].date().isoformat()}|{prev[0]}", "sticker", lambda: self.tg.sticker(self.cid, STICKER_SESSION_CLOSED))
                    break

    def sessions_text(self):
        now_u = datetime.now(timezone.utc); SEP = "━━━━━━━━━━━━━━━━━━━━"
        ist = lambda hm: (datetime(2000, 1, 1, tzinfo=timezone.utc) + timedelta(minutes=_hm(hm))).astimezone(IST).strftime("%I:%M %p")
        L = ["🌐 <b>TRADING SESSIONS</b>", SEP, f"⚙️ <b>Enabled:</b> {'yes' if SESSIONS_ENABLED else 'no (24/5)'}",
             f"🔢 <b>Max trades / session:</b> {MAX_TRADES_PER_SESSION or 'unlimited'}", ""]
        for name, a, b in SESSIONS:
            L.append(f"{SESSION_EMOJI.get(name, '🌐')} <b>{name}:</b> {a}–{b} UTC ({ist(a)}–{ist(b)} IST)")
        L += [f"🌙 <b>No session:</b> {SESSIONS[-1][2]}–24:00 UTC (rollover / swap)", f"🗓 <b>Weekend off:</b> no new entry Fri {NO_ENTRY_FRI_UTC} UTC → Mon session; running trade stays open", "",
              f"📍 <b>Now:</b> " + self.session_line(now_u), "",
              f"💱 <b>Swap est.:</b> long ${SWAP_PER_001_LOT_LONG:.2f} · short ${SWAP_PER_001_LOT_SHORT:.2f} / 0.01 lot / night (x3 Wed)",
              f"⏳ <b>Long-trade alerts:</b> {' / '.join(str(h) + 'h' for h in LONG_TRADE_ALERT_HOURS)}",
              "📡 Force Signal works any time (outside sessions / weekend)."]
        return "\n".join(L)

    # ---- multi-channel admin views ----

    def chan_text(self):
        """Per-channel view (source + every target): rich HTML, one value per line, no duplicates."""
        s = self.st.s; a = s["acct"]; v = self.acct_view(); t = s.get("open"); n = a["wins"] + a["losses"]
        d0 = datetime.now(IST).replace(hour=0, minute=0, second=0, microsecond=0).timestamp()
        today = [h for h in s["history"] if h["closed"] >= d0]
        t_tp = sum(1 for h in today if h["reason"] == "TP"); t_sl = sum(1 for h in today if h["reason"] == "SL")
        t_sig = len(today) + (1 if t and t["opened"] >= d0 else 0)
        last = max([h["opened"] for h in s["history"][-1:]] + ([t["opened"]] if t else []), default=None)
        mx = SRC_MAX_LOT if self.key == "SRC" else (self.cfg.get("max_lot") if self.cfg.get("progression") == "martingale" else None)
        mx_hits = sum(1 for h in s["history"] if mx and h["lot"] >= mx - 1e-9)
        L = [f"{'💎' if self.key == 'SRC' else '📡'} <b>{self.key} · {html.escape(self.cname)}</b>", SEP_, "",
             "🔗 <b>CHANNEL</b>", SEP_, f"<b>Link:</b> <a href=\"{html.escape(self.channel_link() or self.chan_link())}\">open channel</a>",
             f"<b>ID:</b> <code>{self.cid}</code>", f"<b>Strategy:</b> {html.escape(self.strategy)}",
             f"<b>Chart:</b> {'ON ✅' if chart_settings(s)['on'] else 'OFF ⛔'}  ·  🎨 {chart_settings(s)['theme'].title()}  ·  🕯 {chart_settings(s)['tf']}m  ·  📏 {chart_settings(s)['measure'].title()}", ""]
        if self.cfg.get("own"):
            c = self.cfg; dr = c.get("delay_range") or DELAY_RANGE
            L += ["⚙️ <b>RULES</b>", SEP_, "<b>Signals:</b> own independent stream (not the source)",
                  f"<b>Lot:</b> fixed {fmt_lot(c['base_lot'])}", f"<b>Gap after close:</b> {dr[0] // 60}-{dr[1] // 60} min (random)",
                  f"<b>New session:</b> first signal >= {OWN_SESSION_GAP_SEC // 60} min after the last close", "<b>Sessions only</b> · market-closed aware", ""]
        elif self.key != "SRC":
            c = self.cfg; src_st = self.src.st.s["streak"]; need = c["activate_after"]
            L += ["⚙️ <b>RULES</b>", SEP_, f"<b>Activates after:</b> " + ("every source signal" if c.get("every") else f"{need} source SL"),
                  f"<b>Progression:</b> {c['progression']}", f"<b>Base lot:</b> {fmt_lot(c['base_lot'])}", f"<b>Max lot:</b> {fmt_lot(c['max_lot'])}",
                  f"<b>Min balance:</b> " + (f"${c['min_balance']:,.2f}" if c.get("min_balance") else "none"),
                  f"<b>Next trigger:</b> " + ("ACTIVE ✅ (every source signal)" if c.get("every") else f"ACTIVE ✅ (source streak {src_st} ≥ {need})" if src_st >= need
                                             else f"source needs {need - src_st} more SL (now {src_st}/{need})"), ""]
        L += ["📅 <b>TODAY</b>", SEP_, f"📨 <b>Signals today:</b> {t_sig}", f"✅ <b>TP today:</b> {t_tp}", f"❌ <b>SL today:</b> {t_sl}",
              f"🕒 <b>Last signal:</b> " + (datetime.fromtimestamp(last, IST).strftime("%d %b %H:%M IST") if last else "—"), "",
              "📌 <b>LIFETIME</b>", SEP_, f"📨 <b>Signals:</b> {s.get('signals', 0)}", f"✅ <b>TP:</b> {a['wins']}", f"❌ <b>SL:</b> {a['losses']}",
              f"🔒 <b>Closed by system:</b> {s.get('sys_closed', 0)}", f"🎯 <b>Win rate:</b> {(a['wins'] / n * 100 if n else 0):.1f}%",
              f"📏 <b>Pips:</b> {s.get('pips_total', 0.0):+.1f}", "",
              "🎲 <b>MARTINGALE</b>", SEP_, f"📦 <b>Next lot:</b> {fmt_lot(s['lot'])}", f"⚠️ <b>SL streak:</b> {s['streak']}",
              f"🏔 <b>Max streak:</b> {s['max_streak']}"] + ([f"🧱 <b>Max lot reached:</b> {mx_hits}×"] if mx else []) + ["",
              "💼 <b>ACCOUNT</b>", SEP_, f"💵 <b>Balance:</b> ${v['balance']:,.2f}", f"📊 <b>Equity:</b> ${v['equity']:,.2f}",
              f"✅ <b>Realised:</b> {fmt_money(v['realised'])}", f"⏳ <b>Unrealised:</b> {fmt_money(v['unrealised'])}", f"💥 <b>Wipes:</b> {v['wipes']}", "",
              "📂 <b>OPEN TRADE</b>", SEP_]
        if t:
            q = self.px.get(max_age=5); fp = pips_between(t["direction"], t["entry"], close_price_for(t["direction"], *q)) if q else None
            L += [f"🆔 <b>Trade:</b> #{t['id']}" + (f" (src #{t['src_id']})" if t.get("src_id") else ""),
                  f"🧭 <b>Direction:</b> {t['direction']} {'🟢' if t['direction'] == 'BUY' else '🔴'}", f"📦 <b>Lot:</b> {fmt_lot(t['lot'])}",
                  f"✅ <b>Entry:</b> <code>{fmt_p(t['entry'])}</code>", f"🎯 <b>TP:</b> <code>{fmt_p(t['tp'])}</code>", f"🛑 <b>SL:</b> <code>{fmt_p(t['sl'])}</code>",
                  f"📈 <b>Floating:</b> " + (f"{fp:+.1f} pips · {fmt_money(money_for_pips(fp, t['lot']))}" if fp is not None else "—")]
        else: L.append("No open trade.")
        return "\n".join(L)

    def streak_text(self, kind="alltime"):
        src = self.src; start, end = src.window(kind); t0, t1 = start.timestamp(), end.timestamp()
        hs = [h for h in src.st.s["history"] if t0 <= h["closed"] <= t1]; x = streak_analytics(hs)
        title = {"daily": "DAILY (24h)", "weekly": "WEEKLY (7d)", "monthly": "MONTHLY", "alltime": "ALL TIME"}[kind]
        L = [f"📈 <b>SOURCE STREAK ANALYTICS · {title}</b>", SEP_, "",
             f"📦 <b>Closed trades:</b> {x['trades'] + x['system']}", f"✅ <b>TP:</b> {x['tp']} · ❌ <b>SL:</b> {x['trades'] - x['tp']}",
             f"🔒 <b>Closed by system:</b> {x['system']} <i>(not counted as TP/SL)</i>",
             f"<b>Max SL streak:</b> {x['max']}", f"<b>Current streak:</b> {src.st.s['streak']}", "",
             "🔁 <b>SL STREAKS (ended by TP)</b>", SEP_]
        mx = max([x["max"]] + list(x["runs"]) + [1])
        L += [f"<b>{n} SL:</b> {x['runs'].get(n, 0)}×  ·  reached ≥{n}: {x['reached'].get(n, 0)}×" for n in range(1, mx + 1)]
        L += ["", "🎯 <b>TP AFTER N SL</b>", SEP_, f"<b>TP after TP (0 SL):</b> {x['tp_after'].get(0, 0)}"]
        L += [f"<b>TP after {n} SL:</b> {x['tp_after'].get(n, 0)}×  ·  recovery {x['recovery'].get(n, 0.0):.1f}%" for n in range(1, mx + 1)]
        L += ["", "<i>recovery N% = of the streaks that reached N SL, how many hit TP on the very next trade.</i>"]
        return "\n".join(L)

    def reset_text(self, uid):
        sel = self.reset_sel.setdefault(uid, {"t": set(), "p": set()})
        L = ["♻️ <b>RESET</b>", SEP_, "", "🎯 <b>TARGETS</b> (tap to select)", SEP_]
        L += [f"{'☑️' if k in sel['t'] else '⬜'} <b>{k}</b> · {html.escape(ch.cname)}" for k, ch in self.chans.items()]
        L += ["", "🧩 <b>WHAT TO RESET</b>", SEP_,
              f"{'☑️' if 'history' in sel['p'] else '⬜'} <b>History</b> · trades, stats, summaries, streak data",
              f"{'☑️' if 'sequence' in sel['p'] else '⬜'} <b>Sequence</b> · signal IDs restart at #S001",
              f"{'☑️' if 'balance' in sel['p'] else '⬜'} <b>Balance</b> · balance, lot, streak, wipes",
              "", "⚠️ An open trade is kept and still tracked.", "Press <b>✅ Apply</b> to confirm."]
        return "\n".join(L)

    def reset_ikb(self, uid):
        sel = self.reset_sel.setdefault(uid, {"t": set(), "p": set()}); ks = list(self.chans)
        rows = [[_b(("☑️ " if k in sel["t"] else "⬜ ") + k, f"rs:t:{k}") for k in ks[i:i + 3]] for i in range(0, len(ks), 3)]
        rows.append([_b("☑️ ALL" if set(ks) <= sel["t"] else "⬜ ALL", "rs:t:ALL")])
        rows.append([_b(("☑️ " if p in sel["p"] else "⬜ ") + p.title(), f"rs:p:{p}") for p in ("history", "sequence", "balance")])
        rows.append([_b("✅ Apply", "rs:go"), _b("❌ Cancel", "back")])
        rows.append([_b("🧨 Reset All (every channel, clears open trades)", "rs:all")])
        return {"inline_keyboard": rows}

    def apply_reset(self, targets, parts, clear_open=False, balance=None):
        """clear_open (Reset All / set balance): open trades are dropped (no tracking, no late replies)."""
        done = []
        with self.op_lock, self.st.lock:
            for k in targets:
                ch = self.chans[k]; s = ch.st.s; d = default_state(ch.cfg or None)
                if balance: s["start_balance"] = float(balance)
                sb_ = ch.start_balance()
                d["acct"]["balance"] = d["acct"]["peak"] = sb_; d["cycle"]["start_balance"] = d["cycle"]["peak"] = sb_
                if clear_open:
                    s["open"] = None; s["pending_close"] = None; s["posted"] = {}; s["announce"] = True
                    s["created"] = time.time()
                if "history" in parts:
                    for f in ("history", "signals", "entries", "tp", "sl", "forced", "skipped", "skip_keys", "sess_stats",
                              "pips_total", "max_streak", "sess_count", "created", "alerted_streak"): s[f] = d[f]
                    s["sys_closed"] = 0; s["rep_anchor"] = time.time()
                    s["hist_agg"] = empty_hist_agg()
                    s["milestones"] = {"msg": {}, "snapshots": {}, "wipes": [], "sent": {}}
                    s["sent"] = {}
                    s["acct"]["lifetime_peak"] = sb_
                    for f in ("wins", "losses", "volume", "spread_paid", "max_dd", "max_dd_pct", "realised"): s["acct"][f] = d["acct"][f]
                if "sequence" in parts:
                    s["seq"] = 0; s["posted"] = {}; s["pending_close"] = None
                    for d_ in (Chart._cache, Chart._meta, Chart._fid): d_.clear()   # no image of an old S00x survives
                if "balance" in parts:
                    for f in ("balance", "peak", "realised", "wipes", "max_dd", "max_dd_pct"): s["acct"][f] = d["acct"][f]
                    s["lot"], s["streak"], s["cycle"], s["alerted_streak"] = d["lot"], 0, d["cycle"], 0
                done.append(k)
            self.st.save()
        log.info("RESET %s parts=%s", done, sorted(parts))
        return done

    def guide_text(self):
        return "\n".join([
            "ℹ️ <b>GUIDE</b>", SEP_, "",
            "📡 <b>1. CHANNELS</b>", SEP_,
            f"<b>Source</b> ({html.escape(CHANNEL_NAME)}): random BUY/SELL in sessions, one trade at a time, next signal 3–10 min after a close.",
            "<b>Fixed:</b> gets EVERY source signal (same entry / TP / SL) at a fixed 0.01 lot, own #S IDs, closes on TP or SL.", "",
            "📦 <b>2. RULE 2 LOTS (source)</b>", SEP_,
            "0.01 → SL → 0.02 → SL → 0.04 → SL → <b>reset 0.01</b>. Any TP → next 0.01.",
            "<i>Example:</i> TP@0.01→0.01 · SL@0.01→0.02 · TP@0.02→0.01 · SL@0.02→0.04 · SL@0.04→0.01 · TP@0.04→0.01.",
            "The SL streak keeps counting after the reset (alerts / analytics).", "",
            "🎯 <b>3. TP / SL</b>", SEP_,
            f"SL random {SL_RANGE[0]}–{SL_RANGE[1]} pips, TP = round(SL × {TP_SL_RATIO:g}) → {int(SL_RANGE[0] * TP_SL_RATIO + 0.5)}–{int(SL_RANGE[1] * TP_SL_RATIO + 0.5)} pips. "
            "Change with <code>/TP 45-55</code> · <code>/SL 60-70</code>.", "",
            "🔒 <b>4. CLOSED BY SYSTEM</b>", SEP_,
            "Force Signal / <code>/close</code> = Closed by System: NOT an SL, streak and lot stay the same.", "",
            "📅 <b>5. REPORTS</b> (each channel its own)", SEP_,
            f"Daily {REPORT_HOUR}:00 IST Mon–Sat (no Sunday) · Weekly every 7 days (pinned) · Monthly every 30 days (pinned), "
            "counted from the channel's start. Restarts never double-post.", "",
            "🌐 <b>6. SESSIONS / WEEKEND</b>", SEP_,
            f"Auto signals only in Asian / London / New York. Friday no new entry after {NO_ENTRY_FRI_UTC} UTC; a running trade stays open "
            "and is still tracked. Force Signal works any time.", "",
            "🖼 <b>7. CHARTS</b>", SEP_,
            "Drawn by the bot from its own 1-minute candles (biquote quotes) — no chart API, no limits. "
            "Each channel has its own settings (Menu → 🖼 Chart settings): Light/Dark theme, 1m/5m/15m, Box/Lines, ON/OFF. "
            "Default is Light · 1m · Box · watermark off. Close charts of a long trade auto-step to 5m (>3 h) or 15m (>5 h). "
            "If a chart fails the message goes out as text.", "",
            "♻️ <b>8. RESET</b>", SEP_,
            "Tick SRC / Fixed / ALL and History / Sequence / Balance, then ✅ Apply."])

    def health_text(self):
        now = time.time(); ths = getattr(self, "thmap", {})
        age = now - self.px.ts if self.px.ts else None; c = self.chart._roll()
        L = ["🩺 <b>HEALTH</b>", SEP_, "",
             f"⏳ <b>Uptime:</b> {fmt_hm(now - Health.started)}",
             f"⚡ <b>Price ticks:</b> {self.px.rate():.1f}/s (target ~5.7/s = 175 ms)",
             f"⚙️ <b>Engine:</b> {'armed ✅' if self.st.s.get('armed') else 'waiting /start ⏸'}",
             "🧵 <b>Workers:</b> " + (" · ".join(f"{n} {'✅' if th.is_alive() else '❌'}" for n, th in ths.items()) or "n/a"),
             f"📡 <b>Quote:</b> {'OK' if age is not None and age < 10 else 'STALE'} ({'—' if age is None else f'{age:.1f}s'})",
             f"⚠️ <b>Errors:</b> {Health.errors} · 📮 <b>Failed posts:</b> {Health.failed_posts}", "",
             "🖼 <b>CHARTS (local)</b>", SEP_]
        L += self.chart_lines()
        L += ["", "📢 <b>CHATS — LAST ERROR</b>", SEP_]
        for k, ch in self.chans.items(): L.append(f"{'💎' if k == 'SRC' else '📡'} <b>{k}:</b> {html.escape(Health.chat_err.get(ch.cid, 'none ✅'))}")
        for aid in ADMIN_IDS: L.append(f"👤 <b>{aid}:</b> " + ("not started ❌" if aid in Health.unreachable else html.escape(Health.chat_err.get(aid, "ok ✅"))))
        L += ["", f"🧾 <b>Last error:</b> {html.escape(Health.last)}"]
        return "\n".join(L)

    def help_text(self):
        _unused = "\n".join(f"• <b>{c['key']}</b> – after <b>{c['activate_after']}</b> source SL · {c['progression']} lot "
                             f"{fmt_lot(c['base_lot'])}" + (f"→max {fmt_lot(c['max_lot'])}" if c['progression'] == 'martingale' else "")
                             + (f" · min bal ${c['min_balance']:,.0f}" if c.get('min_balance') else "") for c in CHANNELS)
        return "\n".join([
            "📘 <b>HELP</b>", SEP_, "",
            "⌨️ <b>KEYBOARD</b>", SEP_,
            "<b>📊 Dashboard:</b> engine, price, session, Decision AI channel",
            "<b>📡 Force Signal:</b> SOURCE: closes running trade (Closed by System) and sends a new one; it is forwarded by the normal rule",
            "<b>📂 Open Trades:</b> live float PnL",
            "<b>⚙️ Menu:</b> stats, summaries, streaks, channels, reset", "",
            "📡 <b>CHANNELS</b>", SEP_,
            "<b>Source:</b> random signals in sessions, Rule 2: 0.01→0.02→0.04, SL at 0.04 → reset 0.01, TP → 0.01.",
            "<b>Direction:</b> every signal BUY/SELL is decided by Google Decisions API (gemini-decision-1). Fixed 0.01 lot, no martingale.",
            "<b>Updates:</b> TP / SL / Closed are replies to the channel's own signal, from the same source quote.",
            "<b>Independent:</b> own #S001 IDs, lot, streak, open trade, balance, history and summaries.",
            "<b>Busy channel:</b> if it still has an open trade, the new source signal is skipped there.",
            "<b>Per-channel Force:</b> closes the channel's trade and sends an own random signal (only that channel).", "",
            "🔒 <b>System close:</b> Force / admin close does not count as SL (streak &amp; lot unchanged).", "",
            "💱 <b>PRICES</b>", SEP_, "<b>Entry:</b> BUY = Ask, SELL = Bid (never mid).",
            "<b>Exit check:</b> BUY closes on Bid, SELL on Ask; same quote for message, chart and detection.", "",
            "🧩 <b>MENU BUTTONS</b>", SEP_,
            "<b>📢 Channel buttons:</b> stats, open trade, daily/weekly/monthly/all-time (preview → post), force, chart settings",
            "<b>📈 Streaks:</b> source analytics: how often 1,2,3… SL streaks happened, TP after N SL, recovery %",
            "<b>♻️ Reset:</b> pick channels (or ALL) + History / Sequence / Balance, then Apply",
            f"<b>🎯 Range TP/SL:</b> <code>/TP 45-55</code>, <code>/SL 60-70</code> (TP = SL×{TP_SL_RATIO:g})", "",
            "🚨 <b>ALERTS</b> (admins only)", SEP_,
            "<b>Streak:</b> source SL streak 2, 3, 4, 5, 6, 7+", "<b>Daily:</b> streak analytics after 1 PM IST",
            "<b>Other:</b> wipe report, swap / long trade, low balance skip", "",
            "🖼 <b>CHART</b>", SEP_, "Local 2K XAUUSD chart (own candles, no API). ⚙️ Menu → 🖼 Chart settings, per channel: Light/Dark, 1m/5m/15m, Box/Lines, ON/OFF. Default Light · 1m · Box · no watermark. Long-trade close charts auto-step to 5m (>3 h) or 15m (>5 h).",
            "If a chart cannot be drawn, the message goes out as text only.", "",
            "<b>Commands:</b> /start /dashboard /stats /open /close /daily /weekly /monthly /alltime /streaks /setbalance /guide /health /help"])

    def post_once(self, sid, event, fn):
        """Send a channel event at most once per signal id (persisted)."""
        with self.st.lock:
            ev = self.st.s.setdefault("posted", {}).setdefault(sid, {})
            if event in ev: log.debug("dedupe: %s %s already posted", sid, event); return None
        m = fn()
        with self.st.lock:
            if m or self.tg.ambiguous:
                ev[event] = m["message_id"] if m else -1
                posted = self.st.s["posted"]
                for k in list(posted)[:-500]: posted.pop(k)
                self.st.save()
        return m

    def flush_close(self):
        """Post the TP/SL/close reply. Guaranteed: chart photo reply -> text reply -> plain text (no reply), each
        logged; a timeout is NOT treated as delivered for closes (a rare duplicate beats a missing SL post).
        pending_close stays set (and blocks this channel's next signal) until posted or failed after retries."""
        pc = self.st.s.get("pending_close")
        if not pc: return
        def _close():
            img = None
            if self.st.s.get("chart_on", True) and pc.get("trade"):     # OFF -> no chart generation / API call
                tr_ = pc["trade"]; ck = chart_key("close", tr_, pc["close"]["reason"]) + f"|{self.key}"
                try:
                    img = self.chart.get(dict(tr_), pc["close"], cache=ck, **self.chart_opts())
                except Exception: log.exception("[%s] close chart", self.key)
            m = None
            if img:
                try:
                    m = self.tg.photo(self.cid, img, pc["text"], self.btn, reply_to=pc["reply"])
                    if m: self.chart.set_fid(ck, TG.file_id(m))
                except Exception: log.exception("[%s] close photo", self.key)
                if not m: log.warning("[%s] close #%s: photo failed -> text reply", self.key, pc["id"])
            if not m:
                try: m = self.tg.send(self.cid, pc["text"], reply_to=pc["reply"], markup=self.btn)
                except Exception: log.exception("[%s] close text", self.key)
            if not m:
                log.warning("[%s] close #%s: text reply failed -> plain text", self.key, pc["id"])
                try: m = self.tg.send(self.cid, pc["text"], markup=self.btn)
                except Exception: log.exception("[%s] close plain", self.key)
            self.tg.ambiguous = False
            if m: log.info("[%s] close #%s posted (msg %s)", self.key, pc["id"], m.get("message_id") if isinstance(m, dict) else m)
            return m
        with self.st.lock: pc["tries"] = pc.get("tries", 0) + 1; pc["last_try"] = time.time(); self.st.save()
        self.post_once(pc["id"], "close", _close)
        with self.st.lock:
            if "close" in self.st.s["posted"].get(pc["id"], {}): self.st.s["pending_close"] = None; self.st.save(); return
        if pc["tries"] >= 4:
            log.error("[%s] close #%s NOT delivered after %d tries -> giving up", self.key, pc["id"], pc["tries"])
            with self.st.lock: self.st.s["pending_close"] = None; self.st.save()
            self.admin_alert(f"⚠️ <b>{self.key}: close message NOT delivered</b>\n━━━━━━━━━━━━━━━━━━━━\n\n🆔 <b>Trade:</b> #{pc['id']}\n"
                             f"📢 <b>Chat:</b> <code>{self.cid}</code>\n\n{pc['text']}")

    def retry_closes(self):
        """Engine: retry pending close messages (every 20 s), source first then targets."""
        for ch in self.chans.values():
            pc = ch.st.s.get("pending_close")
            if pc and time.time() - pc.get("last_try", 0) >= 20:
                try: ch.flush_close()
                except Exception: log.exception("retry close %s", ch.key)

    def recover(self):
        """After restart: finish any un-posted events of the open/closed signal without duplicates."""
        try:
            self.flush_close()
            if self.key == "SRC":
                for ch in list(self.chans.values())[1:]: ch.recover()
            t = self.st.s["open"]
            if t:
                tk = t.get("key", t["id"]); ev = self.st.s.get("posted", {}).get(tk, {})
                if "signal" not in ev and not t.get("msg_id"):
                    log.info("recover: signal %s never posted; cancelling it", t["id"])
                    with self.st.lock: self.st.s["open"] = None; self.st.save()
                elif "signal" not in ev:   # legacy trade from before dedupe tracking: assume fully posted
                    with self.st.lock:
                        self.st.s["posted"].setdefault(tk, {}).update(signal=t["msg_id"], entry=-1); self.st.save()
                elif "entry" not in ev:
                    self.mark_entry(t)
        except Exception:
            log.exception("recover")

    def weekend_notice(self, now_utc):
        k = weekend_key(now_utc)
        if not k or self.st.s["sent"].get("weekend") == k: return False
        txt = ("🌙 <b>WEEKEND OFF</b> — Market closed\n━━━━━━━━━━━━━━━━━\n"
               "💎 <b>#XAUUSD</b> signals are paused for the weekend.\n"
               "⏯ Resume: <b>Monday 03:30 AM IST</b> (Sun 22:00 UTC)\n\n"
               f"💎 <b>{html.escape(self.cname)}</b>")
        with self.st.lock: self.st.s["sent"]["weekend"] = k; self.st.save()
        self.tg.send(self.cid, txt, markup=self.btn); return True

    def skip(self, key):
        with self.st.lock:
            ks = self.st.s.setdefault("skip_keys", [])
            if key not in ks:
                ks.append(key); del ks[:-200]; self.st.s["skipped"] = self.st.s.get("skipped", 0) + 1; self.st.save()

    @staticmethod
    def is_admin(uid):
        return bool(uid) and (OPEN_ADMIN or uid in ADMIN_IDS)

    def handle(self, msg):
        chat = msg.get("chat", {}); uid = msg.get("from", {}).get("id")
        if chat.get("type") != "private" or not self.is_admin(uid): return
        if not uid or uid == _bot_user_id(): return
        Health.unreachable.discard(uid)      # admin has started the bot -> deliver alerts again
        if uid:
            with self.st.lock:
                du = self.st.s.setdefault("dm_users", [])
                if uid not in du:
                    du.append(uid); self.st.save()
        txt = (msg.get("text") or "").strip(); cid = chat["id"]
        reply = lambda t, kb=None: self.tg.send(cid, t, markup=kb or ADMIN_KB)
        if txt == "/start" and not self.st.s.get("armed"):
            with self.st.lock:
                self.st.s["armed"] = True; self.st.s["armed_at"] = time.time()
                self.st.s["next_signal_at"] = max(self.st.s.get("next_signal_at", 0), time.time())
                self.st.s.setdefault("kb_ver", {})[str(uid)] = KB_VER; self.st.save()
            log.info("engine ARMED by admin %s", uid)
            reply("✅ <b>Engine armed</b> — runs in sessions 24/5 from now on, auto-resumes after any restart.")
        if self.st.s.setdefault("kb_ver", {}).get(str(uid)) != KB_VER:      # push the new 4-button keyboard once
            with self.st.lock: self.st.s["kb_ver"][str(uid)] = KB_VER; self.st.save()
            reply("⌨️ Keyboard updated.")
        if txt in ("/start", "/menu", "/admin", "📊 Dashboard", "/dashboard"):
            self.tg.send(cid, self.dashboard(uid), markup=self.menu_kb()); return
        if txt in ("⚙️ Menu",):
            self.tg.send(cid, "⚙️ <b>MENU</b>\n━━━━━━━━━━━━━━━━━\nChoose an action:", markup=self.menu_kb()); return
        if txt in ("📡 Force Signal", "/force"):
            if not self.st.s.get("armed"):
                with self.st.lock: self.st.s["armed"] = True; self.st.s["armed_at"] = time.time(); self.st.save()
            reply(self.force_signal()); return
        if txt in ("🧠 Decision API", "/decision", "/ai"):
            self.tg.send(cid, self.decision_text(), markup=DEC_IKB); return
        if txt in ("📂 Open Trades", "/open"):
            self.tg.send(cid, self.open_text(), markup=OPEN_IKB); return
        if txt == "/stats": self.tg.send(cid, self.stats_text(), markup=STATS_IKB); return
        if txt in ("/daily", "/weekly", "/monthly", "/alltime"):
            k = txt[1:]; self.tg.send(cid, self.summary(k), markup=summary_ikb(k)); return
        if txt == "/sessions": self.tg.send(cid, self.sessions_text(), markup=BACK_IKB); return
        if txt == "/close":
            reply(self.admin_close()); return
        if txt.split(" ")[0] == "/setbalance":
            pa = txt.split()
            ks = {k.lower(): k for k in self.chans}
            try: k = ks[pa[1].lower()]; amt = float(pa[2].replace("$", "").replace(",", "")); assert 10 <= amt <= 10_000_000
            except Exception: reply("Usage: <code>/setbalance SRC &lt;amount&gt;</code>"); return
            ch = self.set_balance(k, amt); reply(f"✅ <b>{k}</b> reset and tracking from <b>${amt:,.2f}</b>\n\n" + ch.chan_text()); return
        if txt == "/health": self.tg.send(cid, self.health_text(), markup=BACK_IKB); return
        if txt == "/guide": self.tg.send(cid, self.guide_text(), markup=BACK_IKB); return
        if txt in ("/streaks", "/streak"): self.tg.send(cid, self.streak_text("alltime"), markup=STK_IKB); return
        if txt.upper().startswith(("/TP", "/SL")) and (len(txt) == 3 or txt[3] in " _"):
            res = self.set_range(txt[1:3].upper(), txt[3:].strip(" _"))
            where = self.range_msg.get(uid)
            if where: self.tg.edit(where[0], where[1], self.range_text(res), BACK_IKB)
            else: self.tg.send(cid, self.range_text(res), markup=BACK_IKB)
            return
        reply(self.help_text())

    def decision_text(self, test=False):
        st = DECISION_STATS; s = self.st.s
        L = ["🧠 <b>DECISION API</b>", SEP_, f"🤖 <b>Model:</b> <code>{DECISION_MODEL}</code>",
             "🎯 <b>Role:</b> decides BUY / SELL for every signal (no random, no skip)",
             f"📞 <b>Calls:</b> {st['calls']} · ✅ {st['ok']} · ❌ {st['fail']} (since restart)",
             f"⚠️ <b>Last error:</b> {html.escape(st['last_err'])}"]
        if test:
            q = self.px.get(max_age=5)
            if not q: L += ["", "🧪 <b>Test:</b> ❌ no live price"]
            else:
                try:
                    ss_ = session_at(datetime.now(timezone.utc))
                    d, i = decide_direction(self.candles.get(DECISION_CANDLES), q[0], q[1], ss_[0] if ss_ else "OUTSIDE", **self.dec_levels())
                    L += ["", f"🧪 <b>Test now:</b> {'🟢' if d == 'BUY' else '🔴'} <b>{d}</b> · confidence <b>{i['conf'] * 100:.1f}%</b>",
                          f"📊 BUY {i['buy'] * 100:.1f}% · SELL {i['sell'] * 100:.1f}% · bid <code>{fmt_p(q[0])}</code>",
                          f"🕯 Data: {len(merged_rows(self.candles.get(DECISION_CANDLES)))} x 1m candles · horizon 2-10 min",
                          "<i>(test only — no trade opened)</i>"]
                except Exception as e: L += ["", f"🧪 <b>Test:</b> ❌ <code>{html.escape(str(e)[:200])}</code>"]
        res = {h.get("id"): h for h in (s.get("history") or [])}
        dl = s.get("dec_log") or []
        if dl:
            L += ["", "📜 <b>Last decisions</b>"]
            w = n = 0
            for x in reversed(dl[-10:]):
                h = res.get(x["id"]); r = "⏳ open"
                if h:
                    win = is_win_trade(h); r = "✅ TP" if win else "❌ SL"; n += 1; w += win
                L.append(f"#{x['id']} {'🟢' if x['d'] == 'BUY' else '🔴'} {x['d']} · {x['conf'] * 100:.0f}% · {r}")
            if n: L.append(f"🏁 <b>Accuracy (last {n} closed):</b> {w / n * 100:.0f}%")
        else: L += ["", "📜 No API signals yet."]
        L.append(f"\n🕒 {datetime.now(IST):%d %b %H:%M:%S} IST")
        return "\n".join(L)

    def handle_cb(self, cq):
        """Inline-button router: admins only, always answered, edits the same message in place."""
        uid = cq.get("from", {}).get("id"); data = cq.get("data") or ""; m = cq.get("message") or {}
        cid, mid = m.get("chat", {}).get("id"), m.get("message_id"); note = None
        try:
            if not self.is_admin(uid) or m.get("chat", {}).get("type") != "private":
                note = "⛔ Admins only"; return
            on = lambda: self.st.s.get("chart_on", True)
            edit = lambda text, kb: self.tg.edit(cid, mid, text, kb)
            if data in ("dash", "back"): edit(self.dashboard(uid), self.menu_kb())
            elif data == "stats": edit(self.stats_text(), STATS_IKB)
            elif data == "dec": edit(self.decision_text(), DEC_IKB)
            elif data == "dec:test": edit(self.decision_text(test=True), DEC_IKB)
            elif data == "open": edit(self.open_text(), OPEN_IKB)
            elif data == "sess": edit(self.sessions_text(), BACK_IKB)
            elif data == "help": edit(self.help_text(), BACK_IKB)
            elif data == "guide": edit(self.guide_text(), BACK_IKB)
            elif data == "health": edit(self.health_text(), {"inline_keyboard": [[_b("🔄 Refresh", "health"), _b("⬅️ Back", "back")]]})
            elif data == "range":
                self.range_msg[uid] = (cid, mid); edit(self.range_text(), BACK_IKB)
            elif data in ("chart", "tf", "cs"):
                edit(cs_pick_text(), cs_pick_ikb())
            elif data.startswith("cs:"):
                parts = data.split(":")   # cs / KEY / [field] / [value]
                key = parts[1] if len(parts) > 1 else ""
                ch = self.chans.get(key)
                if not ch:
                    note = "Pick a channel"; edit(cs_pick_text(), cs_pick_ikb())
                else:
                    field = parts[2] if len(parts) > 2 else ""
                    val = parts[3] if len(parts) > 3 else ""
                    st = ch.st
                    if field == "on":
                        with st.lock: st.s["chart_on"] = not st.s.get("chart_on", True); st.save()
                        note = f"{key} chart {'ON' if st.s['chart_on'] else 'OFF'}"
                    elif field == "theme" and val in CHART_THEMES:
                        with st.lock: st.s["chart_theme"] = val; st.save()
                        note = f"{key} theme {val}"
                    elif field == "tf" and val.isdigit() and normalize_chart_tf(int(val), default=0) in CHART_TFS:
                        v = int(val)
                        with st.lock: st.s["chart_tf"] = v; st.save()
                        note = f"{key} TF {v}m"
                    elif field == "meas" and val in CHART_MEASURES:
                        with st.lock: st.s["chart_measure"] = val; st.save()
                        note = f"{key} style {val}"
                    elif field == "wm":
                        with st.lock: st.s["chart_wm"] = not bool(st.s.get("chart_wm")); st.save()
                        note = f"{key} watermark {'ON' if st.s['chart_wm'] else 'OFF'}"
                    elif field:
                        note = "Unknown setting"
                    sett = chart_settings(st.s)
                    edit(cs_text(ch), cs_ikb(key, sett))
            elif data.startswith("tf:") and data[3:].isdigit():
                # legacy button: apply to SRC and open SRC chart settings
                v = normalize_chart_tf(int(data[3:]), default=0)
                if v not in CHART_TFS:
                    note = "Use 1m, 5m or 15m"
                else:
                    with self.st.lock: self.st.s["chart_tf"] = v; self.st.save()
                    note = f"SRC TF {v}m"
                sett = chart_settings(self.st.s)
                edit(cs_text(self), cs_ikb("SRC", sett))
            elif data.startswith("sum:") and data[4:] in ("daily", "weekly", "monthly", "alltime"):
                edit(self.summary(data[4:]), summary_ikb(data[4:]))
            elif data == "pnl":
                edit("🖼 <b>PnL IMAGE</b>\n" + SEP_ + "\n\nGenerate the report card and send it here (not to the channel).\nPick a period:", pnl_ikb("SRC"))
            elif data.startswith("img:") and data[4:] in ("daily", "weekly", "monthly"):
                kind = data[4:]; note = "🖼 Generating…"
                threading.Thread(target=self._admin_send_pnl, args=(cid, self, kind), daemon=True).start()
            elif data.startswith("post:") and data[5:] in ("daily", "weekly", "monthly", "alltime"):
                k = data[5:]; key = (cid, mid, k)
                if key in self.cb_posted: note = "Already posted"; return
                self.cb_posted.add(key)
                ok = self.post_report(k, images=k in ("daily", "weekly"), pin=False, track=False)   # v10b: images first, text as reply; monthly / all-time = text only
                note = "✅ Sent to channel" if ok else "❌ Send failed"
                if not ok: self.cb_posted.discard(key)
                edit(self.summary(k) + f"\n\n{note}", BACK_IKB)
            elif data == "reset":
                self.reset_sel[uid] = {"t": set(), "p": set()}; edit(self.reset_text(uid), self.reset_ikb(uid))
            elif data.startswith("rs:"):
                sel = self.reset_sel.setdefault(uid, {"t": set(), "p": set()}); _, typ, *v = data.split(":")
                if typ == "t" and v[0] == "ALL": sel["t"] = set() if set(self.chans) <= sel["t"] else set(self.chans)
                elif typ == "t" and v[0] in self.chans: sel["t"] ^= {v[0]}
                elif typ == "p" and v[0] in ("history", "sequence", "balance"): sel["p"] ^= {v[0]}
                if typ == "all":
                    edit("🧨 <b>RESET ALL?</b>\n" + SEP_ + "\n\nEvery channel: open trades dropped (no late replies), history, "
                         "sequence, dedupe, pending closes and balances reset.\nThe next <b>Force Signal</b> starts everything.",
                         {"inline_keyboard": [[_b("✅ Yes, reset all", "rs:allok"), _b("❌ Cancel", "back")]]}); return
                if typ == "allok":
                    done = self.apply_reset(list(self.chans), {"history", "sequence", "balance"}, clear_open=True)
                    self.reset_sel.pop(uid, None); note = "Reset all done"
                    edit("\n".join(["🧨 <b>RESET ALL DONE</b>", SEP_, "", f"<b>Channels:</b> {', '.join(done)}",
                                    "▶️ Press <b>📡 Force Signal</b> to start: every channel posts its start message first."]), BACK_IKB); return
                if typ == "go":
                    if not sel["t"] or not sel["p"]: note = "Select at least one target and one item"
                    else:
                        done = self.apply_reset(sorted(sel["t"]), sel["p"]); self.reset_sel.pop(uid, None); note = "Reset done"
                        edit("\n".join(["♻️ <b>RESET DONE</b>", SEP_, "", f"<b>Targets:</b> {', '.join(done)}",
                                        f"<b>Reset:</b> {', '.join(sorted(sel['p']))}"]), BACK_IKB); return
                edit(self.reset_text(uid), self.reset_ikb(uid))
            elif data.startswith("stk:") and data[4:] in ("daily", "weekly", "monthly", "alltime"):
                edit(self.streak_text(data[4:]), STK_IKB)
            elif data.startswith("c:"):
                _, k, act, *rest = data.split(":") + [""]
                ch = self.chans.get(k)
                if not ch: note = "Unknown channel"; return
                kind = rest[0] if rest else ""
                if act == "view": edit(ch.chan_text(), chan_ikb(k, ch.st.s.get("chart_on", True)))
                elif act == "stats": edit(ch.stats_text(), chan_back(k))
                elif act == "open": edit(ch.open_text(), chan_back(k))
                elif act == "sum" and kind in ("daily", "weekly", "monthly", "alltime"): edit(ch.summary(kind), chan_sum_ikb(k, kind))
                elif act == "pnl":
                    edit("🖼 <b>PnL IMAGE</b> · " + html.escape(ch.cname) + "\n" + SEP_ +
                         "\n\nGenerate the report card and send it here (not to the channel).\nPick a period:", pnl_ikb(k))
                elif act == "rep": edit(ch.reports_text(), rep_ikb(k))
                elif act == "gen" and kind in ("daily", "weekly"):
                    note = "🖼 Generating preview…"
                    threading.Thread(target=self._admin_preview, args=(cid, ch, kind), daemon=True).start()
                elif act == "img" and kind in ("daily", "weekly", "monthly"):
                    note = "🖼 Generating…"
                    threading.Thread(target=self._admin_send_pnl, args=(cid, ch, kind), daemon=True).start()
                elif act == "post" and kind in ("daily", "weekly", "monthly", "alltime"):
                    key = (cid, mid, k, kind)
                    if key in self.cb_posted: note = "Already posted"; return
                    self.cb_posted.add(key); ok = ch.post_report(kind, images=kind in ("daily", "weekly"), pin=False, track=False)   # v10b order; monthly / all-time = text only
                    note = "✅ Sent to channel" if ok else "❌ Send failed"
                    if not ok: self.cb_posted.discard(key)
                    edit(ch.summary(kind) + f"\n\n{note}", chan_back(k))
                elif act == "force":
                    if not self.st.s.get("armed"):
                        with self.st.lock: self.st.s["armed"] = True; self.st.s["armed_at"] = time.time(); self.st.save()
                    note = "Forcing…"; res = ch.force_signal(); edit(f"{res}\n\n" + ch.chan_text(), chan_ikb(k, ch.st.s.get("chart_on", True)))
                elif act == "close":
                    res = ch.admin_close(); note = "Closed" if res.startswith("🔒") else "No trade"
                    edit(f"{res}\n\n" + ch.chan_text(), chan_ikb(k, ch.st.s.get("chart_on", True)))
                elif act == "bal":
                    if kind.replace(".", "").isdigit():
                        self.set_balance(k, float(kind)); note = f"{k} balance ${float(kind):,.0f}"
                        edit(f"✅ <b>{k}</b> reset and tracking from <b>${float(kind):,.2f}</b>\n\n" + ch.chan_text(), chan_ikb(k, ch.st.s.get("chart_on", True)))
                    else:
                        edit(f"💵 <b>{k} · SET BALANCE</b>\n{SEP_}\n\n<b>Current:</b> ${ch.st.s['acct']['balance']:,.2f}\n"
                             f"<b>Start:</b> ${ch.start_balance():,.2f}\n\n⚠️ Setting a balance resets this channel (open trade dropped).\n"
                             f"✏️ Custom: <code>/setbalance {k} 2500</code>",
                             {"inline_keyboard": [[_b(f"${a:,}", f"c:{k}:bal:{a}") for a in (100, 1000, 2000, 5000)],
                                                  [_b(f"${a:,}", f"c:{k}:bal:{a}") for a in (10000,)], [_b("⬅️ Back", f"c:{k}:view")]]})
                elif act == "chart":
                    sett = chart_settings(ch.st.s)
                    edit(cs_text(ch), cs_ikb(k, sett))
                else: note = "Unknown action"
            else: note = "Unknown action"
        finally:
            self.tg.answer(cq.get("id"), note)

    def poll_loop(self):
        while not self.stop.is_set():
            try:
                ups = self.tg.call("getUpdates", {"offset": self.st.s["tg_offset"], "timeout": 25,
                                                  "allowed_updates": json.dumps(["message", "callback_query"])}, tries=1, timeout=35)
                for u in ups or []:
                    with self.st.lock: self.st.s["tg_offset"] = u["update_id"] + 1; self.st.save()
                    try:
                        if "message" in u: self.handle(u["message"])
                        elif "callback_query" in u: self.handle_cb(u["callback_query"])
                    except Exception: log.exception("handle")
                if ups is None: time.sleep(3)
            except Exception:
                log.exception("poll loop"); time.sleep(3)

    def run(self):
        log.info("bot start (test_mode=%s) open=%s", TEST_MODE, self.st.s["open"])
        try:
            bid = _bot_user_id()
            with self.st.lock:
                du = [x for x in (self.st.s.get("dm_users") or []) if int(x) != bid]
                self.st.s["dm_users"] = du
                (self.st.s.get("kb_ver") or {}).pop(str(bid), None)
                self.st.save()
        except Exception:
            log.debug("scrub self id failed", exc_info=True)
        self.tg.call("deleteWebhook")
        try: self.check_chats()
        except Exception: log.exception("startup chat check")
        self.workers = {"price": (self.px.loop, (self.stop,)), "telegram": (self.poll_loop, ()),
                        "engine": (self.trade_loop, ()), "scheduler": (self.scheduler_loop, ())}
        self.recover()
        self.threads, self.thmap, restarts = [], {}, []
        def start(name):
            fn, args = self.workers[name]
            th = threading.Thread(target=fn, args=args, daemon=True, name=name); th.start()
            self.thmap[name] = th; self.threads = list(self.thmap.values())
        for n in self.workers: start(n)
        log.info("engine armed=%s (auto-resume)", self.st.s.get("armed"))
        while not self.stop.is_set():                       # watchdog
            time.sleep(5)
            for n, th in list(self.thmap.items()):
                if not th.is_alive():
                    log.error("watchdog: worker '%s' died -> restarting", n); start(n); restarts.append(time.time())
            restarts[:] = [r for r in restarts if time.time() - r < 600]
            if len(restarts) > 20: raise RuntimeError("too many worker restarts in 10 min")

class SectionStore:
    """View of one channel's section inside the main state file (same lock, same atomic save + backups)."""
    def __init__(self, main, key, cfg):
        self.main, self.key, self.lock = main, key, main.lock
        sec = main.s.setdefault("channels", {}).get(key)
        base = default_state(cfg)
        if isinstance(sec, dict):
            base.update(sec); base["acct"] = {**default_state(cfg)["acct"], **sec.get("acct", {})}
        else:   # first run for this channel: don't back-post summaries already due today
            for k in due_summaries(datetime.now(IST), {}): base["sent"][k] = datetime.now(IST).date().isoformat()
            if cfg.get("wm_on"): base["chart_wm"] = True
            log.info("[%s] new channel section created (start %s)", key, datetime.now(IST).strftime("%d %b %Y %H:%M IST"))
        apply_chart_defaults(base)
        base["hist_agg"] = merge_hist_agg(base.get("hist_agg"))
        ms = base.get("milestones") if isinstance(base.get("milestones"), dict) else {}
        base["milestones"] = {"msg": dict(ms.get("msg") or {}), "snapshots": dict(ms.get("snapshots") or {}),
                              "wipes": list(ms.get("wipes") or []), "sent": dict(ms.get("sent") or {})}
        a = base["acct"]; a["lifetime_peak"] = max(float(a.get("lifetime_peak") or 0), float(a.get("peak") or 0), float(a.get("balance") or 0))
        base.pop("channels", None); main.s["channels"][key] = base
    @property
    def s(self): return self.main.s["channels"][self.key]
    @s.setter
    def s(self, v): self.main.s["channels"][self.key] = v
    def save(self): self.main.save()
    def backup(self, every=300): pass

class Chan(Bot):
    """A target channel: same engine code as the source, own state section, mirrors source signals."""
    alert_from = None   # streak alerts are about the SOURCE
    def __init__(self, src, cfg):
        self.src, self.cfg, self.key = src, cfg, cfg["key"]
        self.cid, self.cname, self.strategy, self.base_lot = cfg["id"], cfg["name"], cfg["strategy"], cfg["base_lot"]
        self.wm, self.max_lot = cfg.get("wm") or cfg["name"].upper(), cfg.get("max_lot")
        self.st = SectionStore(src.st, cfg["key"], cfg)
        self.px, self.tg, self.chart, self.hist, self.op_lock = src.px, src.tg, src.chart, src.hist, src.op_lock
        self.candles = src.candles
        self.stop, self.beat, self.cb_posted, self.range_msg = src.stop, src.beat, src.cb_posted, src.range_msg
        self.pending_reset, self.pending_alltime = {}, {}
    @property
    def chans(self): return self.src.chans
    @property
    def reset_sel(self): return self.src.reset_sel
    def next_lot(self, lot, streak, win):
        c = self.cfg
        return next_martingale(lot, streak, win, base=c["base_lot"], max_lot=c.get("max_lot"), fixed=c["progression"] != "martingale")
    def admin_alert(self, text): self.src.admin_alert(text)

def last_session(now_utc):
    """(name, start, end) of the most recent session that has ENDED by now_utc (weekends skipped)."""
    best = None; day = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
    for dd in range(0, 4):
        d0 = day - timedelta(days=dd)
        for name, a, b in SESSIONS:
            st_, en_ = d0 + timedelta(minutes=_hm(a)), d0 + timedelta(minutes=_hm(b))
            if en_ <= now_utc and not is_weekend(st_) and (best is None or en_ > best[2]): best = (name, st_, en_)
    return best

def session_sticker_plan(now_utc, live_from=0, busy=False):
    """Which session stickers may fire at now_utc (Free / own-channel rules).
    Returns a list of ('closed'|'start', dedupe_key). Close and start never appear together.
    Close: only in a real no-session gap after a session end, and only if the next session
    has not started. If a trade is running (busy), nothing is emitted (deferred until it closes).
    Start: only at a session that follows a break (>= 30 min), after the channel went live.
    Back-to-back sessions (Asian 05:30-12:30 IST, London 12:30-17:30 IST, NY 17:30-02:00 IST)
    have no gap, so neither sticker fires at those boundaries.
    """
    if busy: return []
    cur = session_at(now_utc); prev = last_session(now_utc); out = []
    if prev and not cur and prev[2].timestamp() >= live_from \
            and not market_closed(prev[1] + timedelta(minutes=1)):
        out.append(("closed", f"closed|{prev[1].date().isoformat()}|{prev[0]}"))
    if cur and cur[1].timestamp() >= live_from and not market_closed(now_utc) and gap_before(cur[1], 0.5):
        out.append(("start", f"start|{cur[1].date().isoformat()}|{cur[0]}"))
    if len(out) > 1:                          # next session already started: start only, never both
        out = [x for x in out if x[0] == "start"]
    return out

class OwnChan(Chan):
    """Independent channel: its own random signals (not mirrored), fixed lot, own gap, MT5 bot button, own footer."""
    @property
    def btn(self): return MT5_BTN
    def footer(self): return OWN_FOOTER
    def signal_text(self, sid, d, lot, entry, tp, sl, lp_tp, lp_sl, streak=None):
        return (f"🔔 <b>NEW SIGNAL | SCALPING ⚡</b>\n━━━━━━━━━━━━━━━━━\n"
                f"🆔 <b>#{sid}</b>\n💎 Pair: <b>#XAUUSD</b>\n🌐 Direction: <b>{d} {'📈' if d == 'BUY' else '📉'}</b>\n"
                f"📌 Lot Size: <b>{fmt_lot(lot)}</b>\n\n"
                f"✅ <b>ENTRY :</b> <code>{fmt_p(entry)}</code>\n\n"
                f"🎯 <b>TARGET</b>\n<code>{fmt_p(tp)}</code>   (+{fmt_pips(lp_tp)} Pips · {fmt_money(money_for_pips(lp_tp, lot))})\n\n"
                f"🛑 <b>STOP LOSS</b>\n<code>{fmt_p(sl)}</code>   (-{fmt_pips(lp_sl)} Pips · {fmt_money(-money_for_pips(lp_sl, lot))})\n\n"
                f"{OWN_FOOTER}")
    def reachable(self):
        """False while startup/getChat said 'chat not found'; re-checked every 10 min (no posts in between)."""
        if self.cid not in Health.chat_err: return True
        if time.time() - getattr(self, "_rchk", 0) < 600: return False
        self._rchk = time.time()
        ok = None if DRY_RUN else self.tg.call("getChat", {"chat_id": self.cid}, tries=1, timeout=8)
        if ok:
            Health.chat_err.pop(self.cid, None); log.info("[%s] channel %s reachable again", self.key, self.cid)
            self.admin_alert(f"✅ <b>{html.escape(self.cname)}</b> ({self.key}) is reachable now · <code>{self.cid}</code>")
        return bool(ok)
    def own_tick(self, now_u):
        s = self.st.s
        if s.get("open") or s.get("pending_close") or not self.src.st.s.get("armed"): return
        if time.time() < float(s.get("next_signal_at") or 0): return
        if is_weekend(now_u) or market_closed(now_u) or not self.auto_allowed(now_u) or self.price_stale(): return
        if not self.reachable(): return
        cur = session_at(now_u)
        if not cur: return
        # wait for the start sticker only after a real break (Asian / Monday); London & NY are contiguous
        if gap_before(cur[1], 0.5) and "sticker" not in (s.get("posted") or {}).get(f"start|{cur[1].date().isoformat()}|{cur[0]}", {}): return
        hs = s.get("history") or []
        if hs:
            h = hs[-1]; prev_k = session_key(datetime.fromtimestamp(h["opened"], timezone.utc))
            if prev_k != session_key(now_u) and time.time() - float(h["closed"]) < OWN_SESSION_GAP_SEC: return
        t = self.open_signal()
        if t: log.info("[%s] own signal #%s %s", self.key, t["id"], t["direction"])
    def session_posts(self, now_utc):
        """Closed sticker at a real session end (the no-session gap after NY / Friday), only when no trade
        is running; if one is running, send it after that trade closes, but not if the next session has
        already started. Start sticker at a real session start (after a break). They never fire together."""
        if not SESSIONS_ENABLED or not self.src.st.s.get("armed") or not self.reachable(): return
        s = self.st.s; busy = bool(s.get("open") or s.get("pending_close")); live_from = float(s.get("created") or 0)
        for kind, key in session_sticker_plan(now_utc, live_from, busy):
            fid = STICKER_SESSION_CLOSED if kind == "closed" else STICKER_SESSION_STARTS
            self.post_once(key, "sticker", lambda fid=fid: self.tg.sticker(self.cid, fid))

class Health(logging.Handler):
    errors = 0; last = "—"; started = time.time(); failed_posts = 0; unreachable = set(); chat_err = {}
    def emit(self, rec):
        if rec.levelno >= logging.ERROR and "getUpdates" not in rec.getMessage():
            Health.errors += 1; Health.last = f"{datetime.now(IST):%d %b %H:%M} {rec.getMessage()[:120]}"

class Redact(logging.Filter):
    """Bot token never reaches a log line / Health.last (requests errors include the API URL)."""
    def filter(self, rec):
        try:
            m = rec.getMessage()
            if BOT_TOKEN and BOT_TOKEN in m: rec.msg, rec.args = m.replace(BOT_TOKEN, "<TOKEN>"), None
        except Exception: pass
        return True

def setup_logging():
    log.setLevel(logging.INFO); log.addFilter(Redact())
    logging.getLogger("urllib3").setLevel(logging.ERROR)
    h = RotatingFileHandler(LOG_FILE, maxBytes=5_000_000, backupCount=2)
    h.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s")); log.addHandler(h)
    sh = logging.StreamHandler(); sh.setFormatter(h.formatter)
    log.addHandler(sh); log.addHandler(Health())

if __name__ == "__main__":
    setup_logging()
    while True:
        try:
            Bot().run()
        except KeyboardInterrupt:
            raise
        except BaseException:
            log.exception("FATAL — re-executing process in 5s")
            time.sleep(5)
            try: os.execv(sys.executable, [sys.executable] + sys.argv)
            except Exception: log.exception("execv failed; retrying in-process")
