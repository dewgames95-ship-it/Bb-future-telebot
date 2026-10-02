/*CMD
  command: /refreshDepositTime
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

// Command: /refreshDepositTime
let data = Bot.getProperty("lastDeposit_" + user.telegramid);
if (!data) {
  Api.answerCallbackQuery({
    callback_query_id: request.id,
    text: "No active deposit to refresh."
  });
  return;
}
let diffMs = data.expiredAt * 1000 - Date.now();
let countdown;
if (diffMs <= 0) {
  countdown = "Expired";
} else {
  let totalSec = Math.floor(diffMs / 1000);
  let hours = Math.floor(totalSec / 3600);
  let mins = Math.floor((totalSec % 3600) / 60);
  let secs = totalSec % 60;
  countdown = `${hours}hr ${mins}min ${secs}sec`;
}
let networkDisplay = data.network === "BEP20" ? "BEP 20" : data.network === "TRC20" ? "TRC 20" : data.network;
let notesNetworkDisplay = data.network === "BEP20" ? "Binance Smart Chain Network (BEP 20)" : data.network === "TRC20" ? "Tron Network (TRC 20)" : data.network;
let caption = `<b>✅ Deposit Details Generated Successfully</b>

📨 <b>Deposit Address:</b>  
<code>${data.address}</code>  
<i>(Click to copy 👆)</i>

💰 <b>Coin:</b> ${data.currency}  
🌐 <b>Network:</b> ${networkDisplay}  
💵 <b>Amount to Send:</b> ${data.payAmount} ${data.payCurrency}

⏰ Valid Until: ${countdown}

<b>⚠️ Notes:</b>  
• Send only <b>USDT via ${notesNetworkDisplay}</b>.  
• ❗ Wrong network or underpayment may cause <b>fund loss</b>👉 Always Generate New Address For every deposit.  
• ⏳ Auto-confirmation within <b>1 min</b>. If not received in <b>10 min</b>, contact ✅ @FutureComboBot_Support`;
Api.editMessageCaption({
  chat_id: data.chat_id,
  message_id: data.message_id,
  caption: caption,
  parse_mode: "HTML",
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [
        { text: "Go To Main Menu 🏡", callback_data: "/mainMenu" }
      ],
      [
        { text: "🔁 Refresh Time ⏰", callback_data: "/refreshDepositTime" }
      ]
    ]
  })
});
Api.answerCallbackQuery({
  callback_query_id: request.id,
  text: "Time refreshed successfully!"
});
