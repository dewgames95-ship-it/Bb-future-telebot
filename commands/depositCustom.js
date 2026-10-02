/*CMD
  command: depositCustom
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

/* command: depositCustom */
// Get the message ID to edit (prefer request if callback, else stored)
let messageId = (request && request.message && request.message.message_id) ? request.message.message_id : null;
let chatId = chat.chatid;

if (!messageId) {
  const lastMessage = User.getProperty("lastMessageId");
  if (lastMessage && lastMessage.chatId === chat.chatid && lastMessage.messageId) {
    messageId = lastMessage.messageId;
    chatId = lastMessage.chatId;
  }
}

const customText = "Please enter a valid amount between 1 USDT and 1,000,000 USDT:";
const keyboard = {
  inline_keyboard: [
    [
      {
        text: "❌ Cancel Process",
        callback_data: "/cancelprocess"
      }
    ]
  ]
};

if (messageId) {
  try {
    Api.editMessageText({
      chat_id: chatId,
      message_id: messageId,
      text: customText,
      parse_mode: "html",
      reply_markup: JSON.stringify(keyboard)
    });
  } catch (e) {
    // Fallback: Delete if possible and send new
    if (chatId && messageId) {
      try {
        Api.deleteMessage({
          chat_id: chatId,
          message_id: messageId
        });
        User.setProperty("lastMessageId", null, "object"); // Clear on fallback
      } catch (deleteError) {
        // Silent fail on delete error to avoid user disruption
      }
    }
    Api.sendMessage({
      chat_id: chat.chatid,
      text: customText,
      parse_mode: "html",
      reply_markup: JSON.stringify(keyboard)
    });
  }
} else {
  // If no ID, send new
  Api.sendMessage({
    chat_id: chat.chatid,
    text: customText,
    parse_mode: "html",
    reply_markup: JSON.stringify(keyboard)
  });
}

Bot.runCommand("depositUSDT");
