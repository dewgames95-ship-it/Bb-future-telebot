/*CMD
  command: /withdraw
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

//command. /withdraw
// 🚫 Ban & 🛠 Maintenance
if (Bot.getProperty(user.telegramid) === "Ban") {
  return Api.sendMessage({ text: "<i>🚫 You're banned.</i>", parse_mode: "html" });
}
if (Bot.getProperty("maintenanceStatus") === "On") {
  return Api.sendMessage({ text: "<i>🛠️ Bot under maintenance—try later.</i>", parse_mode: "html" });
}

// 🔐 Validate wallet
var wallet = User.getProperty("wallet");
if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
  return Api.sendMessage({
    text: "<i>⚠️ Invalid or missing USDT (BEP20) wallet.</i>",
    parse_mode: "html"
  });
}

// 💰 Parse & check amount
var minW = parseFloat(Bot.getProperty("minimumWithdraw") || 0);
var maxW = parseFloat(Bot.getProperty("maximumWithdraw") || 0);
var amt  = parseFloat(message);
var bal  = Libs.ResourcesLib.userRes("balance");
var prof = Libs.ResourcesLib.userRes("minerProfitBalance");

if (isNaN(amt)) {
  return Api.sendMessage({ text: "<i>⚠️ Enter a valid amount.</i>", parse_mode: "html" });
}
if (amt < minW) {
  Api.sendMessage({ text: `<i>⚠️ Min withdraw is:</i> <code>${minW} USDT</code>`, parse_mode: "html" });
  return Bot.runCommand("/mainMenu");
}
if (amt > maxW) {
  Api.sendMessage({ text: `<i>⚠️ Max withdraw is:</i> <code>${maxW} USDT</code>`, parse_mode: "html" });
  return Bot.runCommand("/mainMenu");
}
if (amt > prof.value()) {
  Api.sendMessage({
    text: `⚠️ You can withdraw up to ~${prof.value().toFixed(4)} USDT (profit only).`,
    parse_mode: "html"
  });
  return Bot.runCommand("/mainMenu");
}
if (amt > bal.value()) {
  Api.sendMessage({ text: "<i>⚠️ Amount exceeds your balance.</i>", parse_mode: "html" });
  return Bot.runCommand("/mainMenu");
}

// 🎛 Recalc commission
var raw     = User.getProperty("miningHistory") || "[]";
var history = [];
try { history = JSON.parse(raw); } catch(e){ history = []; }
var now     = Date.now();
var active  = history
  .filter(r => now - r.purchaseTimestamp < r.expirationDays * 86400000)
  .map(r => r.planName);

var rate = 0.30;
if (active.some(n => n.startsWith("VIP 6"))) rate = 0.01;
else if (active.some(n => n.startsWith("VIP 5"))) rate = 0.05;
else if (active.some(n => n.startsWith("VIP 4"))) rate = 0.10;
else if (active.some(n => n.startsWith("VIP 3"))) rate = 0.20;

var commission  = amt * rate;

// NEW: Get withdrawal history for network fee condition
var withdrawHistory = Bot.getProperty("withdrawalHistory_" + user.telegramid) || [];
if (!Array.isArray(withdrawHistory)) withdrawHistory = [];
var withdrawCount = withdrawHistory.length;
var networkFee = withdrawCount < 2 ? 0 : 0.25;
var feeText = networkFee === 0 ? "0 USDT <s>0.25$</s>" : networkFee.toFixed(2) + " USDT";

var netAmount   = amt - commission - networkFee;

// NEW: Deduct from balances here for custom amount entry
bal.remove(amt);
prof.remove(amt);

// 📥 Store pending and show confirmation
Bot.setProperty("pendingWithdrawal_" + user.telegramid, {
  amount:        amt,
  wallet:        wallet,
  commissionRate: rate,
  commission:     commission,
  networkFee:     networkFee,
  netAmount:      netAmount,
  deducted:       true
}, "json");

var pct = (rate * 100).toFixed(0);
Api.sendMessage({
  text:
    `<b>⁉️ Withdrawal Confirmation</b>\n\n` +
    `<b>Requested:</b> <code>${amt.toFixed(2)} USDT</code>\n` +
    `<b>🤖 Commission (${pct}%):</b> <code>${commission.toFixed(2)} USDT</code>\n` +
    `<b>💸 Network Fee:</b> <code>${feeText}</code>\n` +
    `<b>👉 To Receive:</b> <code>${netAmount.toFixed(2)} USDT</code>\n` +
    `<b>🏦 Wallet:</b> <code>${wallet}</code>\n\n` +
    `<b>✅ Tap to confirm or cancel 👇</b>`,
  parse_mode: "html",
  reply_markup: {
    inline_keyboard: [
      [
        { text: "✅ Confirm", callback_data: `/confirm ${amt}` },
        { text: "❌ Cancel",  callback_data: `/cancel ${amt}` }
      ]
    ]
  }
});
