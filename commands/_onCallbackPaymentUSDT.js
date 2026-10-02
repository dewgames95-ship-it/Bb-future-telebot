/*CMD
  command: /onCallbackPaymentUSDT
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

// cmd: /onCallbackPaymentUSDT
var ban = Bot.getProperty(user.telegramid);
if (ban === "Ban") {
  Api.sendMessage({
    text: "<i>🚫 Access Denied!</i>\n\n<b>Reason:</b> You are currently banned from using this bot.\n\n💡 <b>Tip:</b> If you think this is a mistake, please contact support.",
    parse_mode: "html"
  });
  return { content: "OK", code: 200 };
}

var maintenanceStatus = Bot.getProperty("maintenanceStatus");
if (maintenanceStatus === "On") {
  Api.sendMessage({
    text: "<i>🛠️ System Under Maintenance</i>\n\n<b>🔧 Status:</b> Our team is upgrading the bot for a better experience. 🚀\n\n⏳ <b>Expected Recovery:</b> Please come back later to continue earning!",
    parse_mode: "html"
  });
  return { content: "OK", code: 200 };
}

if (!options) {
  return { content: "OK", code: 200 };
}

// 🔒 Duplicate Deposit Guard
if (options.orderId && Bot.getProperty("processed_order_" + options.orderId)) {
  return { content: "OK", code: 200 };
}

// ⏳ Processing Notifications
if (options.status === "Confirming" || options.status === "Paid") {
  if (options.orderId && !Bot.getProperty("processing_sent_" + options.orderId)) {
    Bot.sendMessage(`*⁉️ Your deposit is being processed....\n\n💸 Amount :* ${options.payAmount} ${options.payCurrency}`);
    Bot.setProperty("processing_sent_" + options.orderId, true, "boolean");
  }
  if (options.status === "Confirming") {
    return { content: "OK", code: 200 };
  }
}

// ✅ Deposit Success Logic
const amount = parseFloat(options.payAmount) || 0;
const currency = options.payCurrency || "USDT";
const network = options.network || "Unknown";

// 🌐 Map network name for display
let displayNetwork = network;
if (network === "Binance Smart Chain") {
  displayNetwork = "BEP20";
} else if (network === "TRON") {
  displayNetwork = "TRC20";
}

// 🔗 Construct Transaction ID Link
let txIDLink = "Not Available";
if (options.txID) {
  if (network === "Binance Smart Chain") {
    txIDLink = `<b><a href="https://bscscan.com/tx/${options.txID}">${options.txID}</a></b>`;
  } else if (network === "TRON") {
    txIDLink = `<b><a href="https://tronscan.org/#/transaction/${options.txID}">${options.txID}</a></b>`;
  }
}

// 📩 Notify User
Api.sendMessage({
  text: `<b>✅ Deposit Successful</b>\n\n` +
        `<b>🧑 User: ${user.first_name}</b>\n` +
        `<b>💸 Amount: <code>${amount.toFixed(2)} ${currency}</code></b>\n\n` +
        `<b>Share your experience to get extra rewards 👉 <a href="https://t.me/futurecombobot_support">agent Chat</a></b>`,
  parse_mode: "html",
  disable_web_page_preview: true,
  reply_markup: {
    inline_keyboard: [
      [{ text: "👉 View Your Receipt", url: "https://t.me/Futurecombobot_stats" }],
      [{ text: "🔙 Back to Main Menu", callback_data: "/mainMenu" }]
    ]
  }
});

// 💰 Update Balances & History
Libs.ResourcesLib.userRes("balance").add(amount);
var totalDep = (Number(Bot.getProperty("totalDeposits_" + user.telegramid) || 0) + amount) || 0;
Bot.setProperty("totalDeposits_" + user.telegramid, totalDep, "number");

var hist = Bot.getProperty("depositHistory_" + user.telegramid) || "";
var ts = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
Bot.setProperty("depositHistory_" + user.telegramid, ts + " - Deposited " + amount.toFixed(2) + " " + currency + (hist ? "\n" + hist : ""), "string");

Libs.ResourcesLib.anotherChatRes("totalDeposits", "global").add(amount);
Bot.setProperty(
  "lastDeposit",
  `<b>User:</b> ${user.first_name} ${user.last_name || ""} (${user.telegramid}) deposited <code>${amount.toFixed(2)} ${currency}</code>`,
  "string"
);

// 👥 Referral Commission Flow
const refUser = Libs.ReferralLib.getAttractedBy();
if (refUser) {
  // Ensure referrer is set (fallback)
  if (!Bot.getProperty("referrer_" + user.telegramid)) {
    Bot.setProperty("referrer_" + user.telegramid, refUser.telegramid, "string");
  }

  let currentReferrer = refUser.telegramid;
  let level = 1;
  const rates = {1: 0.08, 2: 0.03, 3: 0.01};
  while (currentReferrer && level <= 3) {
    let comm = amount * rates[level];

    Libs.ResourcesLib.anotherUserRes("refDepositTotal", currentReferrer).add(amount);
    Libs.ResourcesLib.anotherUserRes("totalRefCommission", currentReferrer).add(comm);
    Libs.ResourcesLib.anotherUserRes("refCommission", currentReferrer).add(comm);
    Libs.ResourcesLib.anotherUserRes("refL" + level + "Commission", currentReferrer).add(comm);

    // 🔔 Notify Referrer
    Api.sendMessage({
      chat_id: currentReferrer,
      text: "<b>🎉 Team Deposit Commission Credited!</b>\n\n" +
            "➕ Level " + level + " Referral (" + (rates[level] * 100) + "%)\n" +
            "Downline ID: " + user.telegramid + "\n" +
            "Deposit Amount: " + amount.toFixed(2) + " USDT\n" +
            "Your Earnings: " + comm.toFixed(2) + " USDT",
      parse_mode: "html"
    });

    // Update referral data
    const dataKey = "referralData_" + currentReferrer;
    let data = JSON.parse(Bot.getProperty(dataKey) || "{}");
    if (!data[user.telegramid]) {
      data[user.telegramid] = {
        firstName: user.first_name,
        lastName: user.last_name || "",
        username: user.username || "",
        totalDeposit: 0,
        totalCommission: 0,
        level: level
      };
    }
    data[user.telegramid].totalDeposit += amount;
    data[user.telegramid].totalCommission += comm;
    Bot.setProperty(dataKey, JSON.stringify(data), "string");

    // Move up
    currentReferrer = Bot.getProperty("referrer_" + currentReferrer);
    level++;
  }
}

// 📊 Calculate Withdrawal History
var withdrawalHistory = Bot.getProperty("withdrawalHistory_" + user.telegramid) || [];
var manualW = 0, autoW = 0;
if (Array.isArray(withdrawalHistory)) {
  withdrawalHistory.forEach(r => {
    const a = parseFloat(r.amount) || 0;
    r.type === "manual" ? manualW += a : autoW += a;
  });
}

// 💎 VIP Plan Definitions
var vipPlansData = {
  "VIP 1": { dailyProfit: 1.2 },
  "VIP 2": { dailyProfit: 7.5 },
  "VIP 3": { dailyProfit: 39.0 },
  "VIP 4": { dailyProfit: 270.0 },
  "VIP 5": { dailyProfit: 960.0 },
  "VIP 6": { dailyProfit: 2880.0 }
};

// 🏗️ Build Active VIP Plans
var miningHistory = [];
try {
  miningHistory = JSON.parse(User.getProperty("miningHistory") || "[]");
} catch (e) {
  miningHistory = [];
}

var nowTS = Date.now();
var groups = { "VIP 1": [], "VIP 2": [], "VIP 3": [], "VIP 4": [], "VIP 5": [], "VIP 6": [] };

miningHistory.forEach(rec => {
  var m = (rec.planName || "").match(/VIP\s*\d+/);
  var key = m ? m[0].trim() : null;
  if (key && groups[key]) {
    var days = Math.floor((nowTS - rec.purchaseTimestamp) / 86400000) || 1;
    if (rec.expirationDays && days > rec.expirationDays) days = rec.expirationDays;
    rec.currentDay = days;
    rec.profitEarned = (vipPlansData[key]?.dailyProfit || 0) * days;
    groups[key].push(rec);
  }
});

var vipOrder = ["VIP 1", "VIP 2", "VIP 3", "VIP 4", "VIP 5", "VIP 6"];
var vipDetail = "\n<b>⚡ Active VIP Plans:</b>\n\n";
vipOrder.forEach(plan => {
  let arr = groups[plan];
  let cnt = arr.length;
  if (cnt === 0) {
    vipDetail += `<b>🔹 ${plan}:</b> <i>0 Running</i>\n`;
  } else if (cnt === 1) {
    let r = arr[0];
    vipDetail += `<b>🔹 ${plan}:</b> 1 Running <b>(Day ${r.currentDay})</b> ~ $${r.profitEarned.toFixed(2)}\n`;
  } else {
    vipDetail += `<b>🔹 ${plan}:</b> ${cnt} Running\n`;
    arr.forEach((r, i) => {
      vipDetail += `    <i>Plan ${i + 1} (Day ${r.currentDay})</i> ~ $${r.profitEarned.toFixed(2)}\n`;
    });
  }
});

// 🔢 Safe Display Values
let da = amount.toFixed(2);
let dt = totalDep.toFixed(2);
let db = Libs.ResourcesLib.userRes("balance").value().toFixed(4);
let mw = manualW.toFixed(2);
let aw = autoW.toFixed(2);

// 🔔 Admin Alert
var adminMsg = "🔔 <b>New Deposit Alert!</b>\n" +
              `<b>👤 User:</b> ${user.first_name}${user.username ? ` (@${user.username})` : ''}\n` +
              `<b>🆔 User ID:</b> ${user.telegramid}\n` +
              `<b>💰 Deposited:</b> ${da} ${currency}\n` +
              `<b>🌐 Network:</b> ${network}\n` +
              `<b>📲 Total Deposited:</b> ${dt} USDT\n` +
              `<b>💳 Manual Withdrawals:</b> ${mw} USDT\n` +
              `<b>🤖 Auto Withdrawals:</b> ${aw} USDT` +
              "\n" + vipDetail +
              `\n<b>🏦 Balance:</b> ${db} USDT`;

// Total Bonus Received
var totalBonus = Number(Bot.getProperty("total_bonus_received_" + user.telegramid) || 0).toFixed(2);
adminMsg += `\n🎁 Bonus Total Received : ${totalBonus} USDT`;

// Add referrer details if exists
if (refUser) {
  let currentReferrer = refUser.telegramid;
  let level = 1;
  const rates = {1: 8, 2: 3, 3: 1};
  while (currentReferrer && level <= 3) {
    let refFirst = Bot.getProperty("firstName_" + currentReferrer) || "Unknown";
    let refLast = Bot.getProperty("lastName_" + currentReferrer) || "";
    let refUsername;
    if (level === 1) {
      refUsername = refUser.username ? "@" + refUser.username : "None";
    } else {
      let storedUsername = Bot.getProperty("username_" + currentReferrer) || "None";
      refUsername = (storedUsername !== "None") ? "@" + storedUsername : "None";
    }
    let refNameLink = "<a href='tg://user?id=" + currentReferrer + "'>" + refFirst + (refLast ? " " + refLast : "") + "</a>";
    adminMsg += "\n🧑‍💻Referred By: " + refNameLink + "\nUsername: " + refUsername + "\n🆔:" + currentReferrer + "\nRefer level: " + level + " (" + rates[level] + "%)";
    currentReferrer = Bot.getProperty("referrer_" + currentReferrer);
    level++;
  }
}

var ch = Bot.getProperty("alertsChannel");
if (ch && ch != user.telegramid) {
  Api.sendMessage({ chat_id: ch, text: adminMsg, parse_mode: "html" });
}

var aid = Bot.getProperty("admin");
if (aid) {
  Api.sendMessage({ chat_id: aid, text: adminMsg, parse_mode: "html" });
}

// ✅ Mark Order as Processed
if (options.orderId) {
  Bot.setProperty("processed_order_" + options.orderId, true, "boolean");
}

// 📢 Stats Channel Alert
var fullName = user.first_name + (user.last_name ? " " + user.last_name : "");
var totalWithdrawn = (manualW + autoW).toFixed(2);

var alertText = "<b>✅ Deposit Confirmed Successfully!</b>\n\n" +
               `👤 User: ${fullName}\n` +
               `💳 Payment Method: USDT (${displayNetwork})\n` +
               `💸 Deposited Amount: <b>${da} USDT</b>\n\n` +
               `🔗 <b>Transaction ID:</b>\n` +
               `${txIDLink}\n` +
               `👆 View transaction on blockchain - Verified ✅\n\n` +
               `<i>🎉 Your deposit has been successfully credited to your account!</i>\n` +
               `🚀 You're all set to Print Money 🤑`;

var keyboard = [
  [{ text: "📊 Start Future Combo Bot", url: "https://t.me/FutureComboBot" }],
  [{ text: "💎 FREE VIP ACCESS - JOIN NOW 🚀", url: "https://t.me/+-o0a1X684v5hMzc9" }]
];

Api.sendMessage({
  chat_id: "@FutureCombobot_stats",
  text: alertText,
  parse_mode: "html",
  disable_web_page_preview: true,
  reply_markup: { inline_keyboard: keyboard }
});

// 🎁 Bonus Credit Logic
var targetUserId = user.telegramid;
var active = Bot.getProperty("bonus_active_session_" + targetUserId);
if (active) {
  var type = Bot.getProperty("bonus_type_" + targetUserId);
  var slabs = [];
  if (type === "vip1") {
    slabs = [
      {dep: 30, bonus: 4},
      {dep: 150, bonus: 15},
      {dep: 600, bonus: 72},
      {dep: 1000, bonus: 140},
      {dep: 3000, bonus: 480}
    ];
  } else {
    slabs = [
      {dep: 150, bonus: 15},
      {dep: 600, bonus: 70},
      {dep: 1000, bonus: 130},
      {dep: 3000, bonus: 450},
      {dep: 6000, bonus: 800},
      {dep: 10000, bonus: 1500},
      {dep: 20000, bonus: 3200},
      {dep: 30000, bonus: 4800}
    ];
  }

  var p = 0;
  var exactMatch = false;
  for (var j = 0; j < slabs.length; j++) {
    if (amount == slabs[j].dep) {
      p = slabs[j].bonus / slabs[j].dep;
      exactMatch = true;
      break;
    }
  }
  if (!exactMatch) {
    if (amount < slabs[0].dep) {
      p = slabs[0].bonus / slabs[0].dep;
    } else if (amount >= slabs[slabs.length - 1].dep) {
      p = slabs[slabs.length - 1].bonus / slabs[slabs.length - 1].dep;
    } else {
      for (var i = 1; i < slabs.length; i++) {
        if (amount < slabs[i].dep) {
          var p1 = slabs[i - 1].bonus / slabs[i - 1].dep;
          var p2 = slabs[i].bonus / slabs[i].dep;
          p = (p1 + p2) / 2;
          break;
        }
      }
    }
  }

  var bonus = amount * p;
  if (bonus > 0) {
    Libs.ResourcesLib.userRes("balance").add(bonus);
    var percent = p * 100;
    var percentStr = percent % 1 === 0 ? percent.toFixed(0) : percent.toFixed(2);
    var newBalance = Libs.ResourcesLib.userRes("balance").value().toFixed(2);
    var bonusMsg = "<b>✅ Experience Bonus has been automatically credited! You have unlocked extra funds 💰 Remember, multiple deposits can also get rewards</b>\n" +
                   "📥 This Deposit Amount: " + amount.toFixed(2) + " USDT\n" +
                   "🎁 Bonus Percentage: " + percentStr + "%\n" +
                   "💸 Bonus Received: " + bonus.toFixed(2) + " USDT\n" +
                   "💼 Latest Total Balance: " + newBalance + " USDT";
    Api.sendMessage({ text: bonusMsg, parse_mode: "html" });
    Bot.setProperty("claimed_in_window_" + targetUserId, true, "boolean");
    var totalBonusReceived = Number(Bot.getProperty("total_bonus_received_" + targetUserId) || 0) + bonus;
    Bot.setProperty("total_bonus_received_" + targetUserId, totalBonusReceived, "number");
  }
}

return { content: "OK", code: 200 };

