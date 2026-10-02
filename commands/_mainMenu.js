/*CMD
  command: /mainMenu
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

// command. /mainMenu
/*––––––[ Ban Check ]––––––*/
var ban = Bot.getProperty(user.telegramid);
if (ban === "Ban") {
  Api.sendMessage({
    text: "<i>please not try weeksbots server not working in your country u not meet criteria   .</i>",
    parse_mode: "html"
  });
  return;
}

/*––––––[ Maintenance Check ]––––––*/
var maintenanceStatus = Bot.getProperty("maintenanceStatus");
if (maintenanceStatus === "On") {
  Api.sendMessage({
    text: "<i>🛠️ Bot is under maintenance, please come back later.</i>",
    parse_mode: "html"
  });
  return;
}

/*––––––[ Initialize global properties if not set ]––––––*/
if (!Bot.getProperty("initialDayCount")) {
  Bot.setProperty("initialDayCount", 124, "integer");
  Bot.setProperty("initialDate", new Date().toISOString(), "string");
  Bot.setProperty("initialCumulativeIncome", 12000000, "integer");
  Bot.setProperty("initialTime", new Date().toISOString(), "string");
}

/*––––––[ Referral Bonus Logic ]––––––*/
var referCount = User.getProperty("referCount");
if (!referCount) {
  let refUser = Libs.ReferralLib.getAttractedBy();
  if (refUser) {
    Bot.setProperty("referrer_" + user.telegramid, refUser.telegramid, "string");
    User.setProperty("referCount", 1, "integer");
    User.setProperty("referStatus", "valid", "string");

    // Multi-level propagation
    let currentReferrer = refUser.telegramid;
    let lvl = 1;
    const rates = [0, 0.08, 0.03, 0.01];
    while (currentReferrer && lvl <= 3) {
      // Update referrer's referral list
      const refListKey = "referralList_" + currentReferrer;
      let refList = JSON.parse(Bot.getProperty(refListKey) || "[]");
      if (!refList.includes(user.telegramid)) {
        refList.push(user.telegramid);
        Bot.setProperty(refListKey, JSON.stringify(refList), "string");
      }

      // Update referral data with level
      const refDataKey = "referralData_" + currentReferrer;
      let refData = JSON.parse(Bot.getProperty(refDataKey) || "{}");
      if (!refData[user.telegramid]) {
        refData[user.telegramid] = {
          firstName: user.first_name,
          lastName: user.last_name || "",
          username: user.username || "",
          totalDeposit: 0,
          totalCommission: 0,
          level: lvl
        };
      }
      Bot.setProperty(refDataKey, JSON.stringify(refData), "string");

      // Update counts
      Libs.ResourcesLib.anotherUserRes("refL" + lvl + "Count", currentReferrer).add(1);
      Libs.ResourcesLib.anotherUserRes("refTotalCount", currentReferrer).add(1);

      // Notify referrer
      Api.sendMessage({
        chat_id: currentReferrer,
        text: "<b>🎉 New Referral Joined!</b>\n" +
              "<b>➕ Level " + lvl + " Referral (" + (rates[lvl] * 100) + "%)</b>\n" +
              "<i>You will get " + (rates[lvl] * 100) + "% on every deposit for lifetime</i>\n" +
              "<b>User ID:</b> <code>" + user.telegramid + "</code>",
        parse_mode: "html"
      });

      // Move up the chain
      currentReferrer = Bot.getProperty("referrer_" + currentReferrer);
      lvl++;
    }
  }
}

/*––––––[ Fetch and Store miningHistory Globally ]––––––*/
var historyString = User.getProperty("miningHistory");
Bot.setProperty("miningHistory_" + user.telegramid, historyString, "string");

/*––––––[ Calculate current days ]––––––*/
var initialDate = new Date(Bot.getProperty("initialDate"));
var currentDate = new Date();
var timeDiffDays = currentDate - initialDate;
var daysPassed = Math.floor(timeDiffDays / (1000 * 60 * 60 * 24));
var currentDays = Bot.getProperty("initialDayCount") + daysPassed;

