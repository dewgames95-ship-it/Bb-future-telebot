/*CMD
  command: /setMaximumWithdraw
  help: 
  need_reply: true
  auto_retry_time: 
  folder: Admin Panel
  answer: *💸 Send the amount which you want to set as maximum withdraw*

  <<KEYBOARD

  KEYBOARD
  aliases: 
  group: 
CMD*/

// command: /setMaximumWithdraw
var admin = Bot.getProperty("admin")
var users = user.telegramid
var botLink = "@" + bot.name

if (users === admin) {
  function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n)
  }

  var maximumWithdraw = message

  if (!isNumeric(maximumWithdraw)) {
    var notNumberText = "<i>⚠️ Send only numerical value.</i>"

    Api.sendMessage({
      text: notNumberText,
      parse_mode: "html"
    })

    Bot.runCommand("/setMaximumWithdraw")
    return
  }

  Bot.setProperty("maximumWithdraw", maximumWithdraw, "string")

  var currency = "TRX"
  var text =
    "<b>💸 Minimum withdraw set to :</b> <code>" +
    maximumWithdraw +
    " " +
    currency +
    "</code>"

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

