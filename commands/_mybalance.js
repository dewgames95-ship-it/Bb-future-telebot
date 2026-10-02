/*CMD
  command: /mybalance
  help: 
  need_reply: false
  auto_retry_time: 
  folder: 

  <<ANSWER

  ANSWER

  <<KEYBOARD

  KEYBOARD
  aliases: 💰 my balance
  group: 
CMD*/

//command /mybalance
var ban = Bot.getProperty(user.telegramid);
if (ban === "Ban") {
  var banText = "<b>🚫 You are banned from using this bot.</b>\n<b>💡 Contact support for more information.</b>";
  Api.sendMessage({ text: banText, parse_mode: "html" });
  return;
}

var maintenanceStatus = Bot.getProperty("maintenanceStatus");
if (maintenanceStatus === "On") {
  var onText = "<b>🛠️ The bot is currently under maintenance.</b>\n<b>⏳ Please check back later!</b>";
  Api.sendMessage({ text: onText, parse_mode: "html" });
  return;
}

var userName = user.first_name;
var userID = user.telegramid;
var balance = Libs.ResourcesLib.userRes("balance");
var minerProfitBalance = Libs.ResourcesLib.userRes("minerProfitBalance");
var currency = "USDT";

// Define the interest period (configurable)
var interestPeriod = 24 * 60 * 60 * 1000; // 24 hours

// INTEREST CREDIT BLOCK
var interestMsg = "";
var now = Date.now();
var lastInterest = Bot.getProperty("lastInterestTimestamp_" + userID) || User.getProperty("lastInterestTimestamp");
if (!lastInterest) {
  lastInterest = now;
  Bot.setProperty("lastInterestTimestamp_" + userID, now, "string");
  User.setProperty("lastInterestTimestamp", now, "string");
}
var elapsed = now - parseInt(lastInterest);
var periods = Math.floor(elapsed / interestPeriod);
if (periods > 0) {
  var currentProfit = minerProfitBalance.value();
  var interestEarned = currentProfit * 0.01 * periods;
  var totalInterest = Number(Bot.getProperty("totalInterest_" + userID) || User.getProperty("totalInterest") || 0);
  totalInterest += interestEarned;
  Bot.setProperty("totalInterest_" + userID, totalInterest, "string");
  User.setProperty("totalInterest", totalInterest, "string");
  balance.add(interestEarned);
  minerProfitBalance.add(interestEarned);
  var newLastInterest = parseInt(lastInterest) + periods * interestPeriod;
  Bot.setProperty("lastInterestTimestamp_" + userID, newLastInterest, "string");
  User.setProperty("lastInterestTimestamp", newLastInterest, "string");
  interestMsg = "<b>🔔 Interest Credited!</b>\n" +
                "You received <b>$" + interestEarned.toFixed(4) + "</b> interest on a profit of <b>$" +
                currentProfit.toFixed(4) + "</b>, added to both your Main Balance and Profit Balance.\n" +
                "New Main Balance: <b>$" + balance.value().toFixed(4) + "</b>\n" +
                "New Profit Balance: <b>" + minerProfitBalance.value().toFixed(4) + "</b>\n\n";
}

// VIP & Investment Calculation
var vipPlansData = {
  "VIP 1": { cost: 30, dailyProfit: 1.2 },
  "VIP 2": { cost: 150, dailyProfit: 7.50 },
  "VIP 3": { cost: 600, dailyProfit: 39.00 },
  "VIP 4": { cost: 3000, dailyProfit: 270.00 },
  "VIP 5": { cost: 8000, dailyProfit: 960.00 },
  "VIP 6": { cost: 18000, dailyProfit: 2880.00 }
};

// Load real mining history
var realHistoryString = Bot.getProperty("miningHistory_" + userID);
if (!realHistoryString) {
  realHistoryString = User.getProperty("miningHistory") || "[]";
  Bot.setProperty("miningHistory_" + userID, realHistoryString, "string");
}

// Sync User property with Bot's real history for consistency
User.setProperty("miningHistory", realHistoryString, "string");

// Sync demo history as copy of real history
var demoHistoryString = realHistoryString;
Bot.setProperty("demoMiningHistory_" + userID, demoHistoryString, "string");

// Unlock bonus if any VIP plans exist
var miningHistoryCheck = [];
try {
  miningHistoryCheck = JSON.parse(demoHistoryString);
} catch (e) {
  miningHistoryCheck = [];
}
if (miningHistoryCheck.length > 0) {
  Bot.setProperty("hasUnlockedBonus_" + userID, true, "boolean");
}

// Use demo history for display calculations
var miningHistory = miningHistoryCheck;

var nowTime = Date.now();
var groups = {
  "VIP 1": [],
  "VIP 2": [],
  "VIP 3": [],
  "VIP 4": [],
  "VIP 5": [],
  "VIP 6": []
};