/*––––––[ Calculate cumulative income with pseudo-random increases ]––––––*/
var initialTime = new Date(Bot.getProperty("initialTime"));
var timeDiffMin = Math.floor((currentDate - initialTime) / 60000);
var totalIncrease = 0;
for (var i = 1; i <= timeDiffMin; i++) {
  var random = (i * 12345) % 200 + 1;
  totalIncrease += random;
}
var currentCumulativeIncome = Bot.getProperty("initialCumulativeIncome") + totalIncrease;

/*––––––[ Welcome Message ]––––––*/
var userName = user.first_name;
var welcomeText =
  "🚀 Welcome, <b>" + userName + "</b>!\n" +
  "<i>Your Smart Auto-Ai Trading Bot!</i>\n\n" +
  "Trade effortlessly with Predictum signals for precision, " +
  "growth, and real-time updates! 📈✨\n\n" +
  "🤖 Auto-trade & diversify\n" +
  "💡 Smart risk management\n" +
  "📊 Live performance tracking\n" +
  "<b>📚 <a href='https://telegra.ph/Dont-Sleep-on-Profits-Master-the-Bots-Features-Today-07-25'>Bot User Guide</a></b>\n\n" +
  "✅ Minimum Investment: <b>30 USDT</b>\n" +
  "✅ Minimum Deposit/Withdraw: <b>1 USDT</b>\n" +
  "<b>👉 <a href='https://t.me/FutureComboBot_Channel/59'>How To Use Bot Click To watch</a></b>\n\n" +
  "✅ Safe Operations: <b>" + currentDays + " Days</b>\n" +
  "💰 Cumulative Income: <b>" + currentCumulativeIncome.toLocaleString() + " USDT</b>";

/*––––––[ Inline Keyboard Buttons ]––––––*/
var inlineButtons = [
  [
    { text: "📈 Profit (Proof)", url: "https://t.me/futurecombobot_livetrades" },
    { text: "📌 Withdrawal Proof", url: "https://t.me/futurecombobot_stats" }
  ],
  [
    // 💎 Full width FREE VIP ACCESS button
    { text: "💎 FREE VIP ACCESS - JOIN NOW 🚀", url: "https://t.me/+-o0a1X684v5hMzc9" }
  ]
];

/*––––––[ Send Welcome Message with Inline Keyboard ]––––––*/
Api.sendMessage({
  text: welcomeText,
  reply_markup: { inline_keyboard: inlineButtons },
  parse_mode: "html",
  disable_web_page_preview: true
});

/*––––––[ Welcome Bonus Message ]––––––*/
if (!User.getProperty("hasSeenWelcomeMessage")) {
  var welcomeBonusMessage = "<b>🎉 Congrats! You’ve received 10 USDT FREE!</b>\n\n" +
                           "💰 Use it to buy any VIP plan — no conditions.\n" +
                           "💸 Profits are 100% withdrawable.\n\n" +
                           "📲 Tap 💰 My Balance to check your bonus.\n" +
                           "💎 Buy Any Vip Plan To Redeem Bonus";
  Api.sendMessage({
    text: welcomeBonusMessage,
    parse_mode: "html"
  });
  User.setProperty("hasSeenWelcomeMessage", true, "boolean");
}

/*––––––[ Persistent Reply Keyboard ]––––––*/
var keyboard =  
  "💰 My Balance\n" +
  "🏦 Deposit Funds, 🏧 Withdraw Funds\n" +
  "📊 VIP Investment Plans\n" +
  "📈 My Trades, 🤝 Invite & Earn\n" +
  "🎯 Set Wallet, 📞 Support, 📊 Bot Stats";

Bot.sendKeyboard(keyboard, "Select An Option");

/*––––––[ Bonus Reminder Logic ]––––––*/
var miningHistory = [];
if (historyString) {
  try {
    miningHistory = JSON.parse(historyString);
  } catch (e) {
    miningHistory = [];
  }
}

// Start reminders only if no VIP plans and reminders haven't been initiated
if (miningHistory.length === 0 && !User.getProperty("reminderInitiated")) {
  User.setProperty("reminderIndex", 0, "integer");
  Bot.run({
    command: "/sendBonusReminder",
    run_after: 12 * 60 * 60
  });
  User.setProperty("reminderInitiated", true, "boolean");
}

/*––––––[ Track User Activity for /stats24h ]––––––*/
User.setProperty("lastMainMenu_" + user.telegramid, Date.now(), "integer");
User.setProperty("stats24hCount_" + user.telegramid, 0, "integer");
