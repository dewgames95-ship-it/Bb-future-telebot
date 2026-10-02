/*CMD
  command: /messageid10
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

//command. /messageid9
try {
  var messageId = options.result.message_id;
  var chatId = user.telegramid;

  // Retrieve the previous message ID for this command
  var previousMessageId = User.getProperty("cancel_msg_id");

  // Delete the previous message if it exists
  if (previousMessageId) {
    Api.deleteMessage({
      chat_id: chatId,
      message_id: previousMessageId
    });
  }

  // Store the new message ID
  User.setProperty("cancel_msg_id", messageId, "string");
} catch (e) {
  // Reset the stored message ID in case of error
  User.setProperty("cancel_msg_id", null);
}
