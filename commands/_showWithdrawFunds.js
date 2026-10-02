/*CMD
  command: /showWithdrawFunds
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

/* Command: /showWithdrawFunds */

var minerProfitBalance = Libs.ResourcesLib.userRes("minerProfitBalance");
var maxProfit = minerProfitBalance.value().toFixed(4);

// NEW: Get withdrawal history to determine network fee
var history = Bot.getProperty("withdrawalHistory_" + user.telegramid) || [];
if (!Array.isArray(history)) history = [];
var withdrawCount = history.length;
var networkFee = withdrawCount < 2 ? 0 : 0.25;
var feeText = networkFee === 0 ? "0 USDT <s>0.25$</s>" : networkFee.toFixed(2) + " USDT";

var text = "<b>🏧 Withdraw Funds</b>\n\n" +
           "Max Withdrawable Profit: <b>" + maxProfit + " USDT</b>\n\n" +
           "✅ Minimum withdrawal: <b>1 USDT</b>\n" +
           "✅ Bot Profit Share:\n" +
           " • VIP1–3: 30%\n" +
           " • VIP4: 20%\n" +
           " • VIP5: 10%\n" +
           " • VIP6: 5%\n" +
           " • Network Fee: " + feeText + "\n\n" +
           "<b>👇 Select an amount to withdraw:</b>";
var buttons = [
  [
    { text: "25%", callback_data: "/withdrawPercent 25" },
    { text: "50%", callback_data: "/withdrawPercent 50" },
    { text: "75%", callback_data: "/withdrawPercent 75" },
    { text: "100%", callback_data: "/withdrawPercent 100" }
  ],
  [{ text: "Enter Custom Amount ✍️", callback_data: "/promptCustomAmount" }],
  [{ text: "Back to Main Menu 🏡", callback_data: "/close_menu" }]
];
Api.editMessageText({
  chat_id: request.message.chat.id,
  message_id: request.message.message_id,
  text: text,
  parse_mode: "html",
  reply_markup: { inline_keyboard: buttons }
});
