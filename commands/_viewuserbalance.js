/*CMD
  command: /viewuserbalance
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

// /viewuserbalance – Admin view of a specific user's details.
// Usage: /viewuserbalance <userID>
if (!params || params.trim() === "" || params.trim() === "/viewuserbalance") {
  Api.sendMessage({ 
    text: "<b>Please enter a valid User ID with the command. For example: /viewuserbalance 123456789</b>", 
    parse_mode: "html" 
  });
  return;
}

var targetId = params.trim();

// Helper function for relative time display
function timeAgo(dateString) {
  var joinDate = new Date(dateString);
  var now = new Date();
  var diff = now - joinDate;
  var seconds = Math.floor(diff / 1000);
  var minutes = Math.floor(seconds / 60);
  var hours = Math.floor(minutes / 60);
  var days = Math.floor(hours / 24);
  if (days > 0) return days + " day(s) ago";
  if (hours > 0) return hours + " hour(s) ago";
  if (minutes > 0) return minutes + " minute(s) ago";
  return seconds + " second(s) ago";
}

// Fetch user details
var firstName = Bot.getProperty("firstName_" + targetId) || "Unknown";
var lastName = Bot.getProperty("lastName_" + targetId) || "";
var fullName = (firstName + " " + lastName).trim();
var username = Bot.getProperty("username_" + targetId) || "Unknown";
var walletAddr = User.getProperty("wallet", targetId, "string") || "Not set";

// Retrieve user balance and total deposits
var userBalance = Libs.ResourcesLib.anotherUserRes("balance", targetId).value() || 0;
var minerProfitBalance = Libs.ResourcesLib.anotherUserRes("minerProfitBalance", targetId).value() || 0;
var totalDeposits = Number(Bot.getProperty("totalDeposits_" + targetId) || 0);

// Retrieve mining history and calculate total miner profit
var miningHistoryRaw = Bot.getProperty("miningHistory_" + targetId) || "[]";
var miningHistory = [];
try {
  miningHistory = JSON.parse(miningHistoryRaw);
} catch (e) {
  miningHistory = [];
}

var vipPlansData = {
  "VIP 1": { dailyProfit: 1.2 },
  "VIP 2": { dailyProfit: 7.5 },
  "VIP 3": { dailyProfit: 39 },
  "VIP 4": { dailyProfit: 270 },
  "VIP 5": { dailyProfit: 960 },
  "VIP 6": { dailyProfit: 2880 }
};

var now = Date.now();
var groups = { "VIP 1": [], "VIP 2": [], "VIP 3": [], "VIP 4": [], "VIP 5": [], "VIP 6": [] };
var totalMinerProfit = 0;
miningHistory.forEach(rec => {
  var m = rec.planName.match(/VIP\s*\d+/);
  if (!m) return;
  var key = m[0];
  if (groups[key] && (now - rec.purchaseTimestamp < rec.expirationDays * 86400000)) {
    var dayCount = Math.floor((now - rec.purchaseTimestamp) / 86400000) || 1;
    rec.currentDay = dayCount;
    rec.profitEarned = vipPlansData[key].dailyProfit * dayCount;
    totalMinerProfit += rec.profitEarned;
    groups[key].push(rec);
  }
});

// Build Active VIP Plans section
var vipOrder = ["VIP 1", "VIP 2", "VIP 3", "VIP 4", "VIP 5", "VIP 6"];
var vipDetails = "<b>⚡ Active VIP Plans:</b>\n\n";
vipOrder.forEach(plan => {
  var list = groups[plan];
  if (list.length === 0) {
    vipDetails += "<b>🔹 " + plan + ":</b> <i>0 running</i>\n";
  } else if (list.length === 1) {
    vipDetails += "<b>🔹 " + plan + ":</b> 1 running <b>(Day " + list[0].currentDay + ")</b> ~ $" + list[0].profitEarned.toFixed(2) + "\n";
  } else {
    vipDetails += "<b>🔹 " + plan + ":</b> " + list.length + " running\n";
    list.forEach((r, i) => {
      vipDetails += "    <i>Plan " + (i + 1) + "</i> <b>(Day " + r.currentDay + ")</b> ~ $" + r.profitEarned.toFixed(2) + "\n";
    });
  }
});

// Retrieve referral info
var referralCount = Libs.ResourcesLib.anotherUserRes("referralCount", targetId).value() || 0;
var refDepositTotal = Libs.ResourcesLib.anotherUserRes("refDepositTotal", targetId).value() || 0;
var totalRefCommission = Libs.ResourcesLib.anotherUserRes("totalRefCommission", targetId).value() || 0;
var refCommission = Libs.ResourcesLib.anotherUserRes("refCommission", targetId).value() || 0;
var refWithdrawn = Libs.ResourcesLib.anotherUserRes("refWithdrawn", targetId).value() || 0;

// Fetch and process referral list
var referralListRaw = Bot.getProperty("referralList_" + targetId) || "[]";
var referralList = JSON.parse(referralListRaw);
var referralDataRaw = Bot.getProperty("referralData_" + targetId) || "{}";
var referralData = JSON.parse(referralDataRaw);

// Retrieve withdrawal history and calculate sums
var withdrawalHistory = Bot.getProperty("withdrawalHistory_" + targetId, []);
var manualSum = 0, autoSum = 0, manualCount = 0, autoCount = 0;
if (Array.isArray(withdrawalHistory)) {
  withdrawalHistory.forEach(entry => {
    var amt = parseFloat(entry.amount) || 0;
    if (entry.type === "manual") {
      manualSum += amt;
      manualCount++;
    } else if (entry.type === "auto") {
      autoSum += amt;
      autoCount++;
    }
  });
}

// Fetch deposit history
var depositHistoryRaw = Bot.getProperty("depositHistory_" + targetId) || "";
var depositHistory = [];
// Validate that depositHistoryRaw is a non-empty string before processing
if (typeof depositHistoryRaw === "string" && depositHistoryRaw.trim().length > 0) {
  try {
    depositHistory = depositHistoryRaw.split("\n").map(line => {
      var parts = line.split(" - ");
      var dateStr = parts[0];
      var amountStr = parts[1].split(" ")[1];
      return { date: dateStr, amount: parseFloat(amountStr) };
    }).reverse().slice(0, 5); // Last 5 deposits
  } catch (e) {
    // Skip invalid deposit history to prevent errors
    depositHistory = [];
  }
}

// Build output text
var userLink = "<a href='tg://user?id=" + targetId + "'>" + fullName + "</a>";
var output = "<b>Username: @" + username + "</b>\n" +
             "<b>👤 User: " + userLink + "</b>\n" +
             "<b>User id: <code>" + targetId + "</code></b>\n\n" +
             "<b>🏦 Wallet: <code>" + walletAddr + "</code></b>\n\n" +
             "<b>💸 Total Miner Profit: " + minerProfitBalance.toFixed(2) + " USDT</b>\n" +
             "<b>💼 Total Balance: " + userBalance.toFixed(2) + " USDT</b>\n\n" +
             "<b>🔹 Total Referrals: " + referralCount + "</b>\n" +
             "<b>🔹 Total Referral Deposits: " + refDepositTotal.toFixed(2) + " USDT</b>\n" +
             "<b>🔹 Total Referral Earnings: " + totalRefCommission.toFixed(2) + " USDT</b>\n" +
             "<b>✅ Total Referral Withdrawn: " + refWithdrawn.toFixed(2) + " USDT</b>\n" +
             "<b>✅ Available Referral Balance: " + refCommission.toFixed(2) + " USDT</b>\n\n" +
             vipDetails + "\n\n" +
             "<b>💼 Manual Withdrawals: " + manualSum.toFixed(2) + " USDT</b>\n" +
             "<b>🤖 Auto Withdrawals: " + autoSum.toFixed(2) + " USDT</b>\n" +
             "<b>📊 Times Auto: " + autoCount + "</b>\n" +
             "<b>📊 Times Manual: " + manualCount + "</b>\n" +
             "<b>💳 Total Deposits: " + totalDeposits.toFixed(2) + " USDT</b>\n";

// Conditionally add referral list
var depositedRefs = 0;
if (referralList.length > 0) {
  var refText = "<b>👥 Referrals (" + referralList.length + "):</b>\n";
  referralList.forEach(refId => {
    var refData = referralData[refId];
    if (refData && refData.totalDeposit > 0) {
      depositedRefs++;
      var refName = refData.firstName + (refData.lastName ? " " + refData.lastName : "");
      refText += "• " + refName + "  — ID: <code>" + refId + "</code>\n" +
                 "    • Deposit: " + refData.totalDeposit.toFixed(2) + " USDT, Comm: " + refData.totalCommission.toFixed(2) + " USDT\n";
    }
  });
  if (depositedRefs > 0) {
    output += "\n" + refText;
  }
}

// Conditionally add deposit history
if (depositHistory.length > 0) {
  output += "\n<b>Top 5 Deposit History</b>\n\n";
  depositHistory.forEach(dep => {
    output += "📅 " + dep.date + "\n" +
              "💸 Amount: " + dep.amount.toFixed(2) + " USDT\n";
  });
}

// Conditionally add withdrawal history
if (withdrawalHistory.length > 0) {
  output += "\n<b>Top 5 WITHDRAWAL HISTORY</b>\n\n";
  var recentWithdrawals = withdrawalHistory.slice(-5).reverse();
  recentWithdrawals.forEach((entry, index) => {
    output += (index + 1) + ". 💸 Amount: <b>" + entry.amount + " USDT</b>\n" +
              "📅 Date: " + entry.date + "\n" +
              "🏦 Address: <code>" + entry.wallet + "</code>\n\n";
  });
}

// Inline buttons for further admin actions
var buttons = [
  [
    { text: "✉️ Send Private Message", callback_data: "/send " + targetId }
  ],
  [
    { text: "🔙 Back", callback_data: "/adminPanel" }
  ]
];

Api.sendMessage({
  text: output,
  reply_markup: { inline_keyboard: buttons },
  parse_mode: "html"
});
