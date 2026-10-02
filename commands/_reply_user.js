/*CMD
  command: /reply_user
  help: 
  need_reply: true
  auto_retry_time: 
  folder: 

  <<ANSWER

  ANSWER

  <<KEYBOARD

  KEYBOARD
  aliases: 
  group: 
CMD*/

// Extract user ID from command
var userID = params; 

if (!userID) {
  Api.sendMessage({
    chat_id: chat.chatid,
    text: "⚠️ Usage: `/reply <userID>`",
    parse_mode: "Markdown"
  });
  return;
}

// Store the user ID to reply later
Bot.setProperty("admin_reply_to", userID, "string");

// Ask admin to enter message
Api.sendMessage({
  chat_id: chat.chatid,
  text: "✍️ Enter your message to send to this user: " + userID,
  parse_mode: "html"
});

// Move to the next command to capture admin’s reply
Bot.runCommand("/send_reply");
