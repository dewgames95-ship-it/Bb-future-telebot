/*CMD
  command: /onCreatePaymentWithUSDT
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

// Command: /onCreatePaymentWithUSDT
if (!options) { return }

// 🔒 Ban Check
var ban = Bot.getProperty(user.telegramid);
if (ban === "Ban") {
  Api.sendMessage({
    text: "<i>🚫 Access Denied!</i>\n\n<b>Reason:</b> You are currently banned from using this bot.\n\n💡 <b>Note:</b> If you believe this is an error, please contact support.",
    parse_mode: "HTML"
  });
  return;
}

// 🛠️ Maintenance Check
var maintenanceStatus = Bot.getProperty("maintenanceStatus");
if (maintenanceStatus === "On") {
  Api.sendMessage({
    text: "<i>🛠️ System Under Maintenance</i>\n\n<b>🔧 Status:</b> Our team is enhancing the bot to bring you a better experience. 🚀\n\n⏳ <b>Estimated Downtime:</b> Please check back later and start earning again!",
    parse_mode: "HTML"
  });
  return;
}

// ❌ Payment Generation Failed
if (options.result != 100) {
  Bot.sendMessage(options.message);
  return;
}

// ✅ Payment Generated Successfully

// 1️⃣ Calculate Time Remaining
let diffMs = options.expiredAt * 1000 - Date.now();
let diffMsForCountdown = diffMs;
if (diffMsForCountdown < 0) diffMsForCountdown = 0;
let totalSec = Math.floor(diffMsForCountdown / 1000);
let hours = Math.floor(totalSec / 3600);
let mins = Math.floor((totalSec % 3600) / 60);
let secs = totalSec % 60;
let countdown = `${hours}hr ${mins}min ${secs}sec`;

// 2️⃣ Build Caption with Dynamic Network
let networkDisplay = options.network === "BEP20" ? "BEP 20" : options.network === "TRC20" ? "TRC 20" : options.network;
let notesNetworkDisplay = options.network === "BEP20" ? "Binance Smart Chain Network (BEP 20)" : options.network === "TRC20" ? "Tron Network (TRC 20)" : options.network;
let caption = `<b>✅ Deposit Details Generated Successfully</b>

📨 <b>Deposit Address:</b>  
<code>${options.address}</code>  
<i>(Click to copy 👆)</i>

💰 <b>Coin:</b> ${options.currency}  
🌐 <b>Network:</b> ${networkDisplay}  
💵 <b>Amount to Send:</b> ${options.payAmount} ${options.payCurrency}

⏰ Valid Until: ${countdown}

<b>⚠️ Notes:</b>  
• Send only <b>USDT via ${notesNetworkDisplay}</b>.  
• ❗ Wrong network or underpayment may cause <b>fund loss</b>👉Always Generate New Address For every deposit.  
• ⏳ Auto-confirmation within <b>1 min</b>. If not received in <b>10 min</b>, contact ✅ @FutureComboBot_Support`;

// 3️⃣ Store Temp Data for Later Use
Bot.setProperty("tempDepositData_" + user.telegramid, {
  expiredAt: options.expiredAt,
  address: options.address,
  currency: options.currency,
  network: options.network,
  payAmount: options.payAmount,
  payCurrency: options.payCurrency
}, "json");

// 4️⃣ Send QR Code + Caption with Inline Buttons
Api.sendPhoto({
  photo: options.QRCode,
  caption: caption,
  parse_mode: "HTML",
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [
        { text: "Go To Main Menu 🏡", callback_data: "/mainMenu" }
      ],
      [
        { text: "🔁 Refresh Time⏰", callback_data: "/refreshDepositTime" }
      ]
    ]
  }),
  on_result: "/onDepositSent"
});
