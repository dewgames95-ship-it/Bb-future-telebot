/*CMD
  command: /chooseBalance
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

// /*command: /chooseBalance*/
var admin = Bot.getProperty("admin");
var users = user.telegramid;
var botLink = "@" + bot.name;

if (users === admin) {
  Bot.setProperty("balanceAction", "balance", "string");
  
  Api.editMessageText({
    text: "<b>💡 You selected:</b> Add Balance.\n\n" +
          "👉 Please send the <b>amount</b> to add to <b>available balance</b> only.",
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
