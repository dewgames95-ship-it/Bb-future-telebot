/*CMD
  command: /liveTrades
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

// Command: /liveTrades

// Get the current date and time.
var currentTime = new Date().toLocaleString();

// Retrieve current prices using CurrencyQuote.convert.
const XRPPrice = CurrencyQuote.convert({ from: "XRP", to: "USDT", amount: 1 });
const ETHPrice = CurrencyQuote.convert({ from: "ETH", to: "USDT", amount: 1 });
const ENAPrice = CurrencyQuote.convert({ from: "ENA", to: "USDT", amount: 1 });
const BTCPrice = CurrencyQuote.convert({ from: "BTC", to: "USDT", amount: 1 });

// Build a current prices block with two decimal places.
var priceBlock = "<b>💹 Current Prices:</b>\n" +
  "📉 XRP: <b>" + XRPPrice.toFixed(2) + " USDT</b>\n" +
  "📈 ETH: <b>" + ETHPrice.toFixed(2) + " USDT</b>\n" +
  "🚀 ENA: <b>" + ENAPrice.toFixed(2) + " USDT</b>\n" +
  "💎 BTC: <b>" + BTCPrice.toFixed(2) + " USDT</b>\n\n";

// Construct the arbitrage insights message with dynamic date/time and HTML bold formatting.
var message =
  "<b>🔥 Arbitrage Opportunities 🔥</b>\n\n" +
  "<b>🚀 Current Market Insights:</b> " + currentTime + "\n\n" +
  priceBlock +
  "<b>🔍 Price Discrepancies Alert:</b>\n\n" +
  "<b>1️⃣ XRP/USDT Arbitrage Strategy:</b>\n" +
  "👉 <b>Buy $9.10</b> worth of XRP on <b>MEXC</b> for <b>$9.06</b>\n" +
  "💸 <b>Sell</b> on <b>Bybit</b> for <b>$9.10</b>\n" +
  "💰 <b>Profit:</b> <b>$0.04</b> per transaction\n\n" +
  "<b>2️⃣ ETH/USDT Arbitrage Strategy:</b>\n" +
  "👉 <b>Buy $150</b> worth of ETH on <b>Bybit</b> for <b>$148.50</b>\n" +
  "💸 <b>Sell</b> on <b>BingX</b> for <b>$150</b>\n" +
  "💰 <b>Profit:</b> <b>$1.50</b> per transaction\n\n" +
  "<b>3️⃣ ENA/USDT Arbitrage Strategy:</b>\n" +
  "👉 <b>Buy $600</b> worth of ENA on <b>BingX</b> for <b>$597</b>\n" +
  "💸 <b>Sell</b> on <b>Binance</b> for <b>$600</b>\n" +
  "💰 <b>Profit:</b> <b>$3</b> per transaction\n\n" +
  "<b>4️⃣ BTC/USDT Arbitrage Strategy:</b>\n" +
  "👉 <b>Buy $3,000</b> worth of BTC on <b>Binance</b> for <b>$2,985</b>\n" +
  "💸 <b>Sell</b> on <b>Bybit</b> for <b>$3,000</b>\n" +
  "💰 <b>Profit:</b> <b>$15</b> per transaction\n\n" +
  "<b>🔔 Understanding Arbitrage:</b>\n\n" +
  "<b>• Real-Time Analysis:</b> 🔍 <b>AI scans and analyzes price differences across exchanges such as BingX, BINANCE, Bybit, and MEXC.</b> Trades execute only when differences are significant.\n\n" +
  "<b>• How to Benefit?:</b> ⏱ <b>Buy low on one exchange and sell high on another within 1-2 seconds.</b>\n\n" +
  "<b>• Key:</b> 🔑 <b>0.02%</b> transaction fees via API integration in the AI Trading Bot make this strategy profitable.\n\n" +
  "<b>🚀 Happy Trading! 🤖</b>";

// Create an inline keyboard with a "Go To Main Menu" button.
var inlineButtons = [
  [
    { text: "⏪ Go To Main Menu", callback_data: "/mainMenu" }
  ]
];

// Send the message with HTML formatting and the inline keyboard.
var response = Api.sendMessage({
  text: message,
  parse_mode: "html",
  reply_markup: { inline_keyboard: inlineButtons }
});

// Save the message id if available.
if (response && response.message_id !== undefined) {
  Bot.setProperty("lastLiveTradesMessageId", response.message_id, "integer");
}
