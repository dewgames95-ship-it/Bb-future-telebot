/*CMD
  command: /send_reply
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

// Get the stored user ID
var userID = Bot.getProperty("admin_reply_to");

if (!userID) {
  Api.sendMessage({
    chat_id: chat.chatid,
    text: "⚠️ No user ID found! Use `/reply <userID>` first.",
    parse_mode: "Markdown"
  });
  return;
}

// Forward admin's message to the user
Api.sendMessage({
  chat_id: userID,
  text: "<b>📩 Message from Admin:</b>\n\n" + message,
  parse_mode: "html"
});

// Confirm to admin
Api.sendMessage({
  chat_id: chat.chatid,
  text: "✅ Message sent to user: " + userID,
  parse_mode: "Markdown"
});

// Clear the stored user ID after sending message
Bot.setProperty("admin_reply_to", null, "string");
