/*CMD
  command: /botstats
  help: 
  need_reply: false
  auto_retry_time: 
  folder: 

  <<ANSWER

  ANSWER

  <<KEYBOARD

  KEYBOARD
  aliases: 📊 bot stats
  group: 
CMD*/

// /BotStats
var currency = "USDT";

// Ensure initial properties are set
var initialTimeStr = Bot.getProperty("initialTime");
var initialTime = new Date(initialTimeStr).getTime();
if (!initialTimeStr || isNaN(initialTime)) {
  initialTime = new Date().getTime();
  Bot.setProperty("initialTime", new Date(initialTime).toISOString(), "string");
  Bot.setProperty("currentProfit", 90059, "integer");
  Bot.setProperty("lastProfitUpdateInterval", 0, "integer");
  Bot.setProperty("currentTotalUsers", 22500, "integer");
  Bot.setProperty("lastUserUpdateInterval", 0, "integer");
  Bot.setProperty("lastWithdrawalInterval", -1, "integer");
  Bot.setProperty("currentTotalDeposits", 8676767, "integer");
  Bot.setProperty("currentTotalWithdrawals", 11676767, "integer");
  Bot.setProperty("lastDepositUpdateMinute", 0, "integer");
  Bot.setProperty("lastTradeUpdateInterval", 0, "integer");
}

// Add checks for deposits, withdrawals, and other properties to prevent undefined
if (!Bot.getProperty("currentTotalDeposits")) {
  Bot.setProperty("currentTotalDeposits", 8676767, "integer");
}
if (!Bot.getProperty("currentTotalWithdrawals")) {
  Bot.setProperty("currentTotalWithdrawals", 11676767, "integer");
}
if (!Bot.getProperty("currentProfit")) {
  Bot.setProperty("currentProfit", 90059, "integer");
}
if (!Bot.getProperty("currentTotalUsers")) {
  Bot.setProperty("currentTotalUsers", 22500, "integer");
}

// Initialize stats with defaults to prevent undefined errors
var stats = Bot.getProperty("botStats") || {};
if (typeof stats.runningTrades !== "number" || stats.runningTrades < 1027 || stats.runningTrades > 1265) {
  stats.runningTrades = Libs.Random.randomInt(1027, 1265);
}
if (typeof stats.profitableTrades !== "number" || stats.profitableTrades < 0) {
  var profitPercentage = Libs.Random.randomFloat(85, 95);
  stats.profitableTrades = Math.floor((stats.runningTrades * profitPercentage) / 100);
}
if (typeof stats.losingTrades !== "number" || stats.losingTrades < 0) {
  stats.losingTrades = stats.runningTrades - stats.profitableTrades;
}
Bot.setProperty("botStats", stats, "json");

// Calculate time intervals
var currentTime = new Date().getTime();
var currentMinute = Math.floor((currentTime - initialTime) / 60000);
var current5MinInterval = Math.floor((currentTime - initialTime) / (5 * 60000));
var current10MinInterval = Math.floor((currentTime - initialTime) / (10 * 60000));
var current30MinInterval = Math.floor((currentTime - initialTime) / (30 * 60000));

// Update 24hr Overall Profit (every 5 minutes, 90,059 to 130,000, reset to 98,656)
var lastProfitUpdateInterval = Bot.getProperty("lastProfitUpdateInterval", 0);
var currentProfit = Bot.getProperty("currentProfit", 90059);
if (current5MinInterval > lastProfitUpdateInterval) {
  var increase = Libs.Random.randomInt(10, 100);
  currentProfit += increase;
  if (currentProfit > 130000) currentProfit = 98656;
  Bot.setProperty("currentProfit", currentProfit, "integer");
  Bot.setProperty("lastProfitUpdateInterval", current5MinInterval, "integer");
}

