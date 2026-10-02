/*CMD
  command: /setwallet
  help: 
  need_reply: false
  auto_retry_time: 
  folder: 

  <<ANSWER

  ANSWER

  <<KEYBOARD

  KEYBOARD
  aliases: 🎯 set wallet
  group: 
CMD*/

if (request.message) {
  var chatID = request.message.chat_id;
  var messageID = request.message.message_id;

  Api.deleteMessage({
    chat_id: chatID,
    message_id: messageID
  });
}

/*––––––[ Ban Check command name: /setwallet ]––––––*/
var ban = Bot.getProperty(user.telegramid);
if (ban === "Ban") {
  Api.sendMessage({
    text: "<i>🚫 You're banned.</i>",
    parse_mode: "html"
  });
  return;
}

/*––––––[ Maintenance Check ]––––––*/
var maintenanceStatus = Bot.getProperty("maintenanceStatus");
if (maintenanceStatus === "On") {
  Api.sendMessage({
    text: "<i>🛠️ Bot is under maintenance, please come back later.</i>",
    parse_mode: "html"
  });
  return;
}

/*––––––[ Wallet Information ]––––––*/
var wallet = User.getProperty("wallet");
var currency = "USDT (BEP20)";

var text =
  "<b>🚨 Enter Only USDT (BEP20) Coin Address Here!</b>\n\n" +
  "⚠️ <i>Other addresses may result in the loss of funds.</i>\n" +
  "💡 Ensure your address is accurate before proceeding.\n\n" +
  "<b>🗂️ Your current " + currency + " address:</b> <code>" + (wallet ? wallet : "Not Set") + "</code>\n\n" +
  "<b>✅ To change, click the button below 👇</b>";

var button = [
  [{ text: "🗂️ Set/Change Wallet", callback_data: "/wallet" }]
];

Api.sendMessage({
  text: text,
  reply_markup: { inline_keyboard: button },
  parse_mode: "html"
});
