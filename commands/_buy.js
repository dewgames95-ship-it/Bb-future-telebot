/*CMD
  command: /buy
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

// command: /buy
if (request.data) {
  // No deletion - we'll edit the message instead
  var chatID    = request.message.chat_id;
  var messageID = request.message.message_id;
}

// 🚫 Ban check
var ban = Bot.getProperty(user.telegramid);
if (ban === "Ban") {
  Api.editMessageText({
    chat_id: chatID,
    message_id: messageID,
    text:
      "<b>🚫 You are banned from using this bot.</b>\n" +
      "<b>Please contact support for assistance.</b>",
    parse_mode: "html"
  });
  return;
}

// 🛠️ Maintenance check
var maintenanceStatus = Bot.getProperty("maintenanceStatus");
if (maintenanceStatus === "On") {
  Api.editMessageText({
    chat_id: chatID,
    message_id: messageID,
    text:
      "<b>🛠️ The bot is currently under maintenance.</b>\n" +
      "<b>Please check back later!</b>",
    parse_mode: "html"
  });
  return;
}

// 1️⃣ Determine plan details & max-buy
var plan          = params.toString().trim();
var cost, dailyProfit, totalProfit, expirationDays, planName, maxBuy;

if (plan === "1") {
  cost = 30;      dailyProfit = 1.20;   totalProfit = 144.00; expirationDays = 120;
  planName = "VIP 1 – Starter Plan";   maxBuy = 2;
} else if (plan === "2") {
  cost = 150;     dailyProfit = 7.50;   totalProfit = 900.00; expirationDays = 120;
  planName = "VIP 2 – Grow Steady";    maxBuy = 2;
} else if (plan === "3") {
  cost = 600;     dailyProfit = 39.00;  totalProfit = 4680.00;expirationDays = 120;
  planName = "VIP 3 – High Return";    maxBuy = 3;
} else if (plan === "4") {
  cost = 3000;    dailyProfit = 270.00; totalProfit = 32400.00;expirationDays = 120;
  planName = "VIP 4 – Ultimate Profits";maxBuy = 3;
} else if (plan === "5") {
  cost = 8000;    dailyProfit = 960.00; totalProfit = 57600.00;expirationDays = 60;
  planName = "VIP 5 – Elite Max Profit";maxBuy = 2;
} else if (plan === "6") {
  cost = 18000;   dailyProfit = 2880.00;totalProfit = 86400.00;expirationDays = 30;
  planName = "VIP 6 – Hyperion Wealth";maxBuy = 1;
} else {
  Api.editMessageText({
    chat_id: chatID,
    message_id: messageID,
    text:
      "<b>⚠️ Invalid selection.</b>\n" +
      "<b>Please choose plan '1' through '6'.</b>",
    parse_mode: "html"
  });
  return;
}

// 2️⃣ Purchase-limit check BEFORE animation
var countKey = "vip" + plan + "Count";
var bought   = Number(User.getProperty(countKey) || 0);
if (bought >= maxBuy) {
  Api.editMessageText({
    chat_id: chatID,
    message_id: messageID,
    text:
      `<b>❌ Purchase limit reached for ${planName}.</b>\n` +
      `<b>Max purchases: ${maxBuy}.</b>\n` +
      `💡 Try a different plan!`,
    parse_mode: "html"
  });
  return;
}

// 3️⃣ Balance check BEFORE animation
var balance            = Libs.ResourcesLib.userRes("balance");
var minerProfitBalance = Libs.ResourcesLib.userRes("minerProfitBalance");
if (balance.value() + minerProfitBalance.value() < cost) {
  Api.editMessageText({
    chat_id: chatID,
    message_id: messageID,
    text:
      "<b>❌ Insufficient balance.</b>\n" +
      "Please deposit more USDT.\n\n" +
      "<b>💰 Current Balance: " + balance.value().toFixed(4) + " USDT</b>",
    parse_mode: "html",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🏦 Deposit Funds", callback_data: "🏦 Deposit Funds" }]
      ]
    }
  });
  return;
}

// 4-step animation frames (10%, 30%, 72%, 100%)
var frames = [
  "<b>⚡ Loading strategy module...</b>\n<i>Activating trading algorithms... [10%]</i>",
  "<b>📡 Connecting to liquidity providers...</b>\n<i>Establishing secure blockchain nodes... [30%]</i>",
  "<b>⚙️ Executing buy order...</b>\n<i>Verifying trade path and gas fee... [72%]</i>",
  "<b>🎉 Investment Completed!</b>\n<i>Daily profit has been successfully credited. [100%]</i>"
];

// Determine miner command based on existing plans
var minerCommand = "/miner" + plan;
if (plan !== "6") {
  var historyString = User.getProperty("miningHistory");
  var miningHistory = [];
  if (historyString) {
    try {
      miningHistory = JSON.parse(historyString);
    } catch (e) {
      miningHistory = [];
    }
  }
  var vipCount = miningHistory.filter(function(rec) { return rec.planName.includes("VIP " + plan); }).length;
  if (vipCount === 0) {
    minerCommand = "/miner" + plan;
  } else if (vipCount === 1) {
    minerCommand = "/miner" + plan + plan;
  } else if (vipCount === 2 && (plan === "3" || plan === "4")) {
    minerCommand = "/miner" + plan + plan + plan;
  }
} else {
  minerCommand = "/miner7";
}

// Edit the original message with the first frame and remove buttons
Api.editMessageText({
  chat_id: chatID,
  message_id: messageID,
  text: frames[0],
  parse_mode: "html",
  reply_markup: { inline_keyboard: [] }
});

// Set last frame for consistency
User.setProperty("lastFrame_" + user.telegramid, frames[0], "string");

// Start sequencer from step 1
Bot.run({
  command: "buyAnimStep",
  options: { chatID: chatID, messageID: messageID, step: 1, plan: plan, minerCommand: minerCommand },
  run_after: 0.03  // Slower animation (increased delay to lower speed by approx. 40% from original 0.02)
});
