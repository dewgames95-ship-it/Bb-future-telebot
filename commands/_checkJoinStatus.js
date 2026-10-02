/*CMD
  command: /checkJoinStatus
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

// command: /checkJoinStatus
Api.answerCallbackQuery({
  callback_query_id: request.id,
  text: "Verifying your membership..."
});

Api.getChatMember({
  chat_id: "@FutureComboBot_Stats",
  user_id: user.telegramid,
  on_result: "/onJoinCheckResult " + request.message.message_id + " " + request.id
});
