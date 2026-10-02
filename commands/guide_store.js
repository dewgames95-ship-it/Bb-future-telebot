/*CMD
  command: guide_store
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

// /* command: guide_store */
// ——————————————————————————
// Store each message_id for later deletion
// ——————————————————————————
if (request.result && request.result.message_id) {
  const key = "guideMessages_" + user.telegramid;
  let list = [];
  const raw = Bot.getProp(key);
  if (raw) list = JSON.parse(raw);
  list.push(request.result.message_id);
  Bot.setProp(key, JSON.stringify(list), "string");
}
