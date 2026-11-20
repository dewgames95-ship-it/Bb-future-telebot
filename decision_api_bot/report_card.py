#!/usr/bin/env python3
"""PnL report-card images for the XAUUSD bot (used by strategy-final.py).

Renders from a report_dataset() dict so the image footer and visible/overflow
trade set stay in lockstep with the text summary (same window, same records,
same TP / SL / pips / Net totals).
"""
from __future__ import annotations

import gc
import math
import os
import threading
from datetime import datetime, timedelta, timezone
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

IST = timezone(timedelta(hours=5, minutes=30))

PAGE_ROWS = 22
MAX_PAGES = 2
MAX_SHOWN = PAGE_ROWS * MAX_PAGES  # latest 44
W = 2400
HEADER_NATIVE = (2004, 350)

_DIR = os.path.dirname(os.path.abspath(__file__))
_ASSETS = os.path.join(_DIR, "assets")
HEADER_PATH = os.path.join(_ASSETS, "report_header.jpg")
FONT_PATH = os.path.join(_ASSETS, "Montserrat-VariableFont_wght.ttf")
EMOJI_UP = os.path.join(_ASSETS, "emoji_1f4c8.png")    # 📈 (Twemoji, CC-BY 4.0)
EMOJI_DOWN = os.path.join(_ASSETS, "emoji_1f4c9.png")  # 📉
PAIR_NOTE = "All pairs: XAUUSD"

NAVY = (8, 19, 47)
NAVY_SOFT = (22, 34, 56)
BLUE = (22, 94, 240)
BLUE_TITLE_L = (8, 118, 220)
BLUE_TITLE_R = (20, 170, 250)
TP_BG = (236, 253, 243)
TP_FG = (16, 170, 100)
SL_BG = (254, 242, 244)
SL_FG = (230, 50, 68)
RUN_BG = (239, 246, 255)
RUN_FG = (55, 112, 230)
SYS_BG = (245, 246, 250)
SYS_FG = (90, 98, 112)
TEXT = (22, 34, 56)
MUTED = (108, 122, 144)
COL_RULE = (210, 220, 234)
GRID = (204, 216, 230)
WHITE = (255, 255, 255)
BG_TL = (228, 243, 254)
BG_TR = (140, 200, 252)
BG_BOT = (246, 250, 255)
DISCLAIM = (120, 132, 150)
PAGE_FG = (140, 150, 165)

_LOCK = threading.Lock()
_FONT_CACHE = {}
_EMOJI_CACHE = {}


