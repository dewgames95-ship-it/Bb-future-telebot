/*CMD
  command: /setAlertsChannel
  help: 
  need_reply: true
  auto_retry_time: 
  folder: Admin Panel
  answer: *🔴 Send the channel username without "@" which you want to set as alerts channel*

  <<KEYBOARD

  KEYBOARD
  aliases: 
  group: 
CMD*/

// command : /setAlertsChannel
var lang = {
  withoutAt: "<i>⚠️ Send username without '@' only.</i>",
  alertSet: "<b>🔴 Alerts channel set to : @ {channel}</b>",
  notAdmin: "<i>⚠️ You're not the admin of {botLink}.</i>"
};

var admin = Bot.getProperty("admin");
var users = user.telegramid;
var botLink = "@" + bot.name;

if (users === admin) {
  var alertChannel = message.trim();

  if (alertChannel.toLowerCase() === "/empty") {
    Bot.setProperty("channel1", null, "string");
    Bot.setProperty("channel2", null, "string");
    var disableText = "<b>✅ Join channel requirement disabled.</b>";
    Api.sendMessage({ text: disableText, parse_mode: "html" });
    return;
  }

  if (alertChannel.includes("@")) {
    var notText = lang.withoutAt;
    Api.sendMessage({ text: notText, parse_mode: "html" });
    Bot.runCommand("/setAlertsChannel");
    return;
  }

  Bot.setProperty("alertsChannel", "@" + alertChannel, "string");
  var text = lang.alertSet.replace("{channel}", alertChannel);
  Api.sendMessage({ text: text, parse_mode: "html" });
  Bot.runCommand("/adminPanel");
} else {
  var notAdminText = lang.notAdmin.replace("{botLink}", botLink);
  Api.sendMessage({ text: notAdminText, parse_mode: "html" });
}
