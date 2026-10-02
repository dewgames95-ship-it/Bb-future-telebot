/*CMD
  command: /withdrawalHistory
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

// /* command: /withdrawHistory */
var ban = Bot.getProperty(user.telegramid);
if (ban === "Ban") {
  return Api.sendMessage({
    text: "<i>🚫 You're banned.</i>",
    parse_mode: "html"
  });
}
if (Bot.getProperty("maintenanceStatus") === "On") {
  return Api.sendMessage({
    text: "<i>🛠️ Bot is under maintenance, please come back after some time.</i>",
    parse_mode: "html"
  });
}

// ── FETCH HISTORY ──
var history = Bot.getProperty("withdrawalHistory_" + user.telegramid) || [];

// ── BUILD UI ──
var text = "<b>🏧 YOUR WITHDRAWAL HISTORY</b>\n";
text += "━━━━━━━━━━━━━━━━━━━━━━\n\n";

if (!history.length) {
  text += "<i>No withdrawals yet.</i>\n";
} else {
  var totalCount  = history.length;
  var totalAmount = 0;
  var months      = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  history.forEach(function(e, i) {
    var dt = new Date(e.date);
    var day  = ("0" + dt.getDate()).slice(-2);
    var mon  = months[dt.getMonth()];
    var yr   = dt.getFullYear();
    var hrs  = dt.getHours();
    var mins = ("0" + dt.getMinutes()).slice(-2);
    var ampm = hrs >= 12 ? "PM" : "AM";
    hrs = hrs % 12 || 12;
    var formattedDate = day + " " + mon + " " + yr + " – " + hrs + ":" + mins + " " + ampm;

    var amt = parseFloat(e.amount) || 0;
    totalAmount += amt;

    text += "<b>" + (i + 1) + ".</b> 💸 Amount: <b>" + amt.toFixed(2) + " USDT</b>\n";
    text += "📅 Date: " + formattedDate + "\n";
    text += "🏦 Address: <code>" + e.wallet + "</code>\n\n";
  });

  text += "━━━━━━━━━━━━━━━━━━━━━━\n";
  text += "📤 Total Withdrawals: " + totalCount + "\n";
  text += "💵 Total Amount: <b>" + totalAmount.toFixed(2) + " USDT</b>\n";
}

// 🔙 Back button
var button = [
  [{ text: "🔙 Back", callback_data: "/close_minning" }]
];

if (request.data) {
  Api.editMessageText({
    text: text,
    parse_mode: "html",
    reply_markup: { inline_keyboard: button },
    message_id: request.message.message_id,
    chat_id: request.message.chat_id
  });
} else {
  Api.sendMessage({
    text: text,
    parse_mode: "html",
    reply_markup: { inline_keyboard: button }
  });
}