def _font(size, weight=400):
    key = (size, int(weight))
    if key in _FONT_CACHE:
        return _FONT_CACHE[key]
    path = FONT_PATH if os.path.isfile(FONT_PATH) else None
    if not path:
        for c in (
            "/usr/share/fonts/truetype/sand-box/google/Montserrat/Montserrat-VariableFont_wght.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ):
            if os.path.isfile(c):
                path = c
                break
    if not path:
        f = ImageFont.load_default()
        _FONT_CACHE[key] = f
        return f
    f = ImageFont.truetype(path, size)
    for axes in ([int(weight)], [14, int(weight)]):
        try:
            f.set_variation_by_axes(axes)
            break
        except Exception:
            continue
    _FONT_CACHE[key] = f
    return f


def _lerp(c0, c1, t):
    return tuple(int(a + (b - a) * t) for a, b in zip(c0, c1))


def _measure(text, font):
    d = ImageDraw.Draw(Image.new("L", (1, 1)))
    b = d.textbbox((0, 0), text, font=font, anchor="lt")
    return b[2] - b[0], b[3] - b[1]


def _fmt_pips_cell(p):
    p = float(p)
    body = f"{abs(p):g}" if float(p).is_integer() else f"{abs(p):.1f}"
    return f"{'+' if p >= 0 else '-'}{body}"


def _fmt_pips_money(pips, net):
    """One line, e.g. '+53 pips / +$5.05'."""
    return f"{_fmt_pips_cell(pips)} pips / {_fmt_money(net)}"


def _fmt_pips_footer(p):
    """Match the text summary's {pips:+.1f}."""
    return f"{float(p):+.1f}"


def _fmt_money(n):
    n = float(n)
    return f"{'+' if n >= 0 else '-'}${abs(n):,.2f}"


def _fmt_wr(wr):
    """Match the text summary's {wr:.1f}%."""
    return f"{float(wr):.1f}%"


def _fmt_dur(sec):
    if sec is None:
        return "-"
    sec = int(max(0, sec))
    if sec < 60:
        return "<1m"
    h, m = divmod(sec // 60, 60)
    if h:
        return f"{h}h {m:02d}m"
    return f"{m}m"


def fmt_range(t0, t1):
    """e.g. 'Mon 16 Nov 1:00 PM – Tue 17 Nov 1:00 PM IST'."""
    def one(dt):
        return dt.astimezone(IST).strftime("%a %-d %b %-I:%M %p")
    return f"{one(t0)} – {one(t1)} IST"


def paginate_rows(rows, page_rows=PAGE_ROWS, max_pages=MAX_PAGES):
    """Show the latest page_rows*max_pages rows (oldest = 1). Hidden go to overflow."""
    total = len(rows)
    cap = page_rows * max_pages
    if total <= cap:
        shown, hidden = list(rows), []
    else:
        hidden = list(rows[:-cap])
        shown = list(rows[-cap:])
    n_pages = max(1, (len(shown) + page_rows - 1) // page_rows) if shown else 1
    pages = []
    if not shown:
        pages.append([])
    else:
        for i in range(n_pages):
            pages.append(shown[i * page_rows:(i + 1) * page_rows])
    return pages, len(hidden) + 1, hidden


# ---------------------------------------------------------------------------
# Header: user's banner image, text erased, our title + date drawn crisply
# ---------------------------------------------------------------------------

def _cover_box(im, box, ya, yb, feather=16):
    """Paint a band with a vertical blend of two sample strips; feather the edges."""
    x0, y0, x1, y1 = box
    w, h = im.size
    px = im.load()

    def avg(x, a, b):
        cols = []
        for y in range(max(0, a), min(h, b)):
            cols.append(px[min(max(x, 0), w - 1), y])
        if not cols:
            return (255, 255, 255)
        n = len(cols)
        return tuple(sum(c[i] for c in cols) // n for i in range(3))

    bw, bh = x1 - x0, y1 - y0
    fill = Image.new("RGB", (bw, bh))
    fp = fill.load()
    for x in range(bw):
        above = avg(x0 + x, ya[0], ya[1])
        below = avg(x0 + x, yb[0], yb[1])
        for y in range(bh):
            fp[x, y] = _lerp(above, below, y / max(1, bh - 1))
    mask = Image.new("L", (bw, bh), 255)
    mp = mask.load()
    for y in range(bh):
        fy = min(y, bh - 1 - y, feather) / feather if feather else 1
        for x in range(bw):
            fx = min(x, bw - 1 - x, feather) / feather if feather else 1
            mp[x, y] = int(255 * max(0.0, min(1.0, fx)) * max(0.0, min(1.0, fy)))
    im.paste(fill, (x0, y0), mask)


def _prepare_header_base():
    """Load the user banner, erase original title + date pill, return native RGB."""
    if not os.path.isfile(HEADER_PATH):
        raise FileNotFoundError(f"report header missing: {HEADER_PATH}")
    im = Image.open(HEADER_PATH).convert("RGB")
    if im.size[0] != HEADER_NATIVE[0]:
        nh = int(round(im.size[1] * HEADER_NATIVE[0] / im.size[0]))
        im = im.resize((HEADER_NATIVE[0], nh), Image.Resampling.LANCZOS)
    im = _crop_header_bottom_strip(im)
    # Title band (FUTURES DAILY ROI REPORT)
    _cover_box(im, (318, 60, 1420, 148), (36, 60), (132, 154), feather=12)
    # Date pill including its right cap / chevron, not into the rising bars
    _cover_box(im, (268, 166, 1310, 286), (144, 166), (282, 314), feather=14)
    return im


def _crop_header_bottom_strip(im):
    """Drop the leftover blue table-header sliver baked into the source banner."""
    w, h = im.size
    px = im.convert("RGB")
    cut = h
    for y in range(h - 1, h // 2, -1):
        r, g, b = px.getpixel((w // 2, y))
        if b > 180 and r < 90:
            cut = y
            continue
        break
    # also trim the antialiased fade into that blue bar
    while cut > 1:
        r, g, b = px.getpixel((w // 2, cut - 1))
        if b > r + 25 and b > 200 and r < 200:
            cut -= 1
            continue
        break
    if cut < h:
        im = im.crop((0, 0, w, cut))
    return im


def _scale_header(native, width):
    h = int(round(native.size[1] * width / native.size[0]))
    out = native.resize((width, h), Image.Resampling.LANCZOS)
    out = out.filter(ImageFilter.UnsharpMask(radius=1.3, percent=70, threshold=2))
    return out.convert("RGBA")


def _text_gradient(img, xy, text, font, c0, c1, anchor="lt"):
    draw = ImageDraw.Draw(img)
    x, y = xy
    bbox = draw.textbbox((x, y), text, font=font, anchor=anchor)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    if tw <= 0 or th <= 0:
        return bbox
    pad = 4
    layer = Image.new("RGBA", (tw + pad * 2, th + pad * 2), (0, 0, 0, 0))
    ImageDraw.Draw(layer).text((pad, pad), text, font=font, fill=(255, 255, 255, 255), anchor="lt")
    grad = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    gp = grad.load()
    ww = layer.size[0]
    for i in range(ww):
        col = _lerp(c0, c1, i / max(1, ww - 1)) + (255,)
        for j in range(layer.size[1]):
            gp[i, j] = col
    grad.putalpha(layer.split()[-1])
    img.alpha_composite(grad, (bbox[0] - pad, bbox[1] - pad))
    return bbox


def _rounded(draw, box, r, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)


def _draw_calendar(draw, cx, cy, s, color=BLUE):
    x0, y0, x1, y1 = cx - s * 0.52, cy - s * 0.38, cx + s * 0.52, cy + s * 0.50
    w = max(2, int(s * 0.10))
    _rounded(draw, (x0, y0, x1, y1), r=s * 0.16, fill=WHITE, outline=color, width=w)
    draw.rectangle((x0 + w * 0.4, y0, x1 - w * 0.4, y0 + s * 0.28), fill=color)
    for dx in (-0.22, 0.22):
        bx = cx + s * dx
        draw.rounded_rectangle((bx - s * 0.07, y0 - s * 0.22, bx + s * 0.07, y0 + s * 0.10),
                               radius=s * 0.07, fill=color)


def _draw_chevron(draw, cx, cy, s, color=BLUE):
    w = max(3, int(s * 0.18))
    draw.line([(cx - s * 0.42, cy - s * 0.12), (cx, cy + s * 0.32), (cx + s * 0.42, cy - s * 0.12)],
              fill=color, width=w, joint="curve")


def _draw_date_pill(img, x, y, text, h=74):
    d = ImageDraw.Draw(img)
    font = _font(32, 650)
    tw, _ = _measure(text, font)
    cal_w, chev_w, pad = 64, 52, 22
    width = pad + cal_w + 12 + tw + 18 + chev_w + pad
    box = (x, y, x + width, y + h)
    _rounded(d, box, r=h / 2, fill=WHITE, outline=(200, 212, 228), width=2)
    cx = x + pad + cal_w * 0.45
    _draw_calendar(d, cx, y + h / 2, s=32, color=BLUE)
    dvx = x + pad + cal_w + 6
    d.line([(dvx, y + 18), (dvx, y + h - 18)], fill=(200, 210, 226), width=2)
    d.text((dvx + 18, y + h / 2), text, font=font, fill=NAVY, anchor="lm")
    _draw_chevron(d, x + width - pad - 18, y + h / 2, s=18, color=BLUE)
    return width


def compose_header(width, title_navy, title_blue, date_text):
    """Upscaled user banner with our title + date pill drawn on top."""
    native = _prepare_header_base()
    banner = _scale_header(native, width)
    sc = width / HEADER_NATIVE[0]
    d = ImageDraw.Draw(banner)
    title_x = int(332 * sc)
    title_y = int(68 * sc)
    f_title = _font(int(80 * sc / (2400 / 2004) * 0.95) if False else 80, 880)
    # 80px at 2400 wide (~ matching the original title weight)
    navy_txt = title_navy.rstrip() + " "
    d.text((title_x, title_y), navy_txt, font=f_title, fill=NAVY, anchor="lt")
    nw, _ = _measure(navy_txt, f_title)
    _text_gradient(banner, (title_x + nw, title_y), title_blue, f_title,
                   BLUE_TITLE_L, BLUE_TITLE_R, anchor="lt")
    pill_y = int(188 * sc)
    pw = _draw_date_pill(banner, title_x, pill_y, date_text, h=int(74 * sc / 1.2) if False else 74)
    _draw_note_pill(banner, title_x + pw + 18, pill_y, PAIR_NOTE, h=74)
    return banner


def _draw_note_pill(img, x, y, text, h=74):
    """Small header pill: 'All pairs: XAUUSD' (pair column shows only id + direction)."""
    d = ImageDraw.Draw(img)
    lab, val = text.split(":", 1) if ":" in text else ("", text)
    f_l, f_v = _font(30, 600), _font(32, 800)
    lw, _ = _measure(lab + ":", f_l) if lab else (0, 0)
    vw, _ = _measure(val.strip(), f_v)
    pad, gap = 26, 10
    width = pad + lw + (gap if lab else 0) + vw + pad
    _rounded(d, (x, y, x + width, y + h), r=h / 2, fill=WHITE, outline=(200, 212, 228), width=2)
    cx = x + pad
    if lab:
        d.text((cx, y + h / 2), lab + ":", font=f_l, fill=NAVY_SOFT, anchor="lm")
        cx += lw + gap
    d.text((cx, y + h / 2), val.strip(), font=f_v, fill=BLUE, anchor="lm")
    return width


# ---------------------------------------------------------------------------
# Page chrome
# ---------------------------------------------------------------------------

def _bg_gradient(size):
    w, h = size
    sw, sh = 80, 102
    small = Image.new("RGB", (sw, sh), BG_BOT)
    px = small.load()
    for y in range(sh):
        fy = y / max(1, sh - 1)
        top_mix = max(0.0, 1.0 - fy / 0.38)
        for x in range(sw):
            fx = x / max(1, sw - 1)
            top = _lerp(BG_TL, BG_TR, fx ** 0.85)
            c = _lerp(top, BG_BOT, 1.0 - top_mix * (1.0 - fy * 0.35))
            glow = max(0.0, 1.0 - math.hypot((fx - 0.92) * 1.2, (fy - 0.02) * 2.4))
            if glow:
                c = _lerp(c, (170, 214, 255), glow * 0.45)
            px[x, y] = c
    return small.resize((w, h), Image.Resampling.LANCZOS).convert("RGBA")


def _shadow(base, box, radius, blur=14, color=(160, 190, 220, 70), off=(0, 6)):
    x0, y0, x1, y1 = (int(v) for v in box)
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).rounded_rectangle(
        (x0 + off[0], y0 + off[1], x1 + off[0], y1 + off[1]), radius=radius, fill=color)
    base.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur)))


def _col_xs(tx0, tx1):
    span = tx1 - tx0
    edges = [0.00, 0.070, 0.290, 0.530, 0.810, 1.00]
    return [tx0 + span * e for e in edges]


def _status_style(row):
    if row.get("running") or row.get("reason") == "RUNNING":
        sub = f"Enter Price: {_fmt_entry(row.get('entry'))}"
        return RUN_BG, RUN_FG, "run", "Running", sub
    if row.get("reason") == "TP":
        return TP_BG, TP_FG, "tp", "Target Hit", None
    if row.get("reason") in ("FORCE",) or row.get("sys"):
        return SYS_BG, SYS_FG, "sys", "System Close", None
    return SL_BG, SL_FG, "sl", "Stoploss Hit", None


def _fmt_entry(v):
    if v is None:
        return "-"
    return f"{float(v):.5f}".rstrip("0").rstrip(".")


def _circle_icon(draw, cx, cy, r, kind):
    if kind == "tp":
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=TP_FG)
        w = max(3, int(r * 0.32))
        draw.line([(cx - r * 0.42, cy + r * 0.02), (cx - r * 0.08, cy + r * 0.40),
                   (cx + r * 0.48, cy - r * 0.38)], fill=WHITE, width=w, joint="curve")
    elif kind == "sl":
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=SL_FG)
        w = max(3, int(r * 0.32))
        draw.line([(cx - r * 0.40, cy), (cx + r * 0.40, cy)], fill=WHITE, width=w)
    elif kind == "run":
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=RUN_FG, width=max(3, int(r * 0.22)))
        bb = (cx - r * 0.52, cy - r * 0.52, cx + r * 0.52, cy + r * 0.52)
        draw.arc(bb, start=40, end=300, fill=RUN_FG, width=max(3, int(r * 0.22)))
        ang = math.radians(40)
        ax, ay = cx + r * 0.52 * math.cos(ang), cy + r * 0.52 * math.sin(ang)
        draw.polygon([(ax, ay), (ax + r * 0.30, ay - r * 0.08), (ax + r * 0.04, ay - r * 0.34)], fill=RUN_FG)
    elif kind == "sys":
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=SYS_FG)
        f = _font(int(r * 1.15), 800)
        draw.text((cx, cy - 1), "×", font=f, fill=WHITE, anchor="mm")
    elif kind == "info":
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=DISCLAIM, width=max(2, int(r * 0.18)))
        f = _font(int(r * 1.35), 700)
        draw.text((cx, cy - r * 0.08), "i", font=f, fill=DISCLAIM, anchor="mm")


