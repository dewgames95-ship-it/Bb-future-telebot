/*CMD
  command: /depositbonus
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

// /* command: /depositbonus */
var targetUserId = options && options.userId ? options.userId : user.telegramid;

var active = Bot.getProperty("bonus_active_session_" + targetUserId);
if (active) {
  var start = Bot.getProperty("bonus_start_time_" + targetUserId);
  var now = Date.now();
  var timeLeft = start + 12 * 3600 * 1000 - now;
  if (timeLeft <= 0) return;
  var hours = Math.floor(timeLeft / 3600000);
  var mins = Math.floor((timeLeft % 3600000) / 60000);
  var secs = Math.floor((timeLeft % 60000) / 1000);
  var timeStr = hours + "h " + mins + "m " + secs + "s";
  var msg = "bonus is already active remaining time : " + timeStr + " ⏰";
  Api.sendMessage({
    chat_id: targetUserId,
    text: msg,
    parse_mode: "html"
  });
  return;
}

var historyString = Bot.getProperty("miningHistory_" + targetUserId);
var miningHistory = [];
if (historyString) {
  try {
    miningHistory = JSON.parse(historyString);
  } catch (e) {
    miningHistory = [];
  }
}

var highestLevel = 0;
for (var i = 0; i < miningHistory.length; i++) {
  var rec = miningHistory[i];
  var match = rec.planName.match(/VIP\s*(\d+)/);
  if (match) {
    var level = parseInt(match[1]);
    if (level > highestLevel) highestLevel = level;
  }
}

if (highestLevel == 0) return;

var message, imageUrl, bonusType;
if (highestLevel >= 2) {
  message = "🥳 ATTENTION TRADERS\n\n" +
            "Deposit now & enjoy instant, usable bonuses 💯\n\n" +
            "💰 Deposit          🎁 Bonus\n" +
            "<b>💵 150 USDT     ->  15 USDT  🎉</b>\n" +
            "<b>💵 600 USDT     ->  70 USDT  🎉</b>\n" +
            "<b>💵 1,000 USDT   ->  130 USDT  🎉</b>\n" +
            "<b>💵 3,000 USDT   ->  450 USDT  🎉</b>\n" +
            "<b>💵 6,000 USDT   ->  800 USDT  🎉</b>\n" +
            "<b>💵 10,000 USDT ->  1,500 USDT </b>\n" +
            "<b>💵 20,000 USDT ->  3,200 USDT</b>\n" +
            "<b>💵 30,000 USDT ->  4,800 USDT </b>\n\n" +
            "💸 Withdraw profits anytime — 100% yours, no lock-in\n" +
            "⏳ Valid For 12 hours only — Don’t miss out 🔥";
  imageUrl = "https://files.catbox.moe/32fat4.jpeg";
  bonusType = "vip2plus";
} else {
  message = "🥳 ATTENTION TRADERS\n\n" +
            "⚡️Deposit now & claim your instant rewards — no strings attached!\n\n" +
            "💰 Deposit              🎁 Bonus\n" +
            "<b>💵 30 USDT      ->   4 USDT  🎉</b>\n" +
            "<b>💵 150 USDT    ->   15 USDT 🎉</b>\n" +
            "<b>💵 600 USDT    ->   72 USDT  🎉</b>\n" +
            "<b>💵 1,000 USDT  ->  140 USDT 🎉</b>\n" +
            "<b>💵 3,000 USDT  ->  480 USDT 🎉</b>\n\n" +
            "⚡ Bonuses auto-credited — no wait, no hassle\n" +
            "💸 Withdraw profits anytime — 100% yours, no lock-in\n" +
            "⏳ Valid For 12 hours only — Don’t miss out 🔥";
  imageUrl = "https://files.catbox.moe/32fat4.jpeg";
  bonusType = "vip1";
}

Api.sendPhoto({
  chat_id: targetUserId,
  photo: imageUrl,
  caption: message,
  parse_mode: "html",
  reply_markup: {
    inline_keyboard: [
      [{ text: "Make Deposit 💰", callback_data: "/deposit" }]
    ]
  }
});

var now = Date.now();
Bot.setProperty("bonus_start_time_" + targetUserId, now, "integer");
Bot.setProperty("bonus_active_session_" + targetUserId, true, "boolean");
Bot.setProperty("bonus_type_" + targetUserId, bonusType, "string");
Bot.setProperty("claimed_in_window_" + targetUserId, false, "boolean");

Bot.run({
  command: "/bonusReminder",
  run_after: 2 * 60 * 60,
  options: { userId: targetUserId }
});

Bot.run({
  command: "/bonusExpiry",
  run_after: 12 * 60 * 60,
  options: { userId: targetUserId }
});
