/*CMD
  command: /selectTRC20
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

/* command: /selectTRC20 */
User.setProperty("selectedNetwork", "TRC20", "string");

const selectText = "✅ You selected USDT (TRC20). Now, please select your deposit amount or enter a custom amount.\n" +
        "<b>Minimum: 1 USDT</b>\n" +
        "<b>Maximum: 1,000,000 USDT</b>\n\n" +
        "Choose an option:";

const keyboard = {
    inline_keyboard: [
      [
        { text: "💵 1 USDT", callback_data: "depositVIP 1" },
        { text: "💰 20 USDT", callback_data: "depositVIP 20" }
      ],
      [
        { text: "✨ VIP 1 - 30 USDT", callback_data: "depositVIP 30" },
        { text: "💎 VIP 2 - 150 USDT", callback_data: "depositVIP 150" }
      ],
      [
        { text: "🚀 VIP 3 - 600 USDT", callback_data: "depositVIP 600" },
        { text: "🔥 VIP 4 - 3000 USDT", callback_data: "depositVIP 3000" }
      ],
      [
        { text: "✍️ Enter Custom Amount", callback_data: "depositCustom" }
      ],
      [
        { text: "⬅️ Back", callback_data: "/close_menu" }
      ]
    ]
  };

if (request && request.message && request.message.message_id) {
  try {
    Api.editMessageText({
      chat_id: chat.chatid,
      message_id: request.message.message_id,
      text: selectText,
      parse_mode: "HTML",
      reply_markup: JSON.stringify(keyboard)
    });
  } catch (e) {
    // Fallback to send if edit fails
    Api.sendMessage({
      chat_id: chat.chatid,
      text: selectText,
      parse_mode: "HTML",
      reply_markup: JSON.stringify(keyboard)
    });
  }
} else {
  // If no request, send new
  Api.sendMessage({
    chat_id: chat.chatid,
    text: selectText,
    parse_mode: "HTML",
    reply_markup: JSON.stringify(keyboard)
  });
}

// Store the message ID (use request's if available)
let messageId = request && request.message ? request.message.message_id : null;
if (messageId) {
  User.setProperty("lastMessageId", { chatId: chat.chatid, messageId: messageId }, "object");
}

if (request && request.id) {
  Api.answerCallbackQuery({ callback_query_id: request.id });
}
