/*CMD
  command: /removeAllBalance2
  help: 
  need_reply: true
  auto_retry_time: 
  folder: 

  <<ANSWER

  ANSWER

  <<KEYBOARD

  KEYBOARD
  aliases: 
  group: 
CMD*/

//command: /removeAllBalance2
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
    Bot.runCommand("/removeAllBalance2");
    return;
  }
  
  var removeID = Bot.getProperty("removeAllID");
  var balance = Libs.ResourcesLib.anotherUserRes("balance", removeID);
  var profitBalance = Libs.ResourcesLib.anotherUserRes("minerProfitBalance", removeID);
  var parsedAmount = parseFloat(amount);
  
  // Check if sufficient balance exists
  if (balance.value() < parsedAmount || profitBalance.value() < parsedAmount) {
    var errorText = "<i>⚠️ Insufficient funds for user <code>" + removeID + "</code>.\n" +
                    "Main Balance: <b>" + balance.value().toFixed(2) + " USDT</b>\n" +
                    "Profit Balance: <b>" + profitBalance.value().toFixed(2) + " USDT</b>\n" +
                    "Please send a lower amount.</i>";
    Api.sendMessage({
      text: errorText,
      parse_mode: "html"
    });
    Bot.runCommand("/removeAllBalance2");
    return;
  }
  
  balance.remove(parsedAmount);
  profitBalance.remove(parsedAmount);
  
  var currency = "USDT";
  
  // Persist data for async callback
  Bot.setProperty("removeAllData", {amount: parsedAmount, currency: currency, removeID: removeID}, "json");
  
  // Fetch user info for name
  Api.getChat({
    chat_id: removeID,
    on_result: "/onRemoveAllSuccess",
    on_error: "/onRemoveAllError"
  });
  
} else {
  var notAdminText = "<i>⚠️ You're not the admin of {botLink}.</i>".replace("{botLink}", botLink);
  Api.sendMessage({
    text: notAdminText,
    parse_mode: "html"
  });
}