def _draw_pill(img, box, label, value, accent, border=None, fl=(32, 600), fv=(38, 800)):
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = box
    h = y1 - y0
    border = border or accent
    _rounded(d, box, r=h / 2, fill=WHITE, outline=border, width=3)
    wash = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(wash).rounded_rectangle(box, radius=h / 2, fill=accent + (18,))
    img.alpha_composite(wash)
    d = ImageDraw.Draw(img)
    mid_y = (y0 + y1) / 2
    f_l, f_v = _font(*fl), _font(*fv)
    lw, _ = _measure(label, f_l)
    vw, _ = _measure(value, f_v)
    gap = 8
    total = lw + gap + vw
    lx = (x0 + x1) / 2 - total / 2
    d.text((lx, mid_y), label, font=f_l, fill=NAVY_SOFT, anchor="lm")
    d.text((lx + lw + gap, mid_y), value, font=f_v, fill=accent, anchor="lm")


def _hidden_pills(hidden):
    """Overflow pills for the hidden subset only (counts / pips / $ of those rows)."""
    run = tp = sl = 0
    pips = net = 0.0
    for r in hidden:
        if r.get("running") or r.get("reason") == "RUNNING":
            run += 1
            continue
        if r.get("reason") == "TP":
            tp += 1
        elif r.get("reason") in ("FORCE",) or r.get("sys"):
            pass
        else:
            sl += 1
        pips += float(r.get("pips") or 0)
        net += float(r.get("net") or 0)
    return run, tp, sl, pips, net


