/*CMD
  command: /startwithdraw
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

// /* /startwithdraw */
var allowedAdmins = ["7377411824"]; // Replace with your admin telegram id(s)
if (allowedAdmins.indexOf(user.telegramid.toString()) === -1) {
  Api.sendMessage({ text: "<i>⚠️ Access Denied</i>", parse_mode: "html" });
  return;
}

var lines = message.split("\n");
if (lines.length < 1) {
  Api.sendMessage({ text: "<i>⚠️ Error: No user ID specified.</i>", parse_mode: "html" });
  return;
}
var firstLineTokens = lines[0].split(" ");
if (firstLineTokens.length < 2) {
  Api.sendMessage({ text: "<i>⚠️ Error: No user ID specified.</i>", parse_mode: "html" });
  return;
}
var targetId = firstLineTokens[1].trim();
// Get the custom message from the subsequent lines (if any)
var customMessage = lines.slice(1).join("\n").trim();
if (!customMessage) {
  customMessage = "<i>✅ Withdrawal has been enabled. You can now proceed with withdrawals.</i>";
}
var finalMessage = "<b>🤖 Bot Update!!</b>\n" + customMessage;
// Instead of Bot.removeProperty, we override the stop property by setting it to an empty string
Bot.setProperty("withdrawStopped_" + targetId, "", "text");
// Notify admin with a success message
Api.sendMessage({ text: `<b>✅ Successfully enabled withdrawals for user:</b> <code>${targetId}</code>`, parse_mode: "html" });
// Notify the target user (the message appears as a bot update)
Api.sendMessage({ chat_id: targetId, text: finalMessage, parse_mode: "html" });
