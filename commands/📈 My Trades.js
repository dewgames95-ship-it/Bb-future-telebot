/*CMD
  command: 📈 My Trades
  help: 
  need_reply: false
  auto_retry_time: 
  folder: 

  <<ANSWER

  ANSWER

  <<KEYBOARD

  KEYBOARD
  aliases: /mytrades
  group: 
CMD*/

//command. 📈 My Trades
// VIP plan details
var vipDetails = {
  1: { capital: 30, dailyProfit: 1.20, duration: 120, totalEarnings: 144, positionSize: "5% to 12%" },
  2: { capital: 150, dailyProfit: 7.50, duration: 120, totalEarnings: 900, positionSize: "5% to 12%" },
  3: { capital: 600, dailyProfit: 39.00, duration: 120, totalEarnings: 4680, positionSize: "5% to 12%" },
  4: { capital: 3000, dailyProfit: 270.00, duration: 120, totalEarnings: 32400, positionSize: "8% to 15%" },
  5: { capital: 8000, dailyProfit: 960.00, duration: 60, totalEarnings: 57600, positionSize: "8% to 15%" },
  6: { capital: 18000, dailyProfit: 2880.00, duration: 30, totalEarnings: 86400, positionSize: "8% to 15%" }
};

// Pair ranges per VIP level
var pairRanges = {
  1: { min: 1, max: 3 },
  2: { min: 2, max: 5 },
  3: { min: 3, max: 7 },
  4: { min: 5, max: 10 },
  5: { min: 7, max: 15 },
  6: { min: 10, max: 20 }
};

// Original list of crypto pairs (existing + new)
var originalPairs = [
  // Existing pairs
  "BTC", "ETH", "BNB", "XRP", "ADA", "SOL", "DOT", "DOGE", "AVAX", "MATIC",
  // New pairs
  "XLM", "BERA", "ARK", "RENDER", "LTC", "AI16Z", "TRX", "AIOT", "VIRTUAL", "SIGN",
  "FARTCOIN", "POPCAT", "WCT", "AIXBT", "ORCA", "CHILLGUY", "ARB", "GUN", "ENS", "APT",
  "IMX", "PARTI", "SEI", "ATOM", "FLM", "AVAX", "INIT", "FIL", "PENGU", "DOLO",
  "AR", "DEXE", "ALPHA", "HIVE", "NEIROETH", "THETA", "COOKIE", "JELLYJELLY", "SOL",
  "SUI", "ADA"
];

// Function to check if a symbol is valid
function isValidSymbol(symbol) {
  try {
    CurrencyQuote.convert({ from: symbol, to: "USDT", amount: 1 });
    return true;
  } catch (e) {
    return false;
  }
}

// Filter out invalid symbols
var availablePairs = originalPairs.filter(isValidSymbol);

// Fetch VIP plan counts for the user
var vipCounts = {};
for (var i = 1; i <= 6; i++) {
  vipCounts[i] = User.getProperty("vip" + i + "Count") || 0;
}

// Check if any VIP plan is active
var hasActivePlans = Object.values(vipCounts).some(count => count > 0);