for (var i = 0; i < miningHistory.length; i++) {
  var rec = miningHistory[i];
  var match = rec.planName.match(/VIP\s*\d+/);
  if (!match) continue;
  var planKey = match[0];
  var currentDay = Math.floor((nowTime - rec.purchaseTimestamp) / 86400000);
  if (currentDay < 1) currentDay = 1;
  rec.currentDay = currentDay;
  rec.profitEarned = vipPlansData[planKey].dailyProfit * currentDay;
  if (groups.hasOwnProperty(planKey) && vipPlansData.hasOwnProperty(planKey)) {
    groups[planKey].push(rec);
  }
}

var vipPlanDetails = "";
var totalInvestment = 0;
var totalDailyProfit = 0;
var vipOrder = ["VIP 1", "VIP 2", "VIP 3", "VIP 4", "VIP 5", "VIP 6"];

for (var j = 0; j < vipOrder.length; j++) {
  var plan = vipOrder[j];
  var records = groups[plan];
  var count = records.length;
  totalInvestment += count * vipPlansData[plan].cost;
  totalDailyProfit += count * vipPlansData[plan].dailyProfit;
  
  if (count === 0) {
    vipPlanDetails += "<b>🔹 " + plan + ":</b> <i>0 running</i>\n";
  } else if (count === 1) {
    var recTrack = records[0];
    vipPlanDetails += "<b>🔹 " + plan + ":</b> 1 running <b>(Day " + recTrack.currentDay + ")</b> ~ $" +
                      recTrack.profitEarned.toFixed(2) + "\n";
  } else {
    vipPlanDetails += "<b>🔹 " + plan + ":</b> " + count + " running\n";
    for (var k = 0; k < count; k++) {
      var recM = records[k];
      vipPlanDetails += "    <i>Plan " + (k+1) + "</i> <b>(Day " + recM.currentDay + ")</b> ~ $" +
                        recM.profitEarned.toFixed(2) + "\n";
    }
  }
}

var overallROI = totalInvestment > 0 ? (totalDailyProfit / totalInvestment) * 100 : 0;
var lastInterestTS = parseInt(Bot.getProperty("lastInterestTimestamp_" + userID) || User.getProperty("lastInterestTimestamp"));
var timeRemaining = interestPeriod - (now - lastInterestTS);
if (timeRemaining < 0) timeRemaining = 0;

var secondsLeft = Math.floor(timeRemaining / 1000);
var hoursLeft = Math.floor(secondsLeft / 3600);
var minutesLeft = Math.floor((secondsLeft % 3600) / 60);
var secondsRemainder = secondsLeft % 60;
var countdown = hoursLeft + "hr " + minutesLeft + "m " + secondsRemainder + "sec";

var totalInterestDisplay = Number(Bot.getProperty("totalInterest_" + userID) || User.getProperty("totalInterest") || 0);

var text = "";
if (interestMsg) text += interestMsg;
text += "<b>🔹 Name:</b> " + userName + "\n";
text += "<b>🔹 User ID:</b> <code>" + userID + "</code>\n\n";
text += "<b>💰 Wallet Details:</b>\n";
text += "✅ Main Balance: <b>" + balance.value().toFixed(4) + " " + currency + "</b>\n";
text += "💸 Total Profit Earned: <b>" + minerProfitBalance.value().toFixed(4) + " " + currency + "</b>\n";
if (!Bot.getProperty("hasUnlockedBonus_" + userID)) {
  text += "🎁 Bonus Locked: <b>10.00 USDT</b>\n";
}
text += "\n";
text += "<b>⚡ Total Active VIP Plans:</b>\n" + vipPlanDetails + "\n";
text += "<b>📊 Investment Summary:</b>\n";
text += "💼 Total Investment: <b>" + totalInvestment.toFixed(2) + " USDT</b>\n";
text += "💵 Daily Profit: <b>" + totalDailyProfit.toFixed(2) + " USDT</b> ~ <b>" + overallROI.toFixed(1) + "%</b>\n";
text += "💹 Total Interest Received (1% daily): <b>" + totalInterestDisplay.toFixed(2) + " USDT</b>\n";
text += "⏰ Next Interest In: <b>" + countdown + "</b>\n\n";
text += "<b>💹 Start earning passive income—deposit and grow your crypto effortlessly! 🚀</b>";

var buttons = [
  [{ text: "📈 Investment History", callback_data: "/miningHistory" }],
  [{ text: "🗒️ Deposit History",    callback_data: "/depositHistory" }],
  [{ text: "🏧 Withdrawal History", callback_data: "/withdrawalHistory" }],
  [{ text: "🏠 Go To Main Menu",    callback_data: "/close_menu" }]
];

Api.sendMessage({
  text: text,
  parse_mode: "html",
  reply_markup: { inline_keyboard: buttons }
});
