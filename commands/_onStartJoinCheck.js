/*CMD
  command: /onStartJoinCheck
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

// command: /onStartJoinCheck
var userStatus = options.result.status;

if (userStatus === "member" || userStatus === "administrator" || userStatus === "creator") {
  User.setProperty("joined_status", "✅", "string");
  Bot.runCommand("/mainMenu");
} else {
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