if (!hasActivePlans) {
  // Trigger /livetrading if no active plans
  Bot.runCommand("/livetrading");
} else {
  // Build dashboard message
  var message = "<b>📊 LIVE TRADING DASHBOARD PANEL</b>\n";
  message += "⭐ Last Synced: " + new Date().toLocaleString() + "\n\n";
  message += "⸻\n\n";

  var activeTrades = 0;
  var totalDailyProfit = 0;

  for (var level = 1; level <= 6; level++) {
    var count = vipCounts[level];
    if (count > 0) {
      var details = vipDetails[level];
      totalDailyProfit += count * details.dailyProfit;

      // Calculate daily ROI range (±1-2% variation)
      var dailyROI = (details.dailyProfit / details.capital) * 100;
      var roiVariation = 1 + Math.random();
      var roiLow = (dailyROI - roiVariation).toFixed(2);
      var roiHigh = (dailyROI + roiVariation).toFixed(2);

      // Calculate projected ROI range (±80-90% variation)
      var projectedROI = (details.totalEarnings / details.capital) * 100;
      var projVariation = 80 + Math.random() * 10;
      var projLow = (projectedROI - projVariation).toFixed(0);
      var projHigh = (projectedROI + projVariation).toFixed(0);

      if (count === 1) {
        message += `<b>🔹 VIP ${level} – <i>1 Active Strategy Running</i></b>\n`;
        var numPairs = Math.floor(Math.random() * (pairRanges[level].max - pairRanges[level].min + 1)) + pairRanges[level].min;
        var pairs = getRandomPairs(numPairs);
        activeTrades += pairs.length;
        message += "Running Crypto Pairs:\n";
        pairs.forEach(pair => {
          var price = CurrencyQuote.convert({ from: pair, to: "USDT", amount: 1 });
          var priceStr = formatPrice(price);
          message += `- ${pair}/USDT: <b>$${priceStr}</b>\n`;
        });
        message += "\n";
        message += `💸 Capital Deployed: <b>$${formatNumber(details.capital.toFixed(2))}</b>\n`;
        message += `📈 Daily ROI Target: <b>${roiLow}% - ${roiHigh}%</b>\n`;
        message += `⚙️ Leverage: <b>Dynamic</b>\n`;
        message += `⚖️ Risk-Reward Ratio: <b>1:2</b>\n`;
        message += `📉 Max Drawdown: <b>10%</b>\n`;
        message += `🎯 Position Size: <b>${details.positionSize}</b>\n`;
        message += `⏳ Projected ROI (${details.duration} days): <b>${projLow}% - ${projHigh}%</b>\n\n`;
        message += "⸻\n\n";
      } else {
        for (var inst = 1; inst <= count; inst++) {
          message += `<b>🔹 VIP ${level} – Plan ${inst} <i>Active Strategy Running</i></b>\n`;
          var numPairs = Math.floor(Math.random() * (pairRanges[level].max - pairRanges[level].min + 1)) + pairRanges[level].min;
          var pairs = getRandomPairs(numPairs);
          activeTrades += pairs.length;
          message += "Running Crypto Pairs:\n";
          pairs.forEach(pair => {
            var price = CurrencyQuote.convert({ from: pair, to: "USDT", amount: 1 });
            var priceStr = formatPrice(price);
            message += `- ${pair}/USDT: <b>$${priceStr}</b>\n`;
          });
          message += "\n";
          message += `💸 Capital Deployed: <b>$${formatNumber(details.capital.toFixed(2))}</b>\n`;
          message += `📈 Daily ROI Target: <b>${roiLow}% - ${roiHigh}%</b>\n`;
          message += `⚙️ Leverage: <b>Dynamic</b>\n`;
          message += `⚖️ Risk-Reward Ratio: <b>1:2</b>\n`;
          message += `📉 Max Drawdown: <b>10%</b>\n`;
          message += `🎯 Position Size: <b>${details.positionSize}</b>\n`;
          message += `⏳ Projected ROI (${details.duration} days): <b>${projLow}% - ${projHigh}%</b>\n\n`;
          message += "⸻\n\n";
        }
      }
    }
  }

  // Calculate realized PnL (45% to 90% of total daily profit)
  var realizedPnL = (totalDailyProfit * (0.45 + Math.random() * 0.45)).toFixed(2);

  // Calculate unrealized PnL (30% to 50% higher than realized PnL)
  var unrealizedPnL = (parseFloat(realizedPnL) * (1.3 + Math.random() * 0.2)).toFixed(2);

  // Performance overview
  var losingTrades = Math.floor(activeTrades * (0.1 + Math.random() * 0.2));
  var profitableTrades = activeTrades - losingTrades;
  var accuracy = ((profitableTrades / activeTrades) * 100).toFixed(1);

  message += "<b>📊 PERFORMANCE OVERVIEW</b>\n";
  message += `💵 Realized PnL (Today): <b>$${formatNumber(realizedPnL)}</b>\n`;
  message += `🔒 Unrealized PnL: <b>$${formatNumber(unrealizedPnL)}</b>\n`;
  message += `🔄 Active Trades: <b>${activeTrades}</b>\n`;
  message += `❌ Losing Trades: <b>${losingTrades}</b>\n`;
  message += `✅ Profitable Trades: <b>${profitableTrades}</b>\n`;
  message += `🎯 Accuracy: <b>${accuracy}%</b>\n\n`;
  message += "⸻\n\n";

  // Inline button for "Go to Main Menu🏡"
  var button = [[{ text: "Go to Main Menu🏡", callback_data: "/close_menu" }]];

  // Send the message with inline button
  Api.sendMessage({
    text: message,
    parse_mode: "html",
    reply_markup: { inline_keyboard: button },
    on_result: "/messageid5" // Trigger /messageid5 to delete previous messages
  });
}

// Helper Functions
function getRandomPairs(count) {
  var shuffled = availablePairs.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function formatNumber(num) {
  var parts = num.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

function formatPrice(price) {
  if (price < 0.0001) return price.toFixed(8);
  else if (price < 0.01) return price.toFixed(6);
  else if (price < 1) return price.toFixed(4);
  else return formatNumber(price.toFixed(2));
}
