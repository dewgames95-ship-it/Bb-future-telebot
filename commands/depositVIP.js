/*CMD
  command: depositVIP
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

// command: depositVIP
if (!request || !request.data) {
  Api.sendMessage({ chat_id: chat.chatid, text: "_❌ Invalid request. Please try again._", parse_mode: "markdown" });
  return;
}

const [command, amountStr] = request.data.split(" ");
if (command !== "depositVIP" || !amountStr) {
  Api.sendMessage({ chat_id: chat.chatid, text: "_❌ Invalid VIP selection._", parse_mode: "markdown" });
  return;
}

const amount = parseFloat(amountStr);
if (isNaN(amount)) {
  Api.sendMessage({ chat_id: chat.chatid, text: "_❌ Invalid amount format._", parse_mode: "markdown" });
  return;
}

// Process the deposit
User.setProperty("USDTDepositAmount", amount, "number");

// Get stored message ID for editing
const lastMessage = User.getProperty("lastMessageId") || {};
const chatId = lastMessage.chatId || chat.chatid;
const messageId = lastMessage.messageId;

const apiOptions = {
  url: "merchants/request/whitelabel",
  fields: {
    amount: amount,
    currency: "USDT",
    payCurrency: "USDT",
    network: User.getProperty("selectedNetwork"),
    lifeTime: 90,
    orderId: Libs.Random.randomInt(10000, 99999999999),
    onCallback: "/onCallbackPaymentUSDT"
  },
  onSuccess: "/onCreatePaymentWithUSDT"
};

// Edit the existing message
try {
  Api.editMessageText({
    chat_id: chatId,
    message_id: messageId,
    text: "⏳ <b>Generating deposit address...</b>\n<i>Securely linking your wallet</i>",
    parse_mode: "html"
  });
} catch (e) {
  // Fallback to sending a new message if edit fails
  Api.sendMessage({
    chat_id: chatId,
    text: "⏳ <b>Generating deposit address...</b>\n<i>Securely linking your wallet</i>",
    parse_mode: "html"
  });
}

try {
  Libs.OxaPayLib.apiCall(apiOptions);
} catch (e) {
  Api.sendMessage({
    chat_id: chatId,
    text: `❌ <b>Error:</b> Failed to process deposit. Error: ${e.message}`,
    parse_mode: "html"
  });
}
