/*CMD
  command: /status
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

var admin_id = Bot.getProperty("admin");

if (!admin_id || user.telegramid.toString() !== admin_id.toString())
  return Api.sendMessage({ text: "🚫 Only the bot admin can check status." });

var task_id = Bot.getProperty("broadcast_task_id");

if (!task_id) {
  return Api.sendMessage({
    text: "❌ No Broadcast Task Found.\nPlease run /broadcast first.",
    reply_to_message_id: request.message_id
  });
}

let task = new RunAllTask({ id: task_id });

Api.sendMessage({
  text:
    `<b>📊 Broadcast Status</b>\n\n` +
    `<b>🆔 Task ID:</b> <code>${task.id}</code>\n` +
    `<b>🔢 Current Position:</b> ${task.cur_position}\n` +
    `<b>📋 Status Code:</b> ${task.status_code}\n` +
    `<b>📊 Progress:</b> ${task.progress}%\n` +
    `<b>🕒 Created At:</b> ${task.created_at}\n` +
    `<b>📦 Total Users:</b> ${task.total}\n` +
    `<b>⚡️ Speed:</b> ${task.speed}\n\n` +
    `<b>📌 Status:</b> ${task.status}`,
  parse_mode: "HTML",
  reply_to_message_id: request.message_id
});
