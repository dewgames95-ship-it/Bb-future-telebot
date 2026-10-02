/*CMD
  command: /livetrading
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

//command. /livetrading
if (params && params === "goBack") {
  // Delete the current message
  Api.deleteMessage({
    chat_id: chat.id,
    message_id: request.message.message_id
  });
  // Then navigate to /mainMenu
  Bot.runCommand("/mainMenu");
  return;
}

// Helper function to generate a random float between min and max
function getRandomNumber(min, max) {
  return (Math.random() * (max - min) + min).toFixed(1);
}

// Current date/time for the dashboard header
let updateTime = new Date().toLocaleString();

// Start building our HTML message
let message = "<b>### Live Trades Dashboard</b>\n\n";
message += "⭐ Latest Update: " + updateTime + " ⭐\n\n";
message += "---\n\n";
message += "🔄 You dont Have Active Trade Positions 🔄\n\n";
message += "---\n\n";

// 3) ETHUSDT
let ethPrice = CurrencyQuote.convert({ from: "ETH", to: "USDT", amount: 1 });
let ethEntry = (ethPrice * 0.96).toFixed(2);
let ethTarget = (ethPrice * 1.05).toFixed(2);
let ethSL = (ethPrice * 0.90).toFixed(2);
let ethPnL = getRandomNumber(2030, 2210);
let ethGain = getRandomNumber(480, 550.7);

message += "<b>📊 ETHUSDT Trade Details</b>\n";
message += "📈 Position: <b>Buy</b>\n";
message += "🏦 Leverage: <b>5x</b>\n";
message += "✅ Entry: <b>$" + ethEntry + "</b>\n";
message += "⏩ Mark Price: <b>$" + ethPrice.toFixed(2) + "</b>\n";
message += "🎯 Target: <b>$" + ethTarget + "</b>\n";
message += "⛔️ SL: <b>$" + ethSL + "</b>\n";
message += "💰 Unrealised PnL: <b>$" + ethPnL + "</b>\n";
message += "💹 Potential Gain: <b>" + ethGain + "%</b>\n\n";
message += "🔔 <b>Tip:</b> Keep an eye on Ethereum's network upgrades, they could boost its value!\n\n";
message += "---\n\n";

// 5) BTCUSDT
let btcPrice = CurrencyQuote.convert({ from: "BTC", to: "USDT", amount: 1 });
let btcEntry = (btcPrice * 0.96).toFixed(2);
let btcTarget = (btcPrice * 1.05).toFixed(2);
let btcSL = (btcPrice * 0.90).toFixed(2);
let btcPnL = getRandomNumber(6030, 7210);
let btcGain = getRandomNumber(850.7, 930);

message += "<b>📊 BTCUSDT Trade Details</b>\n";
message += "📈 Position: <b>Buy</b>\n";
message += "🏦 Leverage: <b>25x</b>\n";
message += "✅ Entry: <b>$" + btcEntry + "</b>\n";
message += "⏩ Mark Price: <b>$" + btcPrice.toFixed(2) + "</b>\n";
message += "🎯 Target: <b>$" + btcTarget + "</b>\n";
message += "⛔️ SL: <b>$" + btcSL + "</b>\n";
message += "💰 Unrealised PnL: <b>$" + btcPnL + "</b>\n";
message += "💹 Potential Gain: <b>" + btcGain + "%</b>\n\n";
message += "🔔 <b>Tip:</b> Bitcoin remains the king of crypto; always consider market sentiment!\n\n";
message += "---\n\n";

// Finally, send with an inline button named "◀️ Go To Main Menu"
Bot.sendInlineKeyboard(
  [{ title: "◀️ Go To Main Menu", command: "/close_menu" }],
  message,
  { parse_mode: "HTML", on_result: "/messageid6" }
);
