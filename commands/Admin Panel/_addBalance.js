/*CMD
  command: /addBalance
  help: 
  need_reply: true
  auto_retry_time: 
  folder: Admin Panel
  answer: *➕ Send user's telegram id whom you want to add balance*

  <<KEYBOARD

  KEYBOARD
  aliases: 
  group: 
CMD*/

// /*command: /addBalance*/
var admin = Bot.getProperty("admin");
var users = user.telegramid;
var botLink = "@" + bot.name;

if (users === admin) {
  function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }
  
  // Check if target user's Telegram ID is provided as a parameter
  if (!isNumeric(message) || message.trim() === "") {
    Api.sendMessage({
      text: "<i>⚠️ Please send a valid target user's Telegram ID with the command, e.g. <code>/addBalance 123456789</code></i>",
      parse_mode: "html"
    });
    return;
  }
  
  var addID = message.trim();
  Bot.setProperty("addID", addID, "integer");
  
  // Inline buttons for choosing the type of balance addition
  var inlineButtons = [
    [
      { text: "💰 Add Profit", callback_data: "/chooseProfit" },
      { text: "💸 Add Balance", callback_data: "/chooseBalance" }
    ]
  ];
  
  var textOptions = "<b>💡 Choose the type of balance to add for user ID " + addID + ":</b>\n\n" +
    "👉 <b>Add Profit:</b> Adds amount to miner profit (withdrawable) and available balance.\n" +
    "👉 <b>Add Balance:</b> Adds amount only to available balance.";
  
  Api.sendMessage({
    text: textOptions,
    reply_markup: { inline_keyboard: inlineButtons },
    parse_mode: "html"
  });
} else {
  Api.sendMessage({
    text: "<i>⚠️ You're not the admin of " + botLink + ".</i>",
    parse_mode: "html"
  });
}
