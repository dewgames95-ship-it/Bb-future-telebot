/*CMD
  command: /cancelprocess
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

// command: cancelprocess
// Delete the message that triggered the callback
if (request.message && request.message.chat && request.message.chat.id && request.message.message_id) {
  Api.deleteMessage({
    chat_id: request.message.chat.id,
    message_id: request.message.message_id
  });
}

// Acknowledge the callback query to stop loading animation (proactive fix)
if (request.id) {
  Api.answerCallbackQuery({
    callback_query_id: request.id
  });
}

Bot.runCommand("/mainMenu");
