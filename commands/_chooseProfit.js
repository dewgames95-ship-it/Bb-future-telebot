/*CMD
  command: /chooseProfit
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

// /*command: /chooseProfit*/
var admin = Bot.getProperty("admin");
var users = user.telegramid;
var botLink = "@" + bot.name;

if (users === admin) {
  Bot.setProperty("balanceAction", "profit", "string");
  
  Api.editMessageText({
    text: "<b>💡 You selected:</b> Add Profit.\n\n" +
          "👉 Please send the <b>amount</b> to add to <b>miner profit</b> (this will also update the available balance).",
    message_id: request.message.message_id,
    chat_id: request.message.chat.id,
    parse_mode: "html"
  });
  
  Bot.runCommand("/addBalanceAmount", { force: true, wait: true });
} else {
  Api.sendMessage({
    text: "<i>⚠️ You're not the admin of " + botLink + ".</i>",
    parse_mode: "html"
  });
}
