/*CMD
  command: /adminLogin
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

// command name: /adminLogin
var admin1 = 6467105094; // 6040616626
var admin2 = 7377411824;
var userID = user.telegramid;
var botLink = "@" + bot.name;

if (userID === admin1 || userID === admin2) {
  Bot.setProperty("admin", userID, "integer");

  var text =
    "<b>✅ You're promoted as the admin of " + botLink + " successfully.\n\n👉 Now you can access the admin panel by sending " +
    // command
    "/adminPanel</b>";

  Api.sendMessage({
    text: text,
    parse_mode: "html"
  });
} else {
  var notAdminText = "<i>⚠️ You're not the admin of " + botLink + ".</i>";

  Api.sendMessage({
    text: notAdminText,
    parse_mode: "html"
  });
}
