/*CMD
  command: /alertcombo
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

// command: /alertcombo
// 🔔 This command sends clean withdrawal success alert to @FutureComboBot_Stats channel

var targetUserId = options.targetUserId;
var net = options.net;
var txid = options.txid || "";

// 👤 Get user full name
var first = Bot.getProperty("firstName_" + targetUserId) || "";
var last = Bot.getProperty("lastName_" + targetUserId) || "";
var fullName = (first + " " + last).trim() || ("User " + targetUserId);

// 📝 Compose clean withdrawal alert message (exact format requested)
var alertText =
  "<b>✅ Withdrawal Completed Successfully!</b>\n\n" +
  "👤 User: " + fullName + "\n" +
  "💳 Payment Method: USDT (BEP20)\n" +
  "💸 Withdrawn Amount: <b>" + net + " USDT</b>\n\n" +
  "🔗 <b>Transaction ID:</b>\n" +
  "<b><a href=\"https://bscscan.com/tx/" + txid + "\">" + txid + "</a></b>\n" +
  "👆 View transaction on blockchain - Verified ✅\n\n" +
  "<i>🎉 Your withdrawal has been successfully processed!</i>\n" +
  "<b>🚀 Your funds are on the way! 💸</b>";

// ⌨️ Inline keyboard (same as before)
var keyboard = [
  [ { text: "📊 Start Future Combo Bot", url: "https://t.me/FutureComboBot" } ],
  [ { text: "💎 FREE VIP ACCESS - JOIN NOW🚀", url: "https://t.me/+-o0a1X684v5hMzc9" } ]
];

// 📤 Send message to stats channel
Api.sendMessage({
  chat_id: "@FutureComboBot_Stats",
  text: alertText,
  parse_mode: "html",
  disable_web_page_preview: true,
  reply_markup: { inline_keyboard: keyboard }
});
