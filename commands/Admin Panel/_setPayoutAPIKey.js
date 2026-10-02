/*CMD
  command: /setPayoutAPIKey
  help: 
  need_reply: true
  auto_retry_time: 
  folder: Admin Panel

  <<ANSWER
*🗝️ Send your OxaPay payout API key

👉 OxaPay link : https://oxapay.com/?ref=54739307*
  ANSWER

  <<KEYBOARD

  KEYBOARD
  aliases: 
  group: 
CMD*/

// command: /setPayoutAPIKey
var admin = Bot.getProperty("admin")
var users = user.telegramid
var botLink = "@" + bot.name

if (users === admin) {
  var payoutAPI = message

  Bot.setProperty("payoutAPI", payoutAPI, "string")

  Libs.OxaPayLib.setPayoutApiKey(payoutAPI)

  var text = "<b>🗝️ Payout API set to :</b> <code>" + payoutAPI + "</code>"

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

