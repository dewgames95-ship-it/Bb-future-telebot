/*CMD
  command: /manual_cancel
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

/* Command: /cancel_refund (MODIFIED) */

if (request.data) {
  var chatID = request.message.chat.id;
  var messageID = request.message.message_id;
  Api.deleteMessage({ chat_id: chatID, message_id: messageID });
}

if (request.data.startsWith("/manual_cancel")) {
  var parts = request.data.split(" ");
  var userId = parts[1];
  var amount = parseFloat(parts[2]);

  if (!userId || isNaN(amount)) {
    Bot.sendMessage("⚠️ Invalid refund data. Provide user ID & amount.");
    return;
  }

  var pendingKey = "pendingWithdrawal_" + userId;
  var pendingData = Bot.getProperty(pendingKey);
  if (!pendingData) {
    Bot.sendMessage("<i>No pending withdrawal found for this user.</i>");
    return;
  }

  // If we already deducted, restore aggregator + main balance
  if (pendingData.deducted) {
    var userBalance = Libs.ResourcesLib.anotherUserRes("balance", userId);
    var minerProfitBalance = Libs.ResourcesLib.anotherUserRes("minerProfitBalance", userId);
    userBalance.add(amount);
    minerProfitBalance.add(amount);
  }

  // Clear pending
  Bot.setProperty(pendingKey, "", "string");

  // Save the user ID/amount for next step if you want to send a custom message
  Bot.setProperty("refundTargetUserId", userId, "string");
  Bot.setProperty("refundAmount", amount, "float");

  Bot.sendMessage("✏️ Please send the message you want to send to the user regarding the refund.");
  Bot.runCommand("/refundMessage");
}
