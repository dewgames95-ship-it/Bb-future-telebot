/*CMD
  command: /processWithdrawal
  help: 
  need_reply: false
  auto_retry_time: 
  folder: 

  <<ANSWER

  ANSWER

  <<KEYBOARD

  KEYBOARD
  aliases: 
  group: 
CMD*/

/* Command: /processWithdrawal */

if (request.data.startsWith("/processWithdrawal")) {
  // 1️⃣ Parse amount
  var params = request.data.split(" ");
  var amount = parseFloat(params[1]);

  // 2️⃣ Get wallet and validate
  var wallet = User.getProperty("wallet");
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    Api.editMessageText({
      chat_id: request.message.chat.id,
      message_id: request.message.message_id,
      text: "<i>⚠️ Invalid or missing USDT (BEP20) wallet.</i>",
      parse_mode: "html"
    });
    return;
  }

  // 3️⃣ Validate amount against balance and profit
  var balance = Libs.ResourcesLib.userRes("balance");
  var minerProfitBalance = Libs.ResourcesLib.userRes("minerProfitBalance");
  var minW = parseFloat(Bot.getProperty("minimumWithdraw") || 0);
  var maxW = parseFloat(Bot.getProperty("maximumWithdraw") || 0);

  if (amount < minW) {
    Api.editMessageText({
      chat_id: request.message.chat.id,
      message_id: request.message.message_id,
      text: `<i>⚠️ Amount is below minimum withdrawal: </i><code>${minW} USDT</code>`,
      parse_mode: "html"
    });
    return;
  }
  if (amount > maxW) {
    Api.editMessageText({
      chat_id: request.message.chat.id,
      message_id: request.message.message_id,
      text: `<i>⚠️ Amount exceeds maximum withdrawal: </i><code>${maxW} USDT</code>`,
      parse_mode: "html"
    });
    return;
  }
  if (amount > minerProfitBalance.value()) {
    Api.editMessageText({
      chat_id: request.message.chat.id,
      message_id: request.message.message_id,
      text: `<i>⚠️ Amount exceeds available profit: </i><code>${minerProfitBalance.value().toFixed(4)} USDT</code>`,
      parse_mode: "html"
    });
    return;
  }
  if (amount > balance.value()) {
    Api.editMessageText({
      chat_id: request.message.chat.id,
      message_id: request.message.message_id,
      text: "<i>⚠️ Amount exceeds your balance.</i>",
      parse_mode: "html"
    });
    return;
  }

  // 4️⃣ Calculate commission
  var historyString = User.getProperty("miningHistory") || "[]";
  var history = [];
  try { history = JSON.parse(historyString); } catch(e) { history = []; }
  var now = Date.now();
  var activePlans = history
    .filter(r => now - r.purchaseTimestamp < r.expirationDays * 86400000)
    .map(r => r.planName);

  var commissionRate = 0.30;
  if (activePlans.some(r => r.startsWith("VIP 6"))) commissionRate = 0.01;
  else if (activePlans.some(r => r.startsWith("VIP 5"))) commissionRate = 0.05;
  else if (activePlans.some(r => r.startsWith("VIP 4"))) commissionRate = 0.10;
  else if (activePlans.some(r => r.startsWith("VIP 3"))) commissionRate = 0.20;

  var commission = amount * commissionRate;

  // NEW: Get withdrawal history for network fee condition
  var withdrawHistory = Bot.getProperty("withdrawalHistory_" + user.telegramid) || [];
  if (!Array.isArray(withdrawHistory)) withdrawHistory = [];
  var withdrawCount = withdrawHistory.length;
  var networkFee = withdrawCount < 2 ? 0 : 0.25;
  var feeText = networkFee === 0 ? "0 USDT <s>0.25$</s>" : networkFee.toFixed(2) + " USDT";

  var netAmount = amount - commission - networkFee;

  // 5️⃣ Deduct from balances
  balance.remove(amount);
  minerProfitBalance.remove(amount);

  // 6️⃣ Store pending withdrawal
  Bot.setProperty("pendingWithdrawal_" + user.telegramid, {
    amount: amount,
    wallet: wallet,
    commissionRate: commissionRate,
    commission: commission,
    networkFee: networkFee,
    netAmount: netAmount,
    deducted: true
  }, "json");

  // 7️⃣ Edit message with confirmation details
  var pctText = (commissionRate * 100).toFixed(0);
  var text = `<b>⁉️ Withdrawal Confirmation</b>\n\n` +
             `<b>Requested:</b> <code>${amount.toFixed(2)} USDT</code>\n` +
             `<b>🤖 Commission (${pctText}%):</b> <code>${commission.toFixed(2)} USDT</code>\n` +
             `<b>💸 Network Fee:</b> <code>${feeText}</code>\n` +
             `<b>👉 To Receive:</b> <code>${netAmount.toFixed(2)} USDT</code>\n` +
             `<b>🏦 Wallet:</b> <code>${wallet}</code>\n\n` +
             `<b>✅ Tap to confirm or cancel 👇</b>`;
  var buttons = [
    [
      { text: "✅ Confirm", callback_data: `/confirm ${amount}` },
      { text: "❌ Cancel", callback_data: `/cancel ${amount}` }
    ]
  ];
  Api.editMessageText({
    chat_id: request.message.chat.id,
    message_id: request.message.message_id,
    text: text,
    parse_mode: "html",
    reply_markup: { inline_keyboard: buttons }
  });
}
