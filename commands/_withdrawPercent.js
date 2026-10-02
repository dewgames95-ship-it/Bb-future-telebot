/*CMD
  command: /withdrawPercent
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

/* Command: /withdrawPercent */

if (request.data.startsWith("/withdrawPercent")) {
  // 1️⃣ Parse percentage
  var params = request.data.split(" ");
  var percentage = parseFloat(params[1]);
  if (![25, 50, 75, 100].includes(percentage)) {
    Api.sendMessage({ text: "<i>⚠️ Invalid percentage selected.</i>", parse_mode: "html" });
    return;
  }

  // 2️⃣ Get wallet and profit balance
  var wallet = User.getProperty("wallet");
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    Api.sendMessage({
      text: "<i>⚠️ Invalid or missing USDT (BEP20) wallet.</i>",
      parse_mode: "html"
    });
    return;
  }

  var minerProfitBalance = Libs.ResourcesLib.userRes("minerProfitBalance");
  var balance = Libs.ResourcesLib.userRes("balance");
  var minW = parseFloat(Bot.getProperty("minimumWithdraw") || 0);
  var maxW = parseFloat(Bot.getProperty("maximumWithdraw") || 0);

  // 3️⃣ Calculate withdrawal amount
  var amount;
  if (percentage === 100) {
    // Round down to 1 decimal place for 100% to avoid precision issues
    amount = Math.floor(minerProfitBalance.value() * 10) / 10;
  } else {
    // Round to 2 decimal places for other percentages
    amount = (minerProfitBalance.value() * (percentage / 100)).toFixed(2);
    amount = parseFloat(amount);
  }

  // 4️⃣ Validate amount
  if (amount < minW) {
    Api.sendMessage({ text: `<i>⚠️ ${percentage}% is below minimum withdrawal: </i><code>${minW} USDT</code>`, parse_mode: "html" });
    return Bot.runCommand("🏧 Withdraw Funds");
  }
  if (amount > maxW) {
    Api.sendMessage({ text: `<i>⚠️ ${percentage}% exceeds maximum withdrawal: </i><code>${maxW} USDT</code>`, parse_mode: "html" });
    return Bot.runCommand("🏧 Withdraw Funds");
  }
  if (amount > minerProfitBalance.value()) {
    Api.sendMessage({ text: `<i>⚠️ ${percentage}% exceeds available profit: </i><code>${minerProfitBalance.value().toFixed(4)} USDT</code>`, parse_mode: "html" });
    return Bot.runCommand("🏧 Withdraw Funds");
  }
  if (amount > balance.value()) {
    Api.sendMessage({ text: "<i>⚠️ Amount exceeds your balance.</i>", parse_mode: "html" });
    return Bot.runCommand("🏧 Withdraw Funds");
  }

  // 5️⃣ Calculate commission and balance left
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
  var balanceLeft = minerProfitBalance.value() - amount;

  // 6️⃣ Edit message with calculated details
  var pctText = (commissionRate * 100).toFixed(0);
  var text = `<b>✅ ${percentage}% Amount Details</b>\n\n` +
             `<b>💰 Requested:</b> <code>${amount.toFixed(2)} USDT</code>\n` +
             `<b>🤖 Commission (${pctText}%):</b> <code>${commission.toFixed(2)} USDT</code>\n` +
             `<b>💸 Network Fee:</b> <code>${feeText}</code>\n` +
             `<b>👉 To Receive:</b> <code>${netAmount.toFixed(2)} USDT</code>\n` +
             `<b>🏦 Wallet:</b> <code>${wallet}</code>\n` +
             `<b>💳 Balance Left:</b> <code>${balanceLeft.toFixed(2)} USDT</code>\n\n` +
             `<b>✅ Tap to Proceed or Back 👇</b>`;
  var buttons = [
    [
      { text: "✅ Proceed", callback_data: `/processWithdrawal ${amount}` },
      { text: "🔙 Back", callback_data: "/showWithdrawFunds" }
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
