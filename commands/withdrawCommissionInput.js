/*CMD
  command: withdrawCommissionInput
  help: 
  need_reply: true
  auto_retry_time: 
  folder: 

  <<ANSWER

  ANSWER

  <<KEYBOARD

  KEYBOARD
  aliases: 
  group: 
CMD*/

/* Command: withdrawCommissionInput */
if (!message) return;

// 📊 Get balances & parse input
const userId = user.telegramid;
const refRes = Libs.ResourcesLib.userRes("refCommission");
const refBal = refRes.value() || 0;
const minW   = 0.01;
const amt    = parseFloat(message);

// 🚫 Validate amount
if (isNaN(amt) || amt < minW || amt > refBal) {
  return Api.sendMessage({
    text:
      "❌ <b>Invalid amount!</b>\n" +
      "Enter between <code>" + minW.toFixed(2) + "</code> and <code>" + refBal.toFixed(2) + "</code> USDT.",
    parse_mode: "html"
  });
}

// ⚡ Deduct & save pending
refRes.add(-amt);
const pendKey = "pendingRefW_" + userId;
const pd = {
  amount: amt,
  wallet: User.getProperty("wallet"),
  time:   new Date().toISOString()
};
Bot.setProperty(pendKey, pd, "json");

// ✅ Acknowledge user
Api.sendMessage({
  text: `<b>✅ Your request for ${amt.toFixed(2)} USDT has been recorded.</b>\nWaiting for  approval estimated time 30 min to 12 hours max.`,
  parse_mode: "html"
});

// ──────────────────────────────────────────────────────────
// 🔔 RICH ADMIN PANEL
// ──────────────────────────────────────────────────────────

// 👥 Referred By
let refByText = "Not referred";
const rif = Bot.getProperty("referrer_" + userId);
if (rif) {
  const f  = Bot.getProperty("firstName_" + rif) || "";
  const l  = Bot.getProperty("lastName_"  + rif) || "";
  const u  = Bot.getProperty("username_"  + rif) || "";
  const fn = (f + " " + l).trim() || "User";
  refByText = `<a href="tg://user?id=${rif}">${fn}</a>` +
              (u ? ` (@${u})` : "") +
              ` — ID: <code>${rif}</code>`;
}

// 💳 Withdrawal Totals
const whist = Bot.getProperty("withdrawalHistory_" + userId) || [];
let manual=0, auto=0;
if (Array.isArray(whist)) whist.forEach(r => {
  const x = parseFloat(r.amount) || 0;
  r.type === "manual" ? manual += x : auto += x;
});

// ⚡ VIP Plan Stats (days & earnings)
const vipDefs = { "VIP 1":1.2, "VIP 2":7.5, "VIP 3":39.0, "VIP 4":270.0, "VIP 5":960.0, "VIP 6":2880.0 };
let mHist = [];
try { mHist = JSON.parse(User.getProperty("miningHistory") || "[]"); } catch {}
const now = Date.now();
const grp = { "VIP 1":[], "VIP 2":[], "VIP 3":[], "VIP 4":[], "VIP 5":[], "VIP 6":[] };
mHist.forEach(rec => {
  const m = (rec.planName||"").match(/VIP\s*\d+/);
  const k = m ? m[0].trim() : null;
  if (k && grp[k]) {
    const days   = Math.min(rec.expirationDays||0, Math.floor((now - rec.purchaseTimestamp)/86400000));
    const profit = (vipDefs[k]||0) * days;
    grp[k].push({ day: days, profit });
  }
});
let vipTxt = "\n\n<b>⚡ VIP Plan Stats:</b>\n";
Object.keys(grp).forEach(plan => {
  vipTxt += `🔹 <b>${plan}:</b> ${grp[plan].length} running\n`;
  grp[plan].forEach(p => {
    vipTxt += `    • <b>Day ${p.day}</b> (~<b>${p.profit.toFixed(2)} USDT</b>)\n`;
  });
});

// 👥 Referral Breakdown
const refs    = JSON.parse(Bot.getProperty("referralList_" + userId) || "[]");
const refSubs = JSON.parse(Bot.getProperty("referralData_" + userId) || "{}");
let refList  = "";
if (refs.length) {
  refList = `\n\n<b>👥 Referrals (${refs.length}):</b>\n`;
  refs.forEach(id => {
    const o = refSubs[id] || {};
    refList +=
      `• ${o.firstName||""} ${o.lastName||""}` +
      (o.username?` (@${o.username})` : "") +
      ` — ID: <code>${id}</code>\n` +
      `    • Deposit: <b>${(o.totalDeposit||0).toFixed(2)} USDT</b>, Comm: <b>${(o.totalCommission||0).toFixed(2)} USDT</b>\n`;
  });
}

// 💼 Totals & Current Balance
const totDep = (Number(Bot.getProperty("totalDeposits_" + userId))||0).toFixed(2);
const curBal = Libs.ResourcesLib.userRes("balance").value().toFixed(4);

// ✉️ Compose admin message
const adminText =
  "🔔 <b>New Referral Withdraw Request</b>\n\n" +
  `👤 User: ${user.first_name}${user.username?` (@${user.username})`:``}\n` +
  `🆔 ID: <code>${userId}</code>\n` +
  `💸 Amount: <b>${amt.toFixed(2)} USDT</b>\n` +
  `🏦 Wallet: <code>${pd.wallet}</code>\n` +
  `<b>👥 Referred By:</b> ${refByText}\n\n` +
  `<b>💰 Total Deposits:</b> ${totDep} USDT\n` +
  `<b>🏦 Current Balance:</b> ${curBal} USDT\n` +
  `<b>💳 Manual Withdrawals:</b> ${manual.toFixed(2)} USDT\n` +
  `<b>🤖 Auto Withdrawals:</b> ${auto.toFixed(2)} USDT` +
  vipTxt +
  refList +
  "\n👉 Select an action below:";

// 🎛️ Admin action buttons
const buttons = [[
  { text:"💵 Approve",       callback_data:`/payrefer ${userId} ${amt.toFixed(2)}` },
  { text:"❌ Cancel/Refund",  callback_data:`/cancel_refund ${userId} ${amt.toFixed(2)}` }
]];
const adminId  = Bot.getProperty("admin"),
      alertCh  = Bot.getProperty("alertsChannel");
if (adminId)   Api.sendMessage({ chat_id:adminId, text:adminText,    reply_markup:{ inline_keyboard:buttons }, parse_mode:"html" });
if (alertCh)   Api.sendMessage({ chat_id:alertCh, text:adminText,    reply_markup:{ inline_keyboard:buttons }, parse_mode:"html" });
