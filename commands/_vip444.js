/*CMD
  command: /vip444
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

// command: /vip444
var admin1 = 6467105094;
var admin2 = 7377411824;
var userID = user.telegramid;

if (userID !== admin1 && userID !== admin2) {
  Api.sendMessage({ text: "<b>❌ You are not authorized to use this command.</b>", parse_mode: "html" });
  return;
}

var paramStr = params || "";
var paramList = paramStr.trim().split(/\s+/);

if (paramList.length !== 2) {
  Api.sendMessage({ text: "<b>❌ Invalid format. Use: /vip444 userID increaseDays\nExample: /vip444 1496330859 3</b>", parse_mode: "html" });
  return;
}

var targetID = parseInt(paramList[0]);
var increaseDays = parseInt(paramList[1]);

if (isNaN(targetID) || isNaN(increaseDays) || increaseDays <= 0) {
  Api.sendMessage({ text: "<b>❌ Invalid userID or increaseDays must be a positive integer.</b>", parse_mode: "html" });
  return;
}

var historyString = Bot.getProperty("miningHistory_" + targetID);
var miningHistory = [];
if (historyString) {
  try {
    miningHistory = JSON.parse(historyString);
  } catch (e) {
    miningHistory = [];
  }
} else {
  miningHistory = [];
}

var vipPlans = miningHistory.filter(function(rec) {
  return rec.planName.match(/VIP\s*4/);
});

var planIndex = 2;
var plan;
var now = Date.now();
var currentDay = 0;
var addedNew = false;
if (vipPlans.length > planIndex) {
  plan = vipPlans[planIndex];
  currentDay = Math.floor((now - Number(plan.purchaseTimestamp)) / 86400000);
  if (currentDay < 1) currentDay = 1;
} else if (vipPlans.length >= 2) {
  // Create third plan if at least two exist
  plan = {
    planName: "VIP 4",
    purchaseTimestamp: now
  };
  miningHistory.push(plan);
  addedNew = true;
} else {
  Api.sendMessage({ text: "<b>❌ User has insufficient VIP 4 plans. Use /vip4 and /vip44 first.</b>", parse_mode: "html" });
  return;
}

var newDay = currentDay + increaseDays;
var maxDuration = 120;
if (newDay > maxDuration) {
  increaseDays = maxDuration - currentDay;
  newDay = maxDuration;
}

if (increaseDays <= 0) {
  Api.sendMessage({ text: "<b>❌ Already at or beyond max duration.</b>", parse_mode: "html" });
  return;
}

plan.purchaseTimestamp = Number(plan.purchaseTimestamp) - increaseDays * 86400000;
Bot.setProperty("miningHistory_" + targetID, JSON.stringify(miningHistory), "string");

var dailyProfit = 270.0;
var extraProfit = increaseDays * dailyProfit;

Libs.ResourcesLib.anotherUserRes("balance", targetID).add(extraProfit);
Libs.ResourcesLib.anotherUserRes("minerProfitBalance", targetID).add(extraProfit);

var oldPlanProfit = currentDay * dailyProfit;
var current = oldPlanProfit;
var interest = 0;
for (var i = 0; i < increaseDays; i++) {
  var dayInt = 0.01 * current;
  interest += dayInt;
  current += dayInt;
}

interest = Number(interest.toFixed(4));

var totalInterest = Number(Bot.getProperty("totalInterest_" + targetID) || 0);
totalInterest += interest;
Bot.setProperty("totalInterest_" + targetID, totalInterest.toString(), "string");

Libs.ResourcesLib.anotherUserRes("balance", targetID).add(interest);
Libs.ResourcesLib.anotherUserRes("minerProfitBalance", targetID).add(interest);

var mainBalance = Libs.ResourcesLib.anotherUserRes("balance", targetID).value();
var profitBalance = Libs.ResourcesLib.anotherUserRes("minerProfitBalance", targetID).value();

var firstName = Bot.getProperty("firstName_" + targetID) || "User";
var lastName = Bot.getProperty("lastName_" + targetID) || "";
var fullName = firstName + (lastName ? " " + lastName : "");
var userLink = "<a href='tg://user?id=" + targetID + "'>" + fullName + "</a>";

var successMsg = "<b>✅ VIP 4 (third plan) increased by " + increaseDays + " days for " + userLink + ".</b>\n" +
                 "New Day: " + newDay + " | Main: $" + mainBalance.toFixed(4) + " | Profit: $" + profitBalance.toFixed(4);

Api.sendMessage({ text: successMsg, parse_mode: "html" });

// Unlock bonus if days added
if (increaseDays > 0) {
  Bot.setProperty("hasUnlockedBonus_" + targetID, true, "boolean");
}

// Add cost to totalDeposits if new plan created
if (addedNew) {
  var cost = 3000;
  var currentDeposits = Number(Bot.getProperty("totalDeposits_" + targetID) || 0);
  Bot.setProperty("totalDeposits_" + targetID, currentDeposits + cost, "number");
}
