/*CMD
  command: test
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

var url = Libs.Webhooks.getUrlFor({
  user_id: user.id,
  command: "confirm2"
})

Bot.inspect(url)
 Libs.ResourcesLib.userRes("balance").add(100);
Libs.ResourcesLib.userRes("minerProfitBalance").add(100);