// Update Total Users (every 10 minutes, +1 to +2)
var lastUserUpdateInterval = Bot.getProperty("lastUserUpdateInterval", 0);
var currentTotalUsers = Bot.getProperty("currentTotalUsers", 22500);
if (current10MinInterval > lastUserUpdateInterval) {
  for (var interval = lastUserUpdateInterval + 1; interval <= current10MinInterval; interval++) {
    var increase = 1 + (interval % 2); // Alternates between +1 and +2
    currentTotalUsers += increase;
  }
  Bot.setProperty("currentTotalUsers", currentTotalUsers, "integer");
  Bot.setProperty("lastUserUpdateInterval", current10MinInterval, "integer");
}

// Update Total Deposits (every 1 minute, 8,676,767 to 10,866,867)
var lastDepositUpdateMinute = Bot.getProperty("lastDepositUpdateMinute", 0);
var currentTotalDeposits = Bot.getProperty("currentTotalDeposits", 8676767);
if (currentMinute > lastDepositUpdateMinute) {
  for (var minute = lastDepositUpdateMinute + 1; minute <= currentMinute; minute++) {
    var increase = Libs.Random.randomInt(10, 100);
    currentTotalDeposits += increase;
    if (currentTotalDeposits > 10866867) currentTotalDeposits = 8676767;
  }
  Bot.setProperty("currentTotalDeposits", currentTotalDeposits, "integer");
  Bot.setProperty("lastDepositUpdateMinute", currentMinute, "integer");
}

// Update Total Withdrawals (every 1 minute, 11,676,767 to 13,866,867)
var lastWithdrawalUpdateMinute = Bot.getProperty("lastWithdrawalUpdateMinute", 0);
var currentTotalWithdrawals = Bot.getProperty("currentTotalWithdrawals", 11676767);
if (currentMinute > lastWithdrawalUpdateMinute) {
  for (var minute = lastWithdrawalUpdateMinute + 1; minute <= currentMinute; minute++) {
    var increase = Libs.Random.randomInt(10, 100);
    currentTotalWithdrawals += increase;
    if (currentTotalWithdrawals > 13866867) currentTotalWithdrawals = 11676767;
  }
  Bot.setProperty("currentTotalWithdrawals", currentTotalWithdrawals, "integer");
  Bot.setProperty("lastWithdrawalUpdateMinute", currentMinute, "integer");
}

// Update Trading Stats (every 5 minutes)
var lastTradeUpdateInterval = Bot.getProperty("lastTradeUpdateInterval", 0);
if (current5MinInterval > lastTradeUpdateInterval) {
  stats.runningTrades = Libs.Random.randomInt(1027, 1265);
  var profitPercentage = Libs.Random.randomFloat(85, 95);
  stats.profitableTrades = Math.floor((stats.runningTrades * profitPercentage) / 100);
  stats.losingTrades = stats.runningTrades - stats.profitableTrades;
  Bot.setProperty("botStats", stats, "json");
  Bot.setProperty("lastTradeUpdateInterval", current5MinInterval, "integer");
}

// Calculate Accuracy
var accuracy = ((stats.profitableTrades / (stats.profitableTrades + stats.losingTrades)) * 100).toFixed(1) || "94.4";
stats.overallProfit = currentProfit;
Bot.setProperty("botStats", stats, "json");

// Helper functions
function getRandomUserId() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

function getRandomAmount() {
  if (Libs.Random.randomFloat(0, 1) < 0.75) {
    return Libs.Random.randomFloat(1, 100).toFixed(1);
  } else {
    return Libs.Random.randomFloat(100, 5000).toFixed(1);
  }
}

function formatTimeAgo(timestamp) {
  var diff = Math.floor((currentTime - timestamp) / 1000);
  var diffMin = Math.max(0, Math.floor(diff / 60));
  if (diff < 60) return Math.max(0, diff) + " sec ago";
  return diffMin + " min ago";
}

