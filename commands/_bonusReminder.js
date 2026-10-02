/*CMD
  command: /bonusReminder
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

// /* command: /bonusReminder */
var userId = options.userId;
if (!userId) return;

var active = Bot.getProperty("bonus_active_session_" + userId);
var claimed = Bot.getProperty("claimed_in_window_" + userId) || false;
if (!active || claimed) return;

var start = Bot.getProperty("bonus_start_time_" + userId);
var now = Date.now();
var timeLeft = start + 12 * 3600 * 1000 - now;
if (timeLeft <= 0) return;

var hours = Math.floor(timeLeft / 3600000);
var mins = Math.floor((timeLeft % 3600000) / 60000);
var secs = Math.floor((timeLeft % 60000) / 1000);
var timeStr = hours + "h " + mins + "m " + secs + "s";

var msg = "⏳ Bonus offer will expire in " + timeStr + " — act fast! 💨";
Api.sendMessage({
  chat_id: userId,
  text: msg,
  parse_mode: "html"
});
