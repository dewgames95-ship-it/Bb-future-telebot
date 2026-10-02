/*CMD
  command: /depo1
  help: 
  need_reply: true
  auto_retry_time: 
  folder: 
  answer: Enter Your Bots.Business Mail 💌

  <<KEYBOARD

  KEYBOARD
  aliases: 
  group: 
CMD*/

BBAdmin.installBot({
 email: message,
 bot_id: bot.id
 })

Bot.sendMessage("Bot Send To Your Bots.Business Email")
