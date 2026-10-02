/*CMD
  command: /setWithdrawalStatus
  help: 
  need_reply: true
  auto_retry_time: 
  folder: Admin Panel

  <<ANSWER
*🏧 Send the mode which you want to set as withdrawalstatus from the options below 👇

👉 Options :* `On` */* `Off`
  ANSWER

  <<KEYBOARD

  KEYBOARD
  aliases: 
  group: 
CMD*/

// command : /setWithdrawalStatus
var admin = Bot.getProperty("admin")
var users = user.telegramid
var botLink = "@" + bot.name

if (users === admin) {
  var withdrawal = message

  if (withdrawal === "On" || withdrawal === "Off") {
    Bot.setProperty("withdrawalStatus", withdrawal, "string")

    var text =
      "<b>🏧 Withdrawal status set to :</b> <code>" + withdrawal + "</code>"

    Api.sendMessage({
      text: text,
      parse_mode: "html"
    })

    Bot.runCommand("/adminPanel")
  } else {
    var notText =
      "<i>⚠️ Send only</i> <code>On</code> <i>or</i> <code>Off</code>."

    Api.sendMessage({
      text: notText,
      parse_mode: "html"
    })

    Bot.runCommand("/setWithdrawalStatus")
  }
} else {
  var notAdminText = "<i>⚠️ You're not the admin of " + botLink + ".</i>"

  Api.sendMessage({
    text: notAdminText,
    parse_mode: "html"
  })
}

