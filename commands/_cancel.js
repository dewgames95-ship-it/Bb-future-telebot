/*CMD
  command: /cancel
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

/* Command: /cancel */

// When user clicks the "❌ Cancel" button with callback_data: "/cancel <amount>",
// we restore any previously deducted amount if we had marked it as "deducted".

if (request.data && request.data.startsWith("/cancel")) {
  // 1) Delete the inline keyboard message
  var chatID = request.message.chat.id;
  var messageID = request.message.message_id;
  Api.deleteMessage({
    chat_id: chatID,
    message_id: messageID
  });

  // 2) Parse the requested amount from callback data (e.g. "/cancel 5.0")
  var parts = request.data.split(" ");
  var amount = parseFloat(parts[1]);
  if (isNaN(amount)) {
    // If no valid amount, just send a generic cancellation message
    Api.sendMessage({
      text: "❌ Your withdrawal request has been cancelled.",
      parse_mode: "html"
    });
    Bot.runCommand("/mainMenu"); // Added: Run /mainMenu
    return;
  }

  // 3) Retrieve the pending withdrawal data
  var userId = user.telegramid;
  var pendingKey = "pendingWithdrawal_" + userId;
  var pendingData = Bot.getProperty(pendingKey);

  if (!pendingData || !pendingData.deducted) {
    // If no pending data or it wasn't deducted, just cancel
    Api.sendMessage({
      text: "❌ Your withdrawal request has been cancelled.",
      parse_mode: "html"
    });
    Bot.runCommand("/mainMenu"); // Added: Run /mainMenu
    return;
  }

  // 4) If we already deducted from the user's balances, restore them
  var userBalance = Libs.ResourcesLib.userRes("balance");
  var minerProfitBalance = Libs.ResourcesLib.userRes("minerProfitBalance");

  userBalance.add(amount);
  minerProfitBalance.add(amount);

  // 5) Clear the pending withdrawal record
  Bot.setProperty(pendingKey, "", "string");

  // 6) Notify the user
  Api.sendMessage({
    text: "❌ Your withdrawal request has been cancelled. The deducted amount has been restored.",
    parse_mode: "html"
  });
  Bot.runCommand("/mainMenu"); // Added: Run /mainMenu
}
