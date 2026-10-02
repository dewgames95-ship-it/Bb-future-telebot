/*CMD
  command: /stats24h
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

// /* command: /stats24h */
function generateRandomStats() {
  var totalTrades = Math.floor(Math.random() * (1575 - 747 + 1)) + 747;
  var profitableTradesPercentage = 0.8 + Math.random() * 0.15; // 80% to 95%
  var profitableTrades = Math.floor(totalTrades * profitableTradesPercentage);
  var losses = totalTrades - profitableTrades;
  var accuracy = ((profitableTrades / totalTrades) * 100).toFixed(1) + "%";
  var totalDeposits = Math.floor(Math.random() * (276898 - 70756 + 1)) + 70756;
  var totalWithdrawals = Math.floor(Math.random() * (474978 - 60065 + 1)) + 60065;
  var totalProfitMade = Math.floor(Math.random() * (575856 - 143765 + 1)) + 143765;
  var commissionRate = (10 + Math.random() * 15).toFixed(1); // 10% to 25%
  var botProfitShare = Math.floor(totalWithdrawals * (commissionRate / 100));
  return {
    totalTrades: totalTrades,
    profitableTrades: profitableTrades,
    losses: losses,
    accuracy: accuracy,
    totalDeposits: totalDeposits,
    totalWithdrawals: totalWithdrawals,
    totalProfitMade: totalProfitMade,
    commissionRate: commissionRate,
    botProfitShare: botProfitShare
  };
}

// Admin IDs
var admin1 = 6467105094;
var admin2 = 7377411824;
var userID = user.telegramid;
var isAdmin = (userID === admin1 || userID === admin2);

// Check if a timer is already running
var nextRunTime = Bot.getProperty("nextStats24hRun", 0);
var currentTime = Date.now() / 1000; // Current time in seconds

