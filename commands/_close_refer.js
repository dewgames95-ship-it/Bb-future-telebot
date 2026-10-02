/*CMD
  command: /close_refer
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

// commands name: /close_refer
if (request.data == "/close_refer") {
  var message_id = request.message.message_id;
  var chat_id = request.message.chat_id;  // Corrected this line

  Api.deleteMessage({
    chat_id: chat_id,
    message_id: message_id
  });
}

Bot.runCommand(" 🤝 Invite & Earn");
