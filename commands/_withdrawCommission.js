/*CMD
  command: /withdrawCommission
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

//command. /withdrawCommission
if (request.data === "/withdrawCommission") {
  // 🗑️ Delete trigger message
  try {
    Api.deleteMessage({
      chat_id: request.message.chat.id,
      message_id: request.message.message_id
    });
  } catch (e) {}

  // 🚫 Ban & Maintenance checks
  if (Bot.getProperty(user.telegramid) === "Ban") {
    return Api.sendMessage({ text: "<i>🚫 Access Denied!</i>", parse_mode: "html" });
  }
  if (Bot.getProperty("maintenanceStatus") === "On") {
    return Api.sendMessage({ text: "<i>🛠️ Bot under maintenance—try later.</i>", parse_mode: "html" });
  }

  // NEW: Check for pending withdrawal
  var pendingWithdrawal = Bot.getProperty("pendingRefW_" + user.telegramid);
  if (pendingWithdrawal && pendingWithdrawal.amount) {
    return Api.sendMessage({
      text: "<i>⚠️ Your previous withdrawal request is pending. Please wait patiently until it’s confirmed. Explore more features or contact support to speed up.</i>",
      parse_mode: "html",
      reply_markup: {
        inline_keyboard: [
          [{ text: "📞 Contact Support", url: "https://t.me/FutureComboBot_Support" }],
          [{ text: "🔙 Back to Main Menu", callback_data: "/mainMenu" }]
        ]
      }
    });
  }

  // 🔍 Compute min/max
  const refBal = Libs.ResourcesLib.userRes("refCommission").value() || 0;
  const minW   = 1;
  if (refBal < minW) {
    return Api.sendMessage({
      text:
        "💡 <b>Insufficient Commission!</b>\n\n" +
        "Need ≥ <code>" + minW.toFixed(2) + " USDT</code>.\n" +
        "Your balance: <code>" + refBal.toFixed(2) + " USDT</code>.",
      parse_mode: "html",
      reply_markup: {
        inline_keyboard: [
          [{ text: "Back", callback_data: "/showInvite" }]
        ]
      }
    });
  }

  // ✏️ Prompt user for amount
  Api.sendMessage({
    text:
      "💸 <b>Referral Withdrawal</b>\n\n" +
      "🔹 Available: <b>" + refBal.toFixed(2) + " USDT</b>\n" +
      "🔹 Min Withdraw: <b>" + minW.toFixed(2) + " USDT</b>\n" +
      "🔹 Max Withdraw: <b>" + refBal.toFixed(2) + " USDT</b>\n\n" +
      "✏️ <b>Enter amount to withdraw:</b>",
    parse_mode: "html",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔙 Back", callback_data: "/showInvite" }]
      ]
    }
  });

  // ▶️ Trigger the input handler
  Bot.runCommand("withdrawCommissionInput");
}
