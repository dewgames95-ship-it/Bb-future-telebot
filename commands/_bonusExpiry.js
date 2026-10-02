/*CMD
  command: /bonusExpiry
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

// /* command: /bonusExpiry */
var userId = options.userId;
if (!userId) return;

var active = Bot.getProperty("bonus_active_session_" + userId);
if (!active) return;

var claimed = Bot.getProperty("claimed_in_window_" + userId) || false;
if (!claimed) {
  var msg = "❌ Deposit Bonus Offer expired. Stay alert for the next opportunity ⏳";
  Api.sendMessage({
    chat_id: userId,
    text: msg,
    parse_mode: "html"
  });
}

Bot.setProperty("user_claimed_bonus_" + userId, claimed, "boolean");
Bot.setProperty("bonus_active_session_" + userId, false, "boolean");
Bot.setProperty("last_bonus_given_time_" + userId, Date.now(), "integer");
Bot.setProperty("withdraw_count_since_last_bonus_" + userId, 0, "integer");
Bot.setProperty("claimed_in_window_" + userId, false, "boolean");
