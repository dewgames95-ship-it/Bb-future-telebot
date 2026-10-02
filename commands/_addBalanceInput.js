/*CMD
  command: /addBalanceInput
  help: 
  need_reply: true
  auto_retry_time: 
  folder: 

  <<ANSWER

  ANSWER

  <<KEYBOARD

  KEYBOARD
  aliases: 
  group: 
CMD*/

// /* command: /addBalanceInput */
var admin = Bot.getProperty("admin");
var users = user.telegramid;
var botLink = "@" + bot.name;

if (users === admin) {
  var txHash = message.trim();
  if (txHash.toLowerCase() === "skip") {
    txHash = null;
  }
  Bot.setProperty("addTxHash", txHash, "string");
  
  var addID = Bot.getProperty("addID");
  var addAmount = Number(Bot.getProperty("addAmount"));
  var action = Bot.getProperty("balanceAction");
  var currency = "USDT";
  
  if (!addID || action !== "balance") {
    Api.sendMessage({ text: "<i>⚠️ Action or user ID not defined. Please start over with /addBalance.</i>", parse_mode: "html" });
    return;
  }
  
  // —— Existing Add-Balance Logic for balance ——
  Libs.ResourcesLib.anotherUserRes("balance", addID).add(addAmount);
  var total = Number(Bot.getProperty("totalDeposits_" + addID) || 0) + addAmount;
  Bot.setProperty("totalDeposits_" + addID, total, "number");

  // —— New Deposit Messages for User ——
  Api.sendMessage({
    chat_id: addID,
    text: "<b>⁉️ Your payment is processing....</b>\n\n" +
          `💸 Amount: <code>${addAmount.toFixed(10)} USDT</code>`,
    parse_mode: "html"
  });

  var firstName = Bot.getProperty("firstName_" + addID) || "User";
  Api.sendMessage({
    chat_id: addID,
    text: "<b>✅ New deposit successful</b>\n\n" +
          `🧑 User: ${firstName}\n` +
          `💸 Amount: <code>${addAmount.toFixed(2)} USDT</code>\n\n` +
          `<b>Share Your Experience With team Get Bonus $$ 👉 <a href="https://t.me/futurecombobot_support">agent Chat</a></b>`,
    parse_mode: "html",
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [{ text: "Check Your Transaction Receipt 👉", url: "https://t.me/futurecombobot_stats" }],
        [{ text: "🔙 Back To Main Menu", callback_data: "/mainMenu" }]
      ]
    }
  });

  // —— Save to Deposit History ——
  var ts = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  var hist = Bot.getProperty("depositHistory_" + addID) || "";
  Bot.setProperty("depositHistory_" + addID, ts + " - Deposited " + addAmount.toFixed(2) + " USDT" + (hist ? "\n" + hist : ""), "string");

  // —— Referral Commission Flow ——
  var refUser = Bot.getProperty("referrer_" + addID);
  if (refUser) {
    let currentReferrer = refUser;
    let level = 1;
    const rates = {1: 0.08, 2: 0.03, 3: 0.01};
    while (currentReferrer && level <= 3) {
      let comm = addAmount * rates[level];

      // Update referrer's resources
      Libs.ResourcesLib.anotherUserRes("refDepositTotal", currentReferrer).add(addAmount);
      Libs.ResourcesLib.anotherUserRes("totalRefCommission", currentReferrer).add(comm);
      Libs.ResourcesLib.anotherUserRes("refCommission", currentReferrer).add(comm);
      Libs.ResourcesLib.anotherUserRes("refL" + level + "Commission", currentReferrer).add(comm);

      // Fetch user details for notification
      let refFirst = Bot.getProperty("firstName_" + addID) || "User";
      let refLast = Bot.getProperty("lastName_" + addID) || "";
      let refUsername = Bot.getProperty("username_" + addID) || "";

      // Notify referrer
      Api.sendMessage({
        chat_id: currentReferrer,
        text: "<b>🎉 Referral Deposit Commission!</b>\n\n" +
              `➕ Level \( {level} Referral ( \){rates[level] * 100}%)\n` +
              `User ID: ${addID}\n` +
              `Deposited: ${addAmount.toFixed(2)} USDT\n` +
              `Your Earnings: ${comm.toFixed(2)} USDT`,
        parse_mode: "html"
      });

      // Update referral data
      const dataKey = "referralData_" + currentReferrer;
      let data = JSON.parse(Bot.getProperty(dataKey) || "{}");
      if (!data[addID]) {
        data[addID] = {
          firstName: refFirst,
          lastName: refLast || "",
          username: refUsername || "",
          totalDeposit: 0,
          totalCommission: 0,
          level: level
        };
      }
      data[addID].totalDeposit += addAmount;
      data[addID].totalCommission += comm;
      Bot.setProperty(dataKey, JSON.stringify(data), "string");

      // Move to next referrer
      currentReferrer = Bot.getProperty("referrer_" + currentReferrer);
      level++;
    }
  }

  // —— Admin and User Alerts ——
  Api.sendMessage({
    text: `<b>💸 Amount</b> <code>\( {addAmount} USDT</code> has been added to user <code> \){addID}</code> by admin.`,
    parse_mode: "html"
  });

  // —— Clean Deposit Alert for @FutureComboBot_Stats (VIP + totals removed) ——
  var first = Bot.getProperty("firstName_" + addID) || "";
  var last = Bot.getProperty("lastName_" + addID) || "";
  var fullName = (first + " " + last).trim() || ("User " + addID);

  var depositAlert =
    "<b>✅ Deposit Confirmed Successfully!</b>\n\n" +
    "👤 User: " + fullName + "\n" +
    "💳 Payment Method: USDT (BEP20)\n" +
    "💸 Deposited Amount: <b>" + addAmount.toFixed(2) + " USDT</b>\n\n";

  if (txHash) {
    depositAlert +=
      "🔗 <b>Transaction ID:</b>\n" +
      "<b><a href=\"https://bscscan.com/tx/" + txHash + "\">" + txHash + "</a></b>\n" +
      "👆 View transaction on blockchain - Verified ✅\n\n";
  }

  depositAlert +=
    "<i>🎉 Your deposit has been successfully credited to your account!</i>\n" +
    "<b>🚀 You're all set to Print Money 🤑</b>";

  var keyboard = [
    [{ text: "📊 Start Future Combo Bot", url: "https://t.me/FutureComboBot" }],
    [{ text: "💎 FREE VIP ACCESS - JOIN NOW🚀", url: "https://t.me/+-o0a1X684v5hMzc9" }]
  ];

  Api.sendMessage({
    chat_id: "@FutureComboBot_Stats",
    text: depositAlert,
    parse_mode: "html",
    reply_markup: { inline_keyboard: keyboard },
    disable_web_page_preview: true
  });
  
  // —— Cleanup ——
  Bot.setProperty("balanceAction", "", "string");
  Bot.setProperty("addID", "", "string");
  Bot.setProperty("addAmount", "", "string");
  Bot.setProperty("addTxHash", "", "string");
  
  // Bonus Credit Logic
  var targetUserId = addID;
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
      if (addAmount == slabs[j].dep) {
        p = slabs[j].bonus / slabs[j].dep;
        exactMatch = true;
        break;
      }
    }
    if (!exactMatch) {
      if (addAmount < slabs[0].dep) {
        p = slabs[0].bonus / slabs[0].dep;
      } else if (addAmount >= slabs[slabs.length - 1].dep) {
        p = slabs[slabs.length - 1].bonus / slabs[slabs.length - 1].dep;
      } else {
        for (var i = 1; i < slabs.length; i++) {
          if (addAmount < slabs[i].dep) {
            var p1 = slabs[i - 1].bonus / slabs[i - 1].dep;
            var p2 = slabs[i].bonus / slabs[i].dep;
            p = (p1 + p2) / 2;
            break;
          }
        }
      }
    }

    var bonus = addAmount * p;
    if (bonus > 0) {
      Libs.ResourcesLib.anotherUserRes("balance", targetUserId).add(bonus);
      var percent = p * 100;
      var percentStr = percent % 1 === 0 ? percent.toFixed(0) : percent.toFixed(2);
      var newBalance = Libs.ResourcesLib.anotherUserRes("balance", targetUserId).value().toFixed(2);
      var bonusMsg = "<b>✅ Bonus auto-credited! You’ve unlocked extra funds 💰</b>\n" +
                     "📥 Deposit Amount: " + addAmount.toFixed(2) + " USDT\n" +
                     "🎁 Bonus % Applied: " + percentStr + "%\n" +
                     "💸 Bonus Received: " + bonus.toFixed(2) + " USDT\n" +
                     "💼 New Balance: " + newBalance + " USDT";
      Api.sendMessage({ chat_id: targetUserId, text: bonusMsg, parse_mode: "html" });
      Bot.setProperty("claimed_in_window_" + targetUserId, true, "boolean");
      var totalBonusReceived = Number(Bot.getProperty("total_bonus_received_" + targetUserId) || 0) + bonus;
      Bot.setProperty("total_bonus_received_" + targetUserId, totalBonusReceived, "number");
    }
  }
  
} else {
  Api.sendMessage({ text: `<i>⚠️ You're not the admin of ${botLink}.</i>`, parse_mode: "html" });
}
