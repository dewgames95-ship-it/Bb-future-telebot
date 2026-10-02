/*CMD
  command: /miner11
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

// command: /miner11

// ──[ Silent Ban Check ]──
var ban = Bot.getProperty(user.telegramid);
if (ban === "Ban") {
  return;
}

// ──[ Maintenance Check ]──
if (Bot.getProperty("maintenanceStatus") === "On") {
  Api.sendMessage({ text: "<b>🛠️ Maintenance in progress. Try later.</b>", parse_mode: "html" });
  return;
}

var options = options || {}; // Default to empty object if options is null/undefined

var slot = options.slot || 2; // Fallback to 2 for second VIP 1 plan
var miner2Profit = Libs.ResourcesLib.userRes("miner2Profit" + slot);
if (miner2Profit.value() >= 120) { // 120 days cycle for VIP 1
  Api.sendMessage({ text: "<b>⚠️ Your XRP/USDT Arbitrade (VIP 1) has expired.</b>", parse_mode: "html" });
  return;
}

var balance = Libs.ResourcesLib.userRes("balance");
var dailyProfit = 1.2;
balance.add(dailyProfit);

var minerProfitBalance = Libs.ResourcesLib.userRes("minerProfitBalance");
minerProfitBalance.add(dailyProfit);

miner2Profit.add(1);
var currentDay = miner2Profit.value(); // Show Day 2 on first trigger (1 + 1)

// Check miningHistory for multiple VIP 1 plans
var historyString = User.getProperty("miningHistory");
var miningHistory = [];
if (historyString) {
  try {
    miningHistory = JSON.parse(historyString);
  } catch (e) {
    miningHistory = [];
  }
}

// Count VIP 1 plans
var vip1Count = miningHistory.filter(function(rec) { return rec.planName.includes("VIP 1"); }).length;

// Determine plan label
var planLabel = vip1Count > 1 ? " (Plan " + slot + ")" : "";

// Generate random trade metrics
var totalTrades = Math.floor(Math.random() * (25 - 10 + 1)) + 10; // Random between 10 and 25
var winningPercentage = Math.floor(Math.random() * (90 - 60 + 1)) + 60; // Random between 60% and 90%
var winningTrades = Math.floor((totalTrades * winningPercentage) / 100);
var losingTrades = totalTrades - winningTrades;
var runningTrades = winningTrades - losingTrades;
var volumeTraded = (Math.random() * (978 - 300) + 300).toFixed(2); // Random between 300 and 978
volumeTraded = parseFloat(volumeTraded).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

Api.sendMessage({
  text: "<b>🎯 VIP 1" + planLabel + " – Trade Performance Report 24hr</b>\n\n" +
        "💰 Realised PNL: <b>" + dailyProfit.toFixed(2) + " USDT</b>\n" +
        "💹 Updated Balance: <b>" + balance.value().toFixed(2) + " USDT</b>\n" +
        "♻️ Profit Cycle: <b>(Day " + currentDay + ")</b>\n\n" +
        "<b>📊 Trade Breakdown</b>\n" +
        "📦 Total Trades: <b>" + totalTrades + "</b>\n" +
        "✅ Winning: <b>" + winningTrades + "</b>\n" +
        "❌ Losing: <b>" + losingTrades + "</b>\n" +
        "⏳ Running: <b>" + runningTrades + "</b>\n" +
        "💼 Volume Traded: <b>" + volumeTraded + " USDT</b>\n" +
        "━━━━━━━━━━━━━━━━━━━\n" +
        "<b>💡 Pro Tip:</b> <i>Upgrade to a higher VIP Plan for bigger trade volumes, faster cycles, and more profit! 🚀</i>",
  parse_mode: "html"
});

Bot.run({ command: "/miner11", run_after: 86400, options: { slot: slot } });