def _draw_overflow_box(img, box, hidden):
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = box
    _rounded(d, box, r=30, fill=(248, 251, 255), outline=BLUE, width=4)
    n = len(hidden)
    title = f"{n} more signal{'s' if n != 1 else ''} not shown here — their results:"
    d.text(((x0 + x1) / 2, y0 + 40), title, font=_font(44, 700), fill=NAVY, anchor="mt")
    run, tp, sl, pips, net = _hidden_pills(hidden)
    items = [
        ("Running  ", str(run), RUN_FG),
        ("TP Hit  ", str(tp), TP_FG),
        ("SL Hit  ", str(sl), SL_FG),
        ("Net Pips  ", _fmt_pips_footer(pips), TP_FG if pips >= 0 else SL_FG),
        ("Net $  ", _fmt_money(net), TP_FG if net >= 0 else SL_FG),
    ]
    inner, py, ph, gap = 30, y0 + 112, 96, 16
    avail = (x1 - x0) - inner * 2
    pw = (avail - gap * 4) / 5
    x = x0 + inner
    for lab, val, acc in items:
        _draw_pill(img, (x, py, x + pw, py + ph), lab.strip(), val, acc)
        x += pw + gap


def _draw_footer_pills(img, y, totals, tx0, tx1):
    """Footer uses the FULL period totals (same numbers as the text summary)."""
    net, pips = totals["net"], totals["pips"]
    items = [
        ("Total Signals Sent: ", str(totals["total"]), BLUE),
        ("Win Rate: ", _fmt_wr(totals["wr"]), TP_FG),
        ("Net Pips: ", _fmt_pips_footer(pips), TP_FG if pips >= 0 else SL_FG),
        ("Net PnL: ", _fmt_money(net), TP_FG if net >= 0 else SL_FG),
    ]
    n, gap, ph = 4, 20, 96
    pw = ((tx1 - tx0) - gap * (n - 1)) / n
    x = tx0
    for lab, val, acc in items:
        _draw_pill(img, (x, y, x + pw, y + ph), lab.strip(), val, acc)
        x += pw + gap
    return y + ph


