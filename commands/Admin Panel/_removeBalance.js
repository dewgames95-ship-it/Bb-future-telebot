/*CMD
  command: /removeBalance
  help: 
  need_reply: true
  auto_retry_time: 
  folder: Admin Panel
  answer: *➖ Send user's telegram id whom you want to remove balance*

  <<KEYBOARD

  KEYBOARD
  aliases: 
  group: 
CMD*/

// command: /removeBalance
var admin = Bot.getProperty("admin")
var users = user.telegramid
var botLink = "@" + bot.name

if (users === admin) {
  function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n)
  }

  var removeID = message

  if (!isNumeric(removeID)) {
    var notNumberText = "<i>⚠️ Send only user's telegram id.</i>"

    Api.sendMessage({
      text: notNumberText,
      parse_mode: "html"
    })

    Bot.runCommand("/removeBalance")
    return
  }

  Bot.setProperty("removeID", removeID, "integer")

  var text =
    "<b>💸 Now send the amount which you want to remove.\n\n🆔 User ID :</b> <code>" +
    removeID +
    "</code>"

  Api.sendMessage({
    text: text,
    parse_mode: "html"
  })

  Bot.runCommand("/removeBalance2")
} else {
  var notAdminText = "<i>⚠️ You're not the admin of " + botLink + ".</i>"

  Api.sendMessage({
    text: notAdminText,
    parse_mode: "html"
  })
}