if (isAdmin) { // Manual admin trigger
  if (currentTime >= nextRunTime) {
    // Admin triggered: Generate stats and send immediately
    var stats = generateRandomStats();
    Bot.setProperty("currentStats24h", JSON.stringify(stats), "string"); // Store stats for consistency
    
    var message = "<b>🚀 24H Bot Performance Recap</b>\n\n" +
      "📊 <b>Trading Summary:</b>\n" +
      "✅ Total Trades: <b>" + stats.totalTrades.toLocaleString() + "</b>\n" +
      "💹 Profitable Trades: <b>" + stats.profitableTrades.toLocaleString() + "</b>\n" +
      "📉 Losses: <b>" + stats.losses.toLocaleString() + "</b>\n" +
      "🎯 Accuracy: <b>" + stats.accuracy + "</b>\n\n" +
      "💰 <b>Financial Activity last 24h:</b>\n" +
      "📨 Total Deposits: <b>$" + stats.totalDeposits.toLocaleString() + "</b>\n" +
      "💸 Total Withdrawals: <b>$" + stats.totalWithdrawals.toLocaleString() + "</b>\n\n" +
      "💰 Total Profit Made: <b>$" + stats.totalProfitMade.toLocaleString() + "</b>\n" +
      "🔸 Bot profit share: <b>$" + stats.botProfitShare.toLocaleString() + "</b>\n" +
      "📊 Average Commission Rate: <b>" + stats.commissionRate + "%</b>\n\n" +
      "<b>⚙️ How Does It Work?</b>\n" +
      "The bot charges a <b>5%–30%</b> commission on profitable trades depending on your VIP level.\n" +
      "<b>Higher VIP = Lower Commission + Higher Daily Return</b>\n\n" +
      "Click /guide to learn How To use";

    var inlineKeyboard = {
      inline_keyboard: [
        [{ text: "👥 Join Public Group Chat", url: "https://t.me/+oSSBQ9HNkodkM2Q1" }],
        [{ text: "📊 Watch Live Payouts Of Users", url: "https://t.me/+NYvhWa05TSpmYmZl" }]
      ]
    };

    // Send to all users in Broadcast list
    var broadcast = Bot.getProperty("Broadcast") || [];
    for (var i = 0; i < broadcast.length; i++) {
      var userId = broadcast[i];
      var banStatus = Bot.getProperty(userId);
      if (banStatus !== "Ban") {
        Api.sendPhoto({
          chat_id: userId,
          photo: "https://ibb.co/p8ygpgP",
          caption: message,
          parse_mode: "html",
          reply_markup: inlineKeyboard
        });
      }
    }

    // Schedule next run in 24 hours
    var runAfter = 24 * 60 * 60; // 24 hours in seconds
    Bot.setProperty("nextStats24hRun", currentTime + runAfter, "integer");
    Bot.run({
      command: "/stats24h",
      run_after: runAfter
    });

    Api.sendMessage({
      text: "✅ Stats broadcast sent to all users. Next run scheduled in 24 hours.",
      chat_id: userID
    });
  } else {
    // Timer already running, show message only for manual trigger
    var timeLeft = nextRunTime - currentTime;
    var hours = Math.floor(timeLeft / 3600);
    var minutes = Math.floor((timeLeft % 3600) / 60);
    var seconds = Math.floor(timeLeft % 60);
    Api.sendMessage({
      text: "⏰ Stats broadcast is already scheduled. Next run in " + hours + "h " + minutes + "m " + seconds + "s.",
      chat_id: userID
    });
  }
} else if (!isAdmin) { // Scheduled run
  if (currentTime < nextRunTime) return; // Skip if schedule hasn't expired
  // Use stored stats for scheduled runs
  var storedStats = Bot.getProperty("currentStats24h");
  if (!storedStats) return; // No stats available yet
  var stats = JSON.parse(storedStats);

  var message = "<b>🚀 24H Bot Performance Recap</b>\n\n" +
    "📊 <b>Trading Summary:</b>\n" +
    "✅ Total Trades: <b>" + stats.totalTrades.toLocaleString() + "</b>\n" +
    "💹 Profitable Trades: <b>" + stats.profitableTrades.toLocaleString() + "</b>\n" +
    "📉 Losses: <b>" + stats.losses.toLocaleString() + "</b>\n" +
    "🎯 Accuracy: <b>" + stats.accuracy + "</b>\n\n" +
    "💰 <b>Financial Activity last 24h:</b>\n" +
    "📨 Total Deposits: <b>$" + stats.totalDeposits.toLocaleString() + "</b>\n" +
    "💸 Total Withdrawals: <b>$" + stats.totalWithdrawals.toLocaleString() + "</b>\n\n" +
    "💰 Total Profit Made: <b>$" + stats.totalProfitMade.toLocaleString() + "</b>\n" +
    "🔸 Bot profit share: <b>$" + stats.botProfitShare.toLocaleString() + "</b>\n" +
    "📊 Average Commission Rate: <b>" + stats.commissionRate + "%</b>\n\n" +
    "<b>⚙️ How Does It Work?</b>\n" +
    "The bot charges a <b>5%–30%</b> commission on profitable trades depending on your VIP level.\n" +
    "<b>Higher VIP = Lower Commission + Higher Daily Return</b>\n\n" +
    "Click /guide to learn How To use";

  var inlineKeyboard = {
    inline_keyboard: [
      [{ text: "👥 Join Public Group Chat", url: "https://t.me/+oSSBQ9HNkodkM2Q1" }],
      [{ text: "📊 Watch Live Payouts Of Users", url: "https://t.me/+NYvhWa05TSpmYmZl" }]
    ]
  };

  // Send to eligible users
  var broadcast = Bot.getProperty("Broadcast") || [];
  for (var i = 0; i < broadcast.length; i++) {
    var userId = broadcast[i];
    var banStatus = Bot.getProperty(userId);
    if (banStatus === "Ban") continue;

    var lastMainMenu = User.getProperty("lastMainMenu_" + userId, 0);
    var messageCount = User.getProperty("stats24hCount_" + userId, 0);
    var now = Date.now();
    var threeDays = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

    // Check if user is active and hasn't exceeded message limit
    if ((now - lastMainMenu <= threeDays || lastMainMenu === 0) && messageCount < 3) {
      Api.sendPhoto({
        chat_id: userId,
        photo: "https://ibb.co/p8ygpgP",
        caption: message,
        parse_mode: "html",
        reply_markup: inlineKeyboard
      });
      User.setProperty("stats24hCount_" + userId, messageCount + 1, "integer");
    }
  }

  // Schedule next run
  var runAfter = 24 * 60 * 60; // 24 hours in seconds
  Bot.setProperty("nextStats24hRun", currentTime + runAfter, "integer");
  Bot.run({
    command: "/stats24h",
    run_after: runAfter
  });
} else {
  // Fallback for unexpected cases
  Api.sendMessage({
    text: "⚠️ Error: Unable to process /stats24h command. Please try again or contact support.",
    chat_id: userID
  });
}
