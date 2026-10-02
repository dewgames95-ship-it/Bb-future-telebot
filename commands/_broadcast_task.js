/*CMD
  command: /broadcast_task
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

if (!options) return;

Api.copyMessage({
  chat_id: user.telegramid,
  from_chat_id: options.from_chat_id,
  message_id: options.message_id
});
