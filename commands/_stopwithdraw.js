/*CMD
  command: /stopwithdraw
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

// /* /stopwithdraw */
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
  customMessage = "<i>⚠️ Withdrawal Limit Reached ⚠<br>You have already reached the maximum number of withdrawal requests. An upgrade is required to continue.<br><br>🔓 How To Unlock Unlimited Withdrawals<br>Purchase VIP 3 at least 1 time to remove withdrawal limits and enjoy unrestricted access.<br>Consider upgrading to maximize your profits with limitless withdrawals.</i>";
}
var finalMessage = "<b>🤖 Bot Update!!</b>\n" + customMessage;
// Set the stop withdrawal property for the target user
Bot.setProperty("withdrawStopped_" + targetId, { status: "stopped", message: finalMessage }, "json");
// Notify admin with a success message
Api.sendMessage({ text: `<b>✅ Successfully stopped withdrawals for user:</b> <code>${targetId}</code>`, parse_mode: "html" });
// Notify the target user (the message appears as a bot update)
Api.sendMessage({ chat_id: targetId, text: finalMessage, parse_mode: "html" });
