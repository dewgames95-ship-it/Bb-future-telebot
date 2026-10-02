/*CMD
  command: /bonusalert
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

// /* command: /bonusalert */
var userId = (options && options.userId) ? options.userId : user.telegramid;
if (!userId) return;

Bot.run({
  command: "/depositbonus",
  run_after: 7200, // 1 minute in seconds
  options: { userId: userId }
});
