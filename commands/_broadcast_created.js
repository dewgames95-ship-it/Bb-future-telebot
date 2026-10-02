/*CMD
  command: /broadcast_created
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

if (!options?.run_all_task) return;
Bot.setProperty("broadcast_task_id", options.run_all_task.id, "string");
Api.sendMessage({
  text: `<b>📢 Broadcast Task Created ✅</b>\n\n🆔 <b>Task ID:</b> ${options.run_all_task.id}\n` +
        `<b>Current Position:</b> ${options.run_all_task.cur_position}\n` +
        `<b>Status Code:</b> ${options.run_all_task.status_code}\n\n` +
        `<blockquote>🔍 You can check task status using the command /status</blockquote>`,
  parse_mode: "HTML"
});
