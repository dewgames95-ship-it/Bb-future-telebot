/*CMD
  command: /payManual
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

// /*––––––[ /payManual ]––––––*/
if (request.data) {
  // Extract target user ID and withdrawal amount from callback data
  var params = request.data.split(" "); // Expected format: "/pay_manual <userId> <amount>"
  var targetUserId = params[1];
  var amount = parseFloat(params[2]);

  // Store parameters for later use (bot-level keys)
  Bot.setProperty("payTargetUserId", targetUserId, "string");
  Bot.setProperty("payTargetAmount", amount, "float");

  Api.sendMessage({
    text: "✏️ Please send the custom message you want to send to the user.",
    parse_mode: "html"
  });
  return;
} else {
  // Process the admin's custom message.
  var customMessage = message;
  if (!customMessage || customMessage.trim() === "") {
    Api.sendMessage({
      text: "<i>⚠️ Please provide a custom message.</i>",
      parse_mode: "html"
    });
    return;
  }

  var targetUserId = Bot.getProperty("payTargetUserId");
  var amount       = Bot.getProperty("payTargetAmount");
  if (!targetUserId || isNaN(amount)) {
    Api.sendMessage({
      text: "⚠️ Error: Missing payment parameters.",
      parse_mode: "html"
    });
    return;
  }

  // Retrieve the pending withdrawal data using a user-specific key
  var pendingKey = "pendingWithdrawal_" + targetUserId;
  var pendingData = Bot.getProperty(pendingKey);
  if (!pendingData) {
    Api.sendMessage({
      text: "⚠️ Error: No pending withdrawal found for this user.",
      parse_mode: "html"
    });
    return;
  }

  // Extract stored details from the pending data
  var walletAddress      = pendingData.wallet;
  var commission         = pendingData.commission;
  var netAmount          = pendingData.netAmount;
  var commissionRate     = pendingData.commissionRate;
  var commissionPercentage = (commissionRate * 100).toFixed(0);

  // Update withdrawal history (stored as a bot-level property with user id)
  var histKey = "withdrawalHistory_" + targetUserId;
  var withdrawalHistory = Bot.getProperty(histKey, []);
  if (!Array.isArray(withdrawalHistory)) {
    withdrawalHistory = [];
  }
  var newRecord = {
    amount: pendingData.amount.toFixed(2),  // NEW: Use requested amount, not net
    date: new Date().toLocaleString("en-US", { timeZone: "Asia/kolkata" }),
    wallet: walletAddress,
    type: "manual"
  };
  withdrawalHistory.push(newRecord);
  Bot.setProperty(histKey, withdrawalHistory, "json");

  // Update manual withdrawal count for target user (store with a unique key)
  var manualWithdrawCountKey = "manualWithdrawCount_" + targetUserId;
  var manualWithdrawCount = Number(Bot.getProperty(manualWithdrawCountKey) || 0);
  manualWithdrawCount++;
  Bot.setProperty(manualWithdrawCountKey, manualWithdrawCount, "string");

  // Retrieve auto withdrawal count for target user
  var autoWithdrawCount = Number(Bot.getProperty("autoWithdrawCount_" + targetUserId) || 0);

  // Clear the pending withdrawal record
  Bot.setProperty(pendingKey, "", "string");

  // Add to global recent withdrawals
  var recentWithdrawals = Bot.getProperty("recentWithdrawals") ? JSON.parse(Bot.getProperty("recentWithdrawals")) : [];
  recentWithdrawals.push({
    userId: targetUserId,
    amount: pendingData.amount.toFixed(1),
    timestamp: Date.now()
  });
  recentWithdrawals = recentWithdrawals.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
  Bot.setProperty("recentWithdrawals", JSON.stringify(recentWithdrawals), "string");

  // Fetch cumulative stats from bot-level properties
  var totalDeposits = Number(Bot.getProperty("totalDeposits_" + targetUserId) || 0);
  
  // Loop over the withdrawal history to sum manual and auto withdrawals
  var manualTotal = 0;
  var autoTotal = 0;
  var withdrawalHistoryAll = Bot.getProperty("withdrawalHistory_" + targetUserId, []);
  if (Array.isArray(withdrawalHistoryAll)) {
    for (var j = 0; j < withdrawalHistoryAll.length; j++) {
      var rec = withdrawalHistoryAll[j];
      var amt = parseFloat(rec.amount) || 0;
      if (rec.type === "manual") {
        manualTotal += amt;
      } else if (rec.type === "auto") {
        autoTotal += amt;
      }
    }
  }

  // Combine manual and auto withdrawals for the new alert
  var totalWithdrawn = (manualTotal + autoTotal).toFixed(2);

  // Compose the admin confirmation message (HTML formatted)
  var adminMessage =
    "✅ <b>Payment has been processed successfully for the user.</b>\n" +
    "🆔 <b>User ID:</b> <code>" + targetUserId + "</code>\n\n" +
    "💰 <b>Requested Amount:</b> " + pendingData.amount.toFixed(2) + " USDT\n" +
    "🤖 <b>Bot Commission (" + commissionPercentage + "%):</b> " + commission.toFixed(2) + " USDT\n" +
    "👉 <b>Amount Paid:</b> " + netAmount.toFixed(2) + " USDT\n" +
    "🏦 <b>Wallet:</b> <code>" + walletAddress + "</code>\n\n" +
    "💳 <b>Total Deposits:</b> " + totalDeposits.toFixed(2) + " USDT\n" +
    "💼 <b>Manual Withdrawals:</b> " + manualTotal.toFixed(2) + " USDT\n" +
    "🤖 <b>Auto Withdrawals:</b> " + autoTotal.toFixed(2) + " USDT\n" +
    "📊 <b>Auto Withdraw Count:</b> " + autoWithdrawCount + "\n" +
    "📊 <b>Manual Withdraw Count:</b> " + manualWithdrawCount;

  // Send the admin confirmation message
  Api.sendMessage({ text: adminMessage, parse_mode: "html" });

  // Send an alert to the alert channel with the same details.
  var alertChannel = "@combobotalert";
  Api.sendMessage({ chat_id: alertChannel, text: adminMessage, parse_mode: "html" });

  // Fetch miningHistory from Bot properties
  var miningHistoryRaw = Bot.getProperty("miningHistory_" + targetUserId) || "[]";
  var miningHistory = [];
  try {
    miningHistory = JSON.parse(miningHistoryRaw);
  } catch (e) {
    miningHistory = [];
  }

  // Trigger the new /alertcombo command to send the detailed alert to @FutureComboBot_Stats only if customMessage is not "/no"
  if (customMessage.trim() !== "/no") {
    Bot.run({
      command: "/alertcombo",
      options: {
        targetUserId: targetUserId,
        gross: pendingData.amount.toFixed(2),
        net: netAmount.toFixed(2),
        totalDeposits: totalDeposits.toFixed(2),
        totalWithdrawn: totalWithdrawn,
        txid: customMessage,
        miningHistory: miningHistory // Pass the fetched miningHistory
      }
    });
  }

  // Send a detailed message to the target user with new format and buttons
  var messageToUser =
    "✅ <b>Withdrawal Successful!</b>\n\n" +
    "<b>Requested:</b> " + pendingData.amount.toFixed(2) + " USDT\n" +
    "<b>🤖 Commission (" + commissionPercentage + "%):</b> " + commission.toFixed(2) + " USDT\n" +
    "<b>💸 Network Fee:</b> " + pendingData.networkFee + " USDT\n" +
    "<b>👉 Received:</b> " + netAmount.toFixed(2) + " USDT\n" +
    "<b>🏦 Wallet:</b> <code>" + walletAddress + "</code>\n\n" +
    "<b>Transaction Receipt: https://t.me/futurecombobot_stats</b>\n\n" +
    "<b>💬 Share your feedback & Get Bonus</b>\n" +
    "💎 @FutureComboBot_Support";

  Bot.sendMessageToChatWithId(targetUserId, messageToUser, { 
    parse_mode: "html",
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [{ text: "Check Your Transaction Receipt 👉", url: "https://t.me/futurecombobot_stats" }],
        [{ text: "🔙 Back To Main Menu", callback_data: "/mainMenu" }]
      ]
    }
  });

  // Clear stored parameters
  Bot.setProperty("payTargetUserId", "", "string");
  Bot.setProperty("payTargetAmount", 0, "float");

  // New: Increment withdrawal count since last bonus, trigger bonusalert if conditions met
  var countKey = "withdraw_count_since_last_bonus_" + targetUserId;
  var count = Number(Bot.getProperty(countKey, 0)) + 1;
  Bot.setProperty(countKey, count, "integer");

  var active = Bot.getProperty("bonus_active_session_" + targetUserId, false);
  if ((count === 1 || count === 3) && !active) {
    Bot.run({
      command: "/bonusalert",
      options: { userId: targetUserId }
    });
  }
}
