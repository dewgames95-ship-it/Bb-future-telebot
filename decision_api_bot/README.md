# XAUUSD Decision API Bot (@Decision1apibot)

- Channel: https://t.me/+CoKmfs4GbjU4NzZl  (ID `-1004479619376`)
- Direction of EVERY signal (BUY / SELL) = Google AI Studio **Decisions API** (`gemini-decision-1`). No random, no skip.
  If the API fails, the signal waits and retries every 20 s (admins get one alert per 30 min).
- Lot: fixed 0.01 (no martingale). No Free / Fixed forwarder channels.
- TP/SL, sessions, charts, reports: same as the old fixed logic.
- New button: **🧠 Decision API** (reply keyboard + Menu) → stats, last decisions + accuracy, "🧪 Test decision now".

## Setup
1. Add @Decision1apibot as **admin** in the channel (post messages permission).
2. `pip install -r requirements.txt`
3. Tokens in `.env` (BOT_TOKEN, DECISION_API_KEY) — change anytime.
4. `set -a; . ./.env; set +a; python3 strategy-final.py`
5. DM the bot `/start` to arm the engine. Systemd unit: `xau_decision_bot.service` (copy folder to /opt/xau_decision_bot).