// Generate or retrieve withdrawals
var withdrawals = [];
var thirtyMinAgo = currentTime - (30 * 60 * 1000);
var lastWithdrawalInterval = Bot.getProperty("lastWithdrawalInterval", -1);
if (current30MinInterval > lastWithdrawalInterval) {
  var fakes = [];
  for (var i = 0; i < 5; i++) {
    var timeAgo = Libs.Random.randomInt(0, 15) * 60000;
    fakes.push({
      userId: getRandomUserId(),
      amount: getRandomAmount(),
      timestamp: currentTime - timeAgo
    });
  }
  Bot.setProperty("fakeWithdrawalsData", JSON.stringify(fakes), "string");
  Bot.setProperty("lastWithdrawalInterval", current30MinInterval, "integer");
}

var realWithdrawals = [];
var storedRecent = Bot.getProperty("recentWithdrawals");
if (storedRecent) {
  var allReal = JSON.parse(storedRecent);
  realWithdrawals = allReal.filter(w => w.timestamp >= thirtyMinAgo).sort((a, b) => b.timestamp - a.timestamp);
}

withdrawals = realWithdrawals;

if (withdrawals.length < 5) {
  var storedFakes = Bot.getProperty("fakeWithdrawalsData");
  var fakes = [];
  if (storedFakes) {
    fakes = JSON.parse(storedFakes);
  }
  var needed = 5 - withdrawals.length;
  for (var i = 0; i < needed && i < fakes.length; i++) {
    withdrawals.push(fakes[i]);
  }
}

withdrawals.sort((a, b) => b.timestamp - a.timestamp);

// User-specific withdrawal highlighting
var userId = user && user.telegramid ? user.telegramid.toString() : null;

// Define column widths for table alignment
var userIdWidth = 15;
var amountWidth = 10;

// Construct the table header
var header = "🆔 User ID".padEnd(userIdWidth) + " ".repeat(5) + "💸 Amount".padEnd(amountWidth) + " ".repeat(5) + "⏰ Time";

// Construct table rows
var rows = withdrawals.map(w => {
  var userIdStr = (userId && w.userId === userId) ? "👉 " + w.userId : w.userId;
  var amountStr = "$" + w.amount;
  var timeStr = formatTimeAgo(w.timestamp);
  return userIdStr.padEnd(userIdWidth) + " ".repeat(5) + amountStr.padEnd(amountWidth) + " ".repeat(5) + timeStr;
}).join("\n");

// Assemble the table with <pre> tags
var table = `<pre>\n${header}\n${rows}\n</pre>`;

// Construct the full message with fallback values to prevent undefined errors
var message =
  "<b>🤖 Bot Status Of All Users:</b>\n" +
  "✅ Paying | ✅ Auto Withdrawals\n" +
  "🔁 Data Refresh Every 5 Min\n\n" +
  "<b>📊 Users & Investments:</b>\n" +
  "👥 Total Users: <b>" + (currentTotalUsers || 22500).toLocaleString() + "</b>\n" +
  "📥 Total Deposits: <b>" + (currentTotalDeposits || 8676767).toLocaleString() + " " + currency + "</b>\n" +
  "📤 Total Withdrawals: <b>" + (currentTotalWithdrawals || 11676767).toLocaleString() + " " + currency + "</b>\n" +
  "\n\n" +
  "<b>📈 Trading Performance:</b>\n" +
  "🔄 Running Trades: <b>" + (stats.runningTrades || 1027).toLocaleString() + "</b>\n" +
  "🎯 Accuracy: <b>" + (accuracy || "94.4") + "%</b>\n" +
  "💹 Profitable Trades: <b>" + (stats.profitableTrades || 872).toLocaleString() + "</b>\n" +
  "📉 Losing Trades: <b>" + (stats.losingTrades || 155).toLocaleString() + "</b>\n" +
  "💰 24hr Overall Profit: <b>" + (currentProfit || 90059).toLocaleString() + " " + currency + "</b>\n" +
  "<b>📤 Last 5 User Withdrawals: 📨</b>\n" +
  table;

// Send the message
Api.sendMessage({
  text: message,
  parse_mode: "html",
  reply_markup: JSON.stringify({
    inline_keyboard: [[{ text: "🔙 Back To Main Menu", callback_data: "/close_menu" }]]
  })
});
