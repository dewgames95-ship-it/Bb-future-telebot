/*CMD
  command: /addBalance2
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

// /*command: /addBalance2*/
var admin = Bot.getProperty("admin");
var users = user.telegramid;
var botLink = "@" + bot.name;

if (users === admin) {
  function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }
  
  var amount = message;
  
  if (!isNumeric(amount)) {
    Api.sendMessage({
      text: "<i>⚠️ Send only amount.</i>",
      parse_mode: "html"
    });
    Bot.runCommand("/addBalance2");
    return;
  }
  
  var addID = Bot.getProperty("addID");
  var balance = Libs.ResourcesLib.anotherUserRes("balance", addID);
  balance.add(parseFloat(amount));
  
  // **Update target user's total deposits** using a unique key
  var currentTotal = Number(Bot.getProperty("totalDeposits_" + addID) || 0);
  currentTotal += parseFloat(amount);
  Bot.setProperty("totalDeposits_" + addID, currentTotal, "number");
  
  // **Save to Deposit History**
  var ts = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  var hist = Bot.getProperty("depositHistory_" + addID) || "";
  Bot.setProperty("depositHistory_" + addID, ts + " - Deposited " + parseFloat(amount).toFixed(2) + " USDT" + (hist ? "\n" + hist : ""), "string");
  
  var currency = "USDT";
  var adminText = "<b>💸 Amount</b> <code>" + amount + " " + currency + "</code> <b>is added to</b> <code>" + addID + "</code> <b>balance.</b>";
  Api.sendMessage({
    text: adminText,
    parse_mode: "html"
  });
  
  var userText = "<b>💸 Amount</b> <code>" + amount + " " + currency + "</code> <b>is added by system.</b>";
  Api.sendMessage({
    chat_id: addID,
    text: userText,
    parse_mode: "html"
  });
} else {
  var notAdminText = "<i>⚠️ You're not the admin of " + botLink + ".</i>";
  Api.sendMessage({
    text: notAdminText,
    parse_mode: "html"
  });
}
