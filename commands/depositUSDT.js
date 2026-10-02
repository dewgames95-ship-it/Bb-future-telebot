/*CMD
  command: depositUSDT
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

// Command: depositUSDT
var selectedNetwork = User.getProperty("selectedNetwork");
if (!selectedNetwork) {
  Api.sendMessage({ text: "Please select a network first by clicking '🏦 Deposit Funds'." });
  return;
}

const amount = parseFloat(message);
if (isNaN(amount)) {
  Api.sendMessage({ text: "_❌ Please send a valid amount._", parse_mode: "markdown" });
  Api.sendMessage({ text: "Please enter a valid amount between 1 USDT and 1,000,000 USDT:" });
  return;
}
if (amount < 1) {
  Api.sendMessage({ text: "_❌ Minimum deposit is 1 USDT._", parse_mode: "markdown" });
  Api.sendMessage({ text: "Please enter a valid amount between 1 USDT and 1,000,000 USDT:" });
  return;
}
if (amount > 1000000) {
  Api.sendMessage({ text: "_❌ Maximum deposit is 1,000,000 USDT._", parse_mode: "markdown" });
  Api.sendMessage({ text: "Please enter a valid amount between 1 USDT and 1,000,000 USDT:" });
  return;
}

var ban = Bot.getProperty(user.telegramid);
if (ban === "Ban") {
  Api.sendMessage({ text: "<i>🚫 Access Denied!</i>\n\n<b>Reason:</b> You are banned.", parse_mode: "html" });
  return;
}
var maintenanceStatus = Bot.getProperty("maintenanceStatus");
if (maintenanceStatus === "On") {
  Api.sendMessage({ text: "<i>🛠️ Under Maintenance</i>\n\nPlease check back later.", parse_mode: "html" });
  return;
}

// Delete the initial message (if still present from custom flow)
const lastMessage = User.getProperty("lastMessageId");
if (lastMessage && lastMessage.chatId === chat.chatid && lastMessage.messageId) {
  Api.deleteMessage({
    chat_id: lastMessage.chatId,
    message_id: lastMessage.messageId
  });
  User.setProperty("lastMessageId", null, "object"); // Clear the stored message ID
}

User.setProperty("USDTDepositAmount", amount, "number");

const apiOptions = {
  url: "merchants/request/whitelabel",
  fields: {
    amount: amount,
    currency: "USDT",
    payCurrency: "USDT",
    network: selectedNetwork,
    lifeTime: 90,
    orderId: Libs.Random.randomInt(10000, 99999999999),
    onCallback: "/onCallbackPaymentUSDT"
  },
  onSuccess: "/onCreatePaymentWithUSDT"
};

Api.sendMessage({
  chat_id: chat.chatid,
  text: "⏳ <b>Generating deposit address...</b>\n<i>Securely linking your wallet</i>",
  parse_mode: "html"
});

try {
  Libs.OxaPayLib.apiCall(apiOptions);
} catch (e) {
  Api.sendMessage({
    chat_id: chat.chatid,
    text: `❌ <b>Error:</b> Failed to process deposit. Error: ${e.message}`,
    parse_mode: "html"
  });
}
