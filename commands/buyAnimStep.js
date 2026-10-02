/*CMD
  command: buyAnimStep
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

// command: buyAnimStep
var res = options.result;
var chatID, messageID, step, plan, minerCommand;

if (res) {
  chatID    = res.chat.id;
  messageID = res.message_id;
  step      = options.bb_options.step;
  plan      = options.bb_options.plan;
  minerCommand = options.bb_options.minerCommand;
} else {
  chatID    = options.chatID;
  messageID = options.messageID;
  step      = options.step;
  plan      = options.plan;
  minerCommand = options.minerCommand;
}

// Ensure plan is a string for comparison
plan = String(plan);

// 4-step animation frames (10%, 30%, 72%, 100%)
var frames = [
  "<b>⚡ Loading strategy module...</b>\n<i>Activating trading algorithms... [10%]</i>",
  "<b>📡 Connecting to liquidity providers...</b>\n<i>Establishing secure blockchain nodes... [30%]</i>",
  "<b>⚙️ Executing buy order...</b>\n<i>Verifying trade path and gas fee... [72%]</i>",
  "<b>🎉 Investment Completed!</b>\n<i>Daily profit has been successfully credited. [100%]</i>"
];

// Track the last frame to avoid redundant updates
var lastFrame = User.getProperty("lastFrame_" + user.telegramid) || "";

// Show current frame only if it’s different from the last one and step > 0
if (step > 0 && frames[step] !== lastFrame) {
  Api.editMessageText({
    chat_id: chatID,
    message_id: messageID,
    text: frames[step],
    parse_mode: "html"
  });
}
User.setProperty("lastFrame_" + user.telegramid, frames[step], "string");

// Next frame or finalize purchase
if (step < frames.length - 1) {
  Bot.run({
    command: "buyAnimStep",
    options: { chatID, messageID, step: step + 1, plan, minerCommand },
    run_after: 0.03  // Slower animation (increased delay to lower speed by approx. 40% from original 0.02)
  });
} else {
  // Clear last frame after animation completes
  User.setProperty("lastFrame_" + user.telegramid, "", "string");

  // Recompute plan details
  var cost, dailyProfit, totalProfit, expirationDays, planName, maxBuy;
  if (plan === "1") {
    cost = 30; dailyProfit = 1.20; totalProfit = 144.00; expirationDays = 120;
    planName = "VIP 1 – Starter Plan"; maxBuy = 2;
  } else if (plan === "2") {
    cost = 150; dailyProfit = 7.50; totalProfit = 900.00; expirationDays = 120;
    planName = "VIP 2 – Grow Steady"; maxBuy = 2;
  } else if (plan === "3") {
    cost = 600; dailyProfit = 39.00; totalProfit = 4680.00; expirationDays = 120;
    planName = "VIP 3 – High Return"; maxBuy = 3;
  } else if (plan === "4") {
    cost = 3000; dailyProfit = 270.00; totalProfit = 32400.00; expirationDays = 120;
    planName = "VIP 4 – Ultimate Profits"; maxBuy = 3;
  } else if (plan === "5") {
    cost = 8000; dailyProfit = 960.00; totalProfit = 57600.00; expirationDays = 60;
    planName = "VIP 5 – Elite Max Profit"; maxBuy = 2;
  } else {
    cost = 18000; dailyProfit = 2880.00; totalProfit = 86400.00; expirationDays = 30;
    planName = "VIP 6 – Hyperion Wealth"; maxBuy = 1;
  }

  // Deduct cost by preferring Main Balance first, then Profit Balance
  var balance = Libs.ResourcesLib.userRes("balance");
  var minerProfitBalance = Libs.ResourcesLib.userRes("minerProfitBalance");
  
  var fromMain = Math.min(cost, balance.value());
  balance.remove(fromMain);
  var fromProfit = cost - fromMain;
  if (fromProfit > 0) {
    minerProfitBalance.remove(fromProfit);
    Api.sendMessage({
      text: "<b>🔔 " + fromProfit.toFixed(2) + " USDT deducted from Profit Balance for " + planName + ".</b>",
      parse_mode: "html"
    });
  }

  var key = "vip" + plan + "Count";
  var bought = Number(User.getProperty(key) || 0);
  var slot = bought + 1;
  User.setProperty(key, slot, "integer");

  // Handle first-time purchase: combine profit and bonus in main balance
  var isFirstPurchase = !User.getProperty("hasUnlockedBonus");
  if (isFirstPurchase) {
    // Combine profit and bonus for main balance
    balance.add(dailyProfit + 10.00);
    User.setProperty("hasUnlockedBonus", true, "boolean");
    // Send bonus message
    var bonusMessage = "<b>🎉 Congratulations!</b>\n" +
                       "<b>🎁 Bonus Unlocked – 10.00 USDT</b> is now available in your Main Balance and can be used for investing in more VIP plans.\n" +
                       "🟢 <b>Balance Updated:</b> +10.00 USDT added to your account.";
    Api.sendMessage({ text: bonusMessage, parse_mode: "html" });
  } else {
    // Non-first-time purchase: add only profit to main balance
    balance.add(dailyProfit);
  }

  minerProfitBalance.add(dailyProfit);

  // Set initial cycle day for the slot (start at Day 1)
  var profitResource;
  if (plan === "1") profitResource = "miner2Profit";
  else if (plan === "2") profitResource = "miner3Profit";
  else if (plan === "3") profitResource = "miner4Profit";
  else if (plan === "4") profitResource = "miner5Profit";
  else if (plan === "5") profitResource = "miner6Profit";
  else profitResource = "miner7Profit";
  var minerProfit = Libs.ResourcesLib.userRes(profitResource + slot);
  minerProfit.set(1);

  // Send confirmation message (shows only profit, not bonus)
  var buyMessage =
    "<b>✅ " + planName + " Unlocked! 🎉</b>\n\n" +
    "💵 Investment: " + cost.toFixed(2) + " USDT\n" +
    "📈 Daily Profit: " + dailyProfit.toFixed(2) + " USDT\n" +
    "⏳ Duration: " + expirationDays + " Days\n" +
    "💰 Total Earnings: " + totalProfit.toFixed(2) + " USDT\n\n" +
    "👉 Next profit in 24hrs. Withdraw anytime with zero fee! 🥳\n\n" +
    "💡 You can withdraw today’s profit of $" + dailyProfit.toFixed(2) +
    " instantly with zero fee! ⚡\n\n" +
    "Let’s test how the Withdrawal works ✅";
  Api.sendMessage({ text: buyMessage, parse_mode: "html" });

  // Send additional message for VIP3, VIP4, or VIP5
  if (plan === "3" || plan === "4" || plan === "5") {
    var vipMessage = plan === "3" ?
      "<b>🎉 Congratulations on activating VIP3!</b>\n" +
      "Here’s your <b>FREE Futures VIP Signals</b> channel access. Please read all pinned message first!!🚀\n" +
      "📌 Click here to join" :
      plan === "4" ?
      "<b>🎉 Congratulations on activating VIP4!</b>\n" +
      "Here’s your <b>FREE Futures VIP Pro Signals</b> channel access. Please read all pinned message first!!🚀\n" +
      "📌 Click here to join" :
      "<b>🎉 Congratulations on activating VIP5!</b>\n" +
      "Here’s your <b>FREE VIP PRO SIGNALS</b> channel access. Please read all pinned message first!!🚀\n" +
      "📌 Click here to join";
    var vipLink = plan === "3" || plan === "4" ? "https://t.me/+w9OMDlVwHhIzMDEx" : "https://t.me/+u-oijbztrWdjODM1";
    try {
      Api.sendMessage({
        chat_id: chatID,
        text: vipMessage,
        parse_mode: "html",
        reply_markup: {
          inline_keyboard: [
            [{ text: "📌 Click here to join", url: vipLink }]
          ]
        }
      });
    } catch (e) {
      // Log error but don't interrupt the flow
      Bot.log("Error sending VIP signal message: " + e.message);
    }
  }

  // Schedule next profit
  Bot.run({ command: minerCommand, run_after: 86400, options: { slot: slot } });

  // Record mining history
  var record = {
    planName: planName,
    purchaseTimestamp: Date.now() - 86400000,
    dailyProfit: dailyProfit,
    expirationDays: expirationDays
  };
  var history = User.getProperty("miningHistory");
  history = history ? JSON.parse(history) : [];
  history.push(record);
  User.setProperty("miningHistory", JSON.stringify(history), "string");
  Bot.setProperty("miningHistory_" + user.telegramid, JSON.stringify(history), "string");
}
