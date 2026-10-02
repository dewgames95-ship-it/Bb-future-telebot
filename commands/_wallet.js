/*CMD
  command: /wallet
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

//command : /wallet
if (request.message) {
  var chatID = request.message.chat_id;
  var messageID = request.message.message_id;

  Api.deleteMessage({
    chat_id: chatID,
    message_id: messageID
  });
}

var ban = Bot.getProperty(user.telegramid);
if (ban === "Ban") {
  var banText = "<i>🚫 You're banned.</i>";
  Api.sendMessage({ text: banText, parse_mode: "html" });
  return;
}

var walletMsgs = {
  "send_address": "*🗂️ Send your USDT (BEP20) address.*",
  "cancel": "❌ Cancel"
};

var text = walletMsgs.send_address;
var keyboard = walletMsgs.cancel;

Bot.sendKeyboard(keyboard, text);

// Run the next command
Bot.runCommand("/wallet2");
