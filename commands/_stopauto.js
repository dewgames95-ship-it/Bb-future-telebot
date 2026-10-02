/*CMD
  command: /stopauto
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

// /* /stopauto */
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

// Set the stop auto-withdrawal property for the target user
Bot.setProperty("autoWithdrawStopped_" + targetId, { status: "stopped" }, "json");

// Fetch user details for notification
var firstName = Bot.getProperty("firstName_" + targetId) || "Unknown";
var lastName = Bot.getProperty("lastName_" + targetId) || "";
var fullName = firstName + (lastName ? " " + lastName : "");
var userLink = "<a href='tg://user?id=" + targetId + "'>" + fullName + "</a>";

// Notify admin with a success message
Api.sendMessage({ 
  text: `<b>✅ Successfully stopped auto withdrawals for user:</b> <code>${targetId}</code>\n${userLink}`, 
  parse_mode: "html" 
});
