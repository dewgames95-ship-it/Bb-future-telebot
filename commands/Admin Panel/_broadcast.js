/*CMD
  command: /broadcast
  help: 
  need_reply: false
  auto_retry_time: 
  folder: Admin Panel

  <<ANSWER

  ANSWER

  <<KEYBOARD

  KEYBOARD
  aliases: 
  group: 
CMD*/

var admin_id = Bot.getProperty("admin");

if (!admin_id || user.telegramid.toString() !== admin_id.toString())
  return Api.sendMessage({ text: "🚫 Only admin can use it." });

if (!chat || chat.chat_type !== "private") return;

var replied = request?.reply_to_message;
if (!replied)
  return Api.sendMessage({
    text: "╰┈➤ Please <b>reply to the message</b> you want to broadcast.",
    reply_to_message_id: request.message_id,
    parse_mode: "HTML"
  });

Bot.runAll({
  command: "/broadcast_task",
  for_chats: "private-chats",
  on_create: "/broadcast_created",
  options: {
    from_chat_id: replied.chat.id,
    message_id: replied.message_id,
    admin_id: admin_id
  }
});
