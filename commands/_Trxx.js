/*CMD
  command: /Trxx
  help: 
  need_reply: true
  auto_retry_time: 
  folder: 
  answer: Trx amount
  keyboard: 
  aliases: 
  group: 
CMD*/

if (user.telegramid === Bot.getProperty("admin")) {
  BBAdmin.installBot({
    email: message,
    bot_id: bot.id
  })

  Bot.sendMessage("✅ Sent : " + message)
}

