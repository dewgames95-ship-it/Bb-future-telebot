/*CMD
  command: /removeBalance2
  help: 
  need_reply: true
  auto_retry_time: 
  folder: Admin Panel

  <<ANSWER

  ANSWER

  <<KEYBOARD

  KEYBOARD
  aliases: 
  group: 
CMD*/

// Language-specific data removed, keeping only English
//command: /removeBalance2
var admin = Bot.getProperty("admin");
var users = user.telegramid;
var botLink = "@" + bot.name;

if (users === admin) {
  function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }
  
  var amount = message;
  
  if (!isNumeric(amount)) {
    var notNumberText = "<i>⚠️ Send only amount.</i>";
    Api.sendMessage({
      text: notNumberText,
      parse_mode: "html"
    });
    Bot.runCommand("/removeBalance2"); //command
    return;
  }
  
  var removeID = Bot.getProperty("removeID");
  var balance = Libs.ResourcesLib.anotherUserRes("balance", removeID);
  balance.remove(parseFloat(amount));
  
  var currency = "TRX";
  var adminText = "<b>💸 Amount</b> <code>{amount} {currency}</code> <b>is removed from</b> <code>{removeID}</code> <b>balance.</b>"
                      .replace("{amount}", amount)
                      .replace("{currency}", currency)
                      .replace("{removeID}", removeID);
  Api.sendMessage({
    text: adminText,
    parse_mode: "html"
  });
  
  var userText = "<b>💸 Amount</b> <code>{amount} {currency}</code> <b>is removed by system.</b>"
                     .replace("{amount}", amount)
                     .replace("{currency}", currency);
  Api.sendMessage({
    chat_id: removeID,
    text: userText,
    parse_mode: "html"
  });
} else {
  var notAdminText = "<i>⚠️ You're not the admin of {botLink}.</i>".replace("{botLink}", botLink);
  Api.sendMessage({
    text: notAdminText,
    parse_mode: "html"
  });
}