def _short_id(sid):
    """'S078' -> '078', 'S1000' -> '1000' (same zero padding / growth as the bot ids)."""
    sid = str(sid or "").strip().lstrip("#")
    i = 0
    while i < len(sid) and sid[i].isalpha():
        i += 1
    rest = sid[i:]
    return rest if rest else sid


def _pair_label(row):
    """Text part of the PAIR cell: '#078' and 'BUY' / 'SELL' (emoji is drawn between them)."""
    sid = _short_id(row.get("id"))
    d = (row.get("direction") or "").upper()
    return (f"#{sid}" if sid else ""), d


def _emoji(kind, size):
    key = (kind, int(size))
    if key in _EMOJI_CACHE:
        return _EMOJI_CACHE[key]
    path = EMOJI_UP if kind == "up" else EMOJI_DOWN
    im = None
    if os.path.isfile(path):
        try:
            im = Image.open(path).convert("RGBA").resize((int(size), int(size)), Image.Resampling.LANCZOS)
        except Exception:
            im = None
    _EMOJI_CACHE[key] = im
    return im


def _draw_pair_cell(img, x, mid, row, f_id, f_dir, size=50):
    """'#078 📈 BUY' — id navy, chart emoji, direction navy. Falls back to a drawn arrow."""
    d = ImageDraw.Draw(img)
    sid, dr = _pair_label(row)
    if sid:
        d.text((x, mid), sid, font=f_id, fill=NAVY, anchor="lm")
        x += _measure(sid, f_id)[0] + 18
    if dr:
        kind = "up" if dr == "BUY" else "down"
        em = _emoji(kind, size)
        if em is not None:
            img.alpha_composite(em, (int(x), int(mid - size / 2)))
        else:
            col = TP_FG if kind == "up" else SL_FG
            s_ = size * 0.42
            pts = [(x + size / 2, mid - s_), (x + size / 2 - s_, mid + s_ * 0.6), (x + size / 2 + s_, mid + s_ * 0.6)] \
                if kind == "up" else [(x + size / 2, mid + s_), (x + size / 2 - s_, mid - s_ * 0.6), (x + size / 2 + s_, mid - s_ * 0.6)]
            d.polygon(pts, fill=col)
        x += size + 14
        d = ImageDraw.Draw(img)
        d.text((x, mid), dr, font=f_dir, fill=NAVY, anchor="lm")
    return ImageDraw.Draw(img)


