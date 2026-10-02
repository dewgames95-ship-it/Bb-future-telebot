/*CMD
  command: /setMerchantAPIKey
  help: 
  need_reply: true
  auto_retry_time: 
  folder: 

  <<ANSWER
*🗝️ Send your OxaPay merchant API key

👉 OxaPay link : https://oxapay.com/?ref=54739307*
  ANSWER

  <<KEYBOARD

  KEYBOARD
  aliases: 
  group: 
CMD*/

// command : /setMerchantAPIKey
var admin = Bot.getProperty("admin")
var users = user.telegramid
var botLink = "@" + bot.name

if (users === admin) {
  var merchantAPI = message

  Bot.setProperty("merchantAPI", merchantAPI, "string")

  Libs.OxaPayLib.setMerchantKey(merchantAPI)

  var text = "<b>🗝️ Merchant API set to :</b> <code>" + merchantAPI + "</code>"

  Api.sendMessage({
    text: text,
    parse_mode: "html"
  })

  Bot.runCommand("/adminPanel")
} else {
  var notAdminText = "<i>⚠️ You're not the admin of " + botLink + ".</i>"

  Api.sendMessage({
    text: notAdminText,
    parse_mode: "html"
  })
}

