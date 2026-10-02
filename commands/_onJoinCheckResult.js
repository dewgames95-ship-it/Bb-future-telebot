/*CMD
  command: /onJoinCheckResult
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

// command: /onJoinCheckResult
let parts = params.split(" ");
let message_id = parts[0];
let callback_id = parts[1];
var userStatus = options.result.status;

if (userStatus === "member" || userStatus === "administrator" || userStatus === "creator") {
  User.setProperty("joined_status", "✅", "string");
  Api.deleteMessage({
    message_id: message_id
  });
  Bot.runCommand("/mainMenu");
} else {
  Api.deleteMessage({
    message_id: message_id
  });
  let prompt = "🚨 To continue, please join our updates channel:\n\n⚡ Stay informed. Stay ahead. ⚡";
  let buttons = [
    [{ text: "📢 Join Channel", url: "t.me/FutureComboBot_Stats" }],
    [{ text: "✅ Joined", callback_data: "/checkJoinStatus" }]
  ];
  Api.sendMessage({
    text: prompt,
    reply_markup: { inline_keyboard: buttons },
    disable_web_page_preview: true
  });
}
