/*CMD
  command: /withdrawfunds
  help: 
  need_reply: false
  auto_retry_time: 
  folder: 

  <<ANSWER

  ANSWER

  <<KEYBOARD

  KEYBOARD
  aliases: 🏧 withdraw funds
  group: 
CMD*/

//command. /Withdrawfunds
var ban = Bot.getProperty(user.telegramid);
if (ban === "Ban") {
  var banText = "<i>bot working.</i>";
  Api.sendMessage({
    text: banText,
    parse_mode: "html"
  });
  return;
}

var maintenanceStatus = Bot.getProperty("maintenanceStatus");
if (maintenanceStatus === "On") {
  var onText = "<i>🛠️ Bot is under maintenance, please come back after some time.</i>";
  Api.sendMessage({
    text: onText,
    parse_mode: "html"
  });
  return;
}

// 🛑 Check if withdrawals are stopped
var stop = Bot.getProperty("withdrawStopped_" + user.telegramid);
if (stop && stop.status === "stopped") {
  Api.sendMessage({ text: stop.message, parse_mode: "html" });
  return;
}

var autowithStatus = Bot.getProperty("autowithStatus");
var withdrawalStatus = Bot.getProperty("withdrawalStatus");
var minimumWithdraw = Bot.getProperty("minimumWithdraw");
const toWithdraw = CurrencyQuote.convert({ from: "USDT", to: "USDT", amount: minimumWithdraw });

// NEW: aggregator resource for total miner profit
var minerProfitBalance = Libs.ResourcesLib.userRes("minerProfitBalance");
var maxProfit = minerProfitBalance.value().toFixed(4);

// NEW: Get withdrawal history to determine network fee
var history = Bot.getProperty("withdrawalHistory_" + user.telegramid) || [];
if (!Array.isArray(history)) history = [];
var withdrawCount = history.length;
var networkFee = withdrawCount < 2 ? 0 : 0.25;
var feeText = networkFee === 0 ? "0 USDT <s>0.25$</s>" : networkFee.toFixed(2) + " USDT";

if (autowithStatus === "Off" && withdrawalStatus === "On") {
  var wallet = User.getProperty("wallet");
  if (wallet === undefined) {
    var undefinedText = "<b>Don’t know How to Withdraw USDT❔\n👉 <a href='https://t.me/FutureComboBot_Channel/54'>Watch Video Guide</a></b>\n\n<i>⚠️ Set your wallet first by clicking the button below 👇</i>";
    var button = [[ { text: "🗂️ Set wallet", callback_data: "🗂️ Wallet" } ]];

    Api.sendMessage({
      text: undefinedText,
      reply_markup: { inline_keyboard: button },
      parse_mode: "html",
      disable_web_page_preview: true
    });
    return;
  }

  var balance = Libs.ResourcesLib.userRes("balance");
  var currency = "USDT";

  if (balance.value() < minimumWithdraw) {
    var lowText = "<b>Don’t know How to Withdraw USDT❔\n👉 <a href='https://t.me/FutureComboBot_Channel/54'>Watch Video Guide</a></b>\n\n<i>⚠️ You need at least</i> <code>" + minimumWithdraw + " " + currency +
                  "</code> ~ $" + toWithdraw.toFixed(4) + "<i> to withdraw.</i>";
    Api.sendMessage({
      text: lowText,
      parse_mode: "html",
      disable_web_page_preview: true
    });
  } else {
    // REMOVED: pending withdrawal check & message
    // NEW: show aggregator profit and commission details with percentage buttons in horizontal line
    var text = "<b>🏧 Withdraw Funds</b>\n\n" +
               "<b>👉 <a href='https://t.me/FutureComboBot_Channel/54'>Watch Video Guide</a></b>\n\n" +
               "Max Withdrawable Profit: <b>" + maxProfit + " USDT</b>\n\n" +
               "✅ Minimum withdrawal: <b>1 USDT</b>\n" +
               "✅ Bot Profit Share:\n" +
               " • VIP1–2: 30%\n" +
               " • VIP3: 20%\n" +
               " • VIP4: 10%\n" +
               " • VIP5: 5%\n" +
               " • VIP6: 1%\n" +
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
    Api.sendMessage({
      text: text,
      parse_mode: "html",
      reply_markup: { inline_keyboard: buttons },
      disable_web_page_preview: true
    });
  }

} else if (autowithStatus === "On" && withdrawalStatus === "Off") {
  var wallet = User.getProperty("wallet");
  if (wallet === undefined) {
    var undefinedText = "<b>Don’t know How to Withdraw USDT❔\n👉 <a href='https://t.me/FutureComboBot_Channel/54'>Watch Video Guide</a></b>\n\n<i>⚠️ Set your wallet first by clicking the button below 👇</i>";
    var button = [[ { text: "🗂️ Set wallet", callback_data: "🎯 Set Wallet" } ]];

    Api.sendMessage({
      text: undefinedText,
      reply_markup: { inline_keyboard: button },
      parse_mode: "html",
      disable_web_page_preview: true
    });
    return;
  }

  var balance = Libs.ResourcesLib.userRes("balance");
  var currency = "USDT";

  if (balance.value() < minimumWithdraw) {
    var lowText = "<b>Don’t know How to Withdraw USDT❔\n👉 <a href='https://t.me/FutureComboBot_Channel/54'>Watch Video Guide</a></b>\n\n<i>⚠️ You need at least</i> <code>" + minimumWithdraw + " " + currency +
                  "</code>  ~ $" + toWithdraw.toFixed(4) + " <i>to withdraw.</i>";
    Api.sendMessage({
      text: lowText,
      parse_mode: "html",
      disable_web_page_preview: true
    });
  } else {
    // REMOVED: pending withdrawal check & message
    // NEW: show aggregator profit and commission details with percentage buttons in horizontal line
    var text = "<b>🏧 Withdraw Funds</b>\n\n" +
               "<b>👉 <a href='https://t.me/FutureComboBot_Channel/54'>Watch Video Guide</a></b>\n\n" +
               "Max Withdrawable Profit: <b>" + maxProfit + " USDT</b>\n\n" +
               "✅ Minimum withdrawal: <b>1 USDT</b>\n" +
               "✅ Bot Profit Share:\n" +
               " • VIP1–2: 30%\n" +
               " • VIP3: 20%\n" +
               " • VIP4: 10%\n" +
               " • VIP5: 5%\n" +
               " • VIP6: 1%\n" +
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
    Api.sendMessage({
      text: text,
      parse_mode: "html",
      reply_markup: { inline_keyboard: buttons },
      disable_web_page_preview: true
    });
  }
}