def render_one_page(rows, totals, *, title_navy, title_blue, date_text,
                    start_no, page_i, page_n, hidden, disclaimer, header_base=None):
    n = len(rows)
    has_ov = bool(hidden)

    # Geometry — up to 22 rows, 2400-wide portrait, full grid like the reference card
    native_h = header_base.size[1] if header_base is not None else int(round(HEADER_NATIVE[1] * W / HEADER_NATIVE[0]))
    gap, thead_h, row_h = 18, 120, 138
    ov_h = 244 if has_ov else 0
    pills_h, disc_h = 96, 92
    table_x0, table_x1 = 24, W - 24

    y_thead = 8 + native_h + gap
    y_rows = y_thead + thead_h
    y_after = y_rows + n * row_h
    y = y_after + 24
    y_ov = None
    if has_ov:
        y_ov = y
        y = y_ov + ov_h + 20
    y_pills = y
    y = y_pills + pills_h + 24
    y_disc = y
    H = y_disc + disc_h + 22

    img = _bg_gradient((W, H))
    if header_base is not None:
        hx = (W - header_base.size[0]) // 2
        img.alpha_composite(header_base, (hx, 8))
    else:
        banner = compose_header(W, title_navy, title_blue, date_text)
        img.alpha_composite(banner, ((W - banner.size[0]) // 2, 8))

    _shadow(img, (table_x0, y_thead, table_x1, y_after), radius=22, blur=12,
            color=(160, 190, 220, 60), off=(0, 5))
    cols = _col_xs(table_x0, table_x1)

    head = Image.new("RGBA", img.size, (0, 0, 0, 0))
    hd = ImageDraw.Draw(head)
    hd.rounded_rectangle((table_x0, y_thead, table_x1, y_after), radius=22, fill=BLUE)
    hd.rectangle((table_x0, y_thead + 22, table_x1, y_thead + thead_h), fill=BLUE)
    img.alpha_composite(head)
    d = ImageDraw.Draw(img)
    f_h = _font(44, 750)
    for i, lab in enumerate(["#", "PAIR", "STATUS", "PIPS / $", "DURATION"]):
        d.text(((cols[i] + cols[i + 1]) / 2, y_thead + thead_h / 2), lab, font=f_h, fill=WHITE, anchor="mm")

    f_num = _font(46, 700)
    f_id = _font(46, 700)
    f_dir = _font(44, 650)
    f_status = _font(46, 500)
    f_sub = _font(30, 500)
    f_pips = _font(46, 700)
    f_dur = _font(46, 500)

    for i, row in enumerate(rows):
        ry0 = y_rows + i * row_h
        ry1 = ry0 + row_h
        bg, fg, kind, label, sub = _status_style(row)
        last = i == n - 1
        if last:
            rr = Image.new("RGBA", img.size, (0, 0, 0, 0))
            rd = ImageDraw.Draw(rr)
            rd.rounded_rectangle((table_x0, ry0, table_x1, ry1), radius=22, fill=bg + (255,))
            rd.rectangle((table_x0, ry0, table_x1, ry0 + 22), fill=bg + (255,))
            img.alpha_composite(rr)
            d = ImageDraw.Draw(img)
        else:
            d.rectangle((table_x0, ry0, table_x1, ry1), fill=bg)
        mid = (ry0 + ry1) / 2
        d.text(((cols[0] + cols[1]) / 2, mid), str(start_no + i), font=f_num, fill=BLUE, anchor="mm")
        d = _draw_pair_cell(img, cols[1] + 34, mid, row, f_id, f_dir, size=54)
        icon_r, icon_x = 24, cols[2] + 64
        text_x = icon_x + icon_r + 22
        if sub:
            _circle_icon(d, icon_x, mid - 8, icon_r, kind)
            d.text((text_x, mid - 18), label, font=f_status, fill=fg, anchor="lm")
            d.text((text_x, mid + 26), sub, font=f_sub, fill=fg, anchor="lm")
        else:
            _circle_icon(d, icon_x, mid, icon_r, kind)
            d.text((text_x, mid), label, font=f_status, fill=fg, anchor="lm")
        cx = (cols[3] + cols[4]) / 2
        if row.get("running"):
            d.text((cx, mid), "-", font=f_pips, fill=MUTED, anchor="mm")
        else:
            d.text((cx, mid), _fmt_pips_money(row.get("pips") or 0, row.get("net") or 0),
                   font=f_pips, fill=fg, anchor="mm")
        dur = "-" if row.get("running") else _fmt_dur(row.get("duration"))
        d.text(((cols[4] + cols[5]) / 2, mid), dur, font=f_dur, fill=NAVY_SOFT, anchor="mm")

    # Grid: horizontal rule between every row, vertical rule between every column (header + body)
    d = ImageDraw.Draw(img)
    for i in range(1, n):
        yy = y_rows + i * row_h
        d.line([(table_x0, yy), (table_x1, yy)], fill=GRID, width=2)
    if n:
        d.line([(table_x0, y_rows), (table_x1, y_rows)], fill=GRID, width=2)
    for xdiv in cols[1:-1]:
        xi = int(round(xdiv))
        d.line([(xi, y_thead), (xi, y_rows - 1)], fill=(110, 158, 246), width=2)
        if n:
            d.line([(xi, y_rows), (xi, y_after - 1)], fill=GRID, width=2)
    if n:
        d.rounded_rectangle((table_x0, y_rows - 22, table_x1, y_after), radius=22, outline=GRID, width=2)
        d.rectangle((table_x0, y_rows - 22, table_x1, y_rows - 1), fill=BLUE)
        for xdiv in cols[1:-1]:
            xi = int(round(xdiv))
            d.line([(xi, y_thead), (xi, y_rows - 1)], fill=(110, 158, 246), width=2)

    if has_ov and y_ov is not None:
        _draw_overflow_box(img, (table_x0, y_ov, table_x1, y_ov + ov_h), hidden)

    _draw_footer_pills(img, y_pills, totals, table_x0 + 16, table_x1 - 16)
    d = ImageDraw.Draw(img)
    d.line([(table_x0 + 8, y_disc), (table_x1 - 8, y_disc)], fill=(220, 226, 236), width=2)
    _circle_icon(d, table_x0 + 30, y_disc + 40, 17, "info")
    d.text((table_x0 + 58, y_disc + 40), disclaimer, font=_font(30, 500), fill=DISCLAIM, anchor="lm")
    if page_n > 1:
        d.text((table_x1 - 8, y_disc + 40), f"Page {page_i}/{page_n}", font=_font(30, 600),
               fill=PAGE_FG, anchor="rm")

    rgb = Image.new("RGB", img.size, BG_BOT)
    rgb.paste(img, mask=img.split()[-1])
    img.close()
    return rgb


def _png_bytes(im):
    buf = BytesIO()
    im.save(buf, "PNG", optimize=True, compress_level=6)
    return buf.getvalue()


def render_from_dataset(ds, period="DAILY", out_dir=None, prefix="report",
                        disclaimer="Past performance is not indicative of future results. Trade responsibly."):
    """Render up to 2 pages from a report_dataset() dict.

    Footer pills always use ds['totals'] (the same figures as the text summary),
    even when some trades are hidden in the overflow box.
    Returns dict(paths=..., pngs=..., totals=ds['totals'], pages=N, hidden=M).
    """
    period = (period or "DAILY").upper()
    title_navy, title_blue = "GOLD", f"{period} PNL REPORT"
    date_text = fmt_range(ds["start"], ds["end"])
    pages, start_no, hidden = paginate_rows(ds["rows"])
    totals = ds["totals"]
    n_pages = len(pages)
    with _LOCK:
        header = compose_header(W, title_navy, title_blue, date_text)
        pngs, paths = [], []
        num = start_no
        try:
            for i, chunk in enumerate(pages):
                is_last = i == n_pages - 1
                im = render_one_page(
                    chunk, totals,
                    title_navy=title_navy, title_blue=title_blue, date_text=date_text,
                    start_no=num, page_i=i + 1, page_n=n_pages,
                    hidden=hidden if is_last and hidden else [],
                    disclaimer=disclaimer, header_base=header,
                )
                try:
                    data = _png_bytes(im)
                    pngs.append(data)
                    if out_dir:
                        Path(out_dir).mkdir(parents=True, exist_ok=True)
                        path = os.path.join(out_dir, f"{prefix}_p{i + 1}.png")
                        with open(path, "wb") as f:
                            f.write(data)
                        paths.append(path)
                finally:
                    im.close()
                num += len(chunk)
        finally:
            header.close()
            gc.collect()
    return dict(paths=paths, pngs=pngs, totals=totals, pages=n_pages,
                hidden=len(hidden), shown=sum(len(p) for p in pages),
                start_no=start_no, date_text=date_text)
