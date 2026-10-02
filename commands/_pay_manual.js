/*CMD
  command: /pay_manual
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

/* Command: /pay_manual */

// This command is triggered when the admin taps the "💵 Pay Manual" inline button, 
// which has callback_data: "/pay_manual <userId> <amount>"

if (request.data) {
  var chatID = request.message.chat.id;
  var messageID = request.message.message_id;

  // Delete the inline keyboard message
  Api.deleteMessage({
    chat_id: chatID,
    message_id: messageID
  });
}

if (request.data.startsWith("/pay_manual")) {
  // Extract user ID and amount from callback
  var params = request.data.split(" "); // e.g. "/pay_manual 123456789 10"
  var userId = params[1];
  var amount = parseFloat(params[2]);

  // Prompt admin to send a custom message to the user
  Bot.sendMessage("✏️ Please send the message you want to send to the user.");

  // Store the user's Telegram ID and amount for the next command
  Bot.setProperty("payTargetUserId", userId, "string");
  Bot.setProperty("payTargetAmount", amount, "float");

  // Now run the next command (where the admin's typed message is handled)
  Bot.runCommand("/payManual");
  return;
}
