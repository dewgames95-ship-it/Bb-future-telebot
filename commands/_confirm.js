/*CMD
  command: /confirm
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

// /* command: /confirm */
if (request.data.startsWith("/confirm")) {
  // 1️⃣ Remove inline “Confirm” btn
  var chatID    = request.message.chat.id;
  var messageID = request.message.message_id;
  Api.deleteMessage({ chat_id: chatID, message_id: messageID });

  // 2️⃣ Parse & prep
  var params           = request.data.split(" ");
  var amount           = params[1];
  var requestedAmount  = parseFloat(amount);
  var wallet           = User.getProperty("wallet");
  var autowithStatus   = Bot.getProperty("autowithStatus");
  var withdrawalStatus = Bot.getProperty("withdrawalStatus");
  var apikey = Bot.getProperty("payoutAPI")
  if (!apikey) {
    return Bot.sendMessage("Api key is not set, please set it first")
  }

  // 3️⃣ Get commission tier from miningHistory
  var historyString = User.getProperty("miningHistory") || "[]";
  var history       = [];
  try { history = JSON.parse(historyString); } catch(e){ history = []; }
  var now         = Date.now();
  var activePlans = history
    .filter(r => now - r.purchaseTimestamp < r.expirationDays * 86400000)
    .map(r => r.planName);

  var commissionRate = 0.30;
  if (activePlans.some(r => r.startsWith("VIP 6"))) commissionRate = 0.01;
  else if (activePlans.some(r => r.startsWith("VIP 5"))) commissionRate = 0.05;
  else if (activePlans.some(r => r.startsWith("VIP 4"))) commissionRate = 0.10;
  else if (activePlans.some(r => r.startsWith("VIP 3"))) commissionRate = 0.20;

  var commission = requestedAmount * commissionRate;

  // NEW: Conditional network fee for auto (get history count)
  var withdrawHistory = Bot.getProperty("withdrawalHistory_" + user.telegramid) || [];
  if (!Array.isArray(withdrawHistory)) withdrawHistory = [];
  var withdrawCount = withdrawHistory.length;
  var networkFee = withdrawCount < 2 ? 0 : 0.25;

  var netAmount  = requestedAmount - commission - networkFee;

  // ⚡ Auto‐withdrawal if amount ≤ 1.2 USDT
  if (
    autowithStatus   === "On" &&
    withdrawalStatus === "Off" &&
    requestedAmount  <= 2 &&
    Bot.getProperty("autoWithdrawStopped_" + user.telegramid, {}).status !== "stopped"
  ) {
    // Set pendingWithdrawal_ for auto to ensure proper details in confirm2
    Bot.setProperty("pendingWithdrawal_" + user.telegramid, {
      amount: requestedAmount,
      currency: "USDT",
      wallet: wallet,
      commissionRate: commissionRate,
      commission: commission,
      networkFee: networkFee,
      netAmount: netAmount
    }, "json");

    // Trigger payout callback immediately
    let webhookUrl = Libs.Webhooks.getUrlFor({
      command: "confirm2",
      user_id: user.id
    })
    
    HTTP.post({
      url: "https://api.oxapay.com/v1/payout",
      headers: {
        payout_api_key: apikey
      },
      body: {
        address: wallet,
        currency: "USDT",
        network: "BEP20",
        amount: parseFloat(netAmount.toFixed(4)),
        callback_url: webhookUrl,
      },
      success: "/confirm3 "+amount
    });

    // Record auto withdrawal
    var userId            = user.telegramid;
    var histKey           = "withdrawalHistory_" + userId;
    var withdrawalHistory = Bot.getProperty(histKey, []) || [];
    if (!Array.isArray(withdrawalHistory)) withdrawalHistory = [];
    withdrawalHistory.push({
      amount: requestedAmount.toFixed(2),
      date:   new Date().toLocaleString("en-US", { timeZone: "Asia/kolkata" }),
      wallet: wallet,
      type:   "auto"
    });
    Bot.setProperty(histKey, withdrawalHistory, "json");
    return;
  }

  // ✅ Manual‐withdrawal confirmation (unchanged)
  // 4️⃣ Load pending withdrawal
  var userId     = user.telegramid;
  var pendingKey = "pendingWithdrawal_" + userId;
  var pd         = Bot.getProperty(pendingKey) || {};
  if (!pd.deducted) {
    return Api.sendMessage({
      chat_id: chatID,
      text: "<i>❌ No pending withdrawal found or it's already finalized.</i>",
      parse_mode: "html"
    });
  }

  // 5️⃣ Tally history for stats
  var histKey                = "withdrawalHistory_" + userId;
  var withdrawalHistory      = Bot.getProperty(histKey) || [];
  var manualTotalWithdrawals = 0, autoTotalWithdrawals = 0;
  var manualCount            = 0, autoCount            = 0;
  if (Array.isArray(withdrawalHistory)) {
    withdrawalHistory.forEach(rec => {
      var amtRec = parseFloat(rec.amount) || 0;
      if (rec.type === "manual") { manualTotalWithdrawals += amtRec; manualCount++; }
      else                         { autoTotalWithdrawals   += amtRec; autoCount++;   }
    });
  }
  var totalDeposits = Number(Bot.getProperty("totalDeposits_" + userId) || 0);

  // 6️⃣ Notify the user
  var pctText   = (pd.commissionRate * 100).toFixed(0);
  var userText  =
    "<b>✅ Your withdrawal is processing…estimated time 1 min to 12 hours</b>\n\n" +
    "<b>💸 Requested Amount:</b> " + pd.amount + " USDT\n" +
    "<b>🤖 Bot Commission (" + pctText + "%):</b> " + pd.commission.toFixed(2) + " USDT\n" +
    "<b>💰 Network Fee:</b> " + pd.networkFee.toFixed(2) + " USDT\n" +
    "<b>👉 Amount to Receive:</b> " + pd.netAmount.toFixed(2) + " USDT\n" +
    "<b>🏦 Wallet:</b> <code>" + pd.wallet + "</code>\n\n" +
    "<i>⏳ Please wait while we process your request.</i>";
  Api.sendMessage({ chat_id: chatID, text: userText, parse_mode: "html" });

  // 7️⃣ Build & send admin alert
  var balance       = Libs.ResourcesLib.userRes("balance").value() || 0;
  var minerProfit   = Libs.ResourcesLib.userRes("minerProfitBalance").value() || 0;
  var referralCount = Libs.ReferralLib.getRefCount() || 0;
  var refCommission = Libs.ResourcesLib.userRes("refCommission").value() || 0;

  var vipPlansData = {
    "VIP 1": { dailyProfit: 1.2 },
    "VIP 2": { dailyProfit: 7.5 },
    "VIP 3": { dailyProfit: 39 },
    "VIP 4": { dailyProfit: 270 },
    "VIP 5": { dailyProfit: 960 },
    "VIP 6": { dailyProfit: 2880 }
  };
  var rawHistory = User.getProperty("miningHistory") || "[]";
  var arr        = [];
  try { arr = JSON.parse(rawHistory); } catch(e){ arr = []; }
  var groups     = { "VIP 1":[], "VIP 2":[], "VIP 3":[], "VIP 4":[], "VIP 5":[], "VIP 6":[] };
  arr.forEach(rec => {
    var m = rec.planName.match(/VIP\s*\d+/);
    if (!m) return;
    var key = m[0];
    if (groups[key]) {
      var dayCount     = Math.floor(( now - rec.purchaseTimestamp ) / 86400000) || 1;
      rec.currentDay   = dayCount;
      rec.profitEarned = vipPlansData[key].dailyProfit * dayCount;
      groups[key].push(rec);
    }
  });

  var vipOrder   = ["VIP 1","VIP 2","VIP 3","VIP 4","VIP 5","VIP 6"];
  var vipDetails = "<b>⚡ Total Active VIP Plans:</b>\n\n";
  vipOrder.forEach(plan => {
    var list = groups[plan];
    if (list.length === 0) {
      vipDetails += "<b>🔹 " + plan + ":</b> <i>0 running</i>\n";
    }
    else if (list.length === 1) {
      vipDetails += "<b>🔹 " + plan + ":</b> 1 running <b>(Day " + list[0].currentDay + ")</b> ~ $" + list[0].profitEarned.toFixed(2) + "\n";
    }
    else {
      vipDetails += "<b>🔹 " + plan + ":</b> " + list.length + " running\n";
      list.forEach((r,i) => {
        vipDetails += "    <i>Plan " + (i+1) + " (Day " + r.currentDay + ")</i> ~ $" + r.profitEarned.toFixed(2) + "\n";
      });
    }
  });

  var fullName  = user.first_name + (user.last_name ? " " + user.last_name : "");
  var username  = user.username ? "@" + user.username : "";
  var adminButtons = [
    [
      { text: "💵 Pay Manual",    callback_data: "/pay_manual "   + userId + " " + pd.amount },
      { text: "❌ Cancel/Refund", callback_data: "/manual_cancel " + userId + " " + pd.amount }
    ]
  ];
  var autoWithdrawStatus = Bot.getProperty("autoWithdrawStopped_" + userId, {}).status === "stopped" ? "\n<b>🛑 Auto Withdrawals:</b> Stopped" : "";
  var adminMsg =
    "<b>🚨 New Withdrawal Request</b>\n\n" +
    "<b>Username:</b> " + username + "\n" +
    "<b>👤 User:</b> " + fullName + "\n" +
    "<b>User id:</b> <code>" + userId + "</code>\n\n" +
    "<b>💰 Requested Amount:</b> " + pd.amount + " USDT\n" +
    "<b>🤖 Bot Commission (" + pctText + "%):</b> " + pd.commission.toFixed(2) + " USDT\n" +
    "<b>👉 Amount to Pay:</b> " + pd.netAmount.toFixed(2) + " USDT\n" +
    "<b>🏦 Wallet:</b> <code>" + pd.wallet + "</code>\n\n" +
    "<b>💸 Total Miner Profit:</b> " + minerProfit.toFixed(2) + " USDT\n" +
    "<b>💼 Total Balance:</b> " + balance.toFixed(2) + " USDT\n" +
    "<b>🧑‍🤝‍🧑 Total Referrals:</b> " + referralCount + "\n" +
    "<b>🎁 Total Referral Commissions Earned:</b> " + refCommission.toFixed(2) + " USDT\n\n" +
    vipDetails + "\n" +
    "<b>💼 Manual Withdrawals:</b> " + manualTotalWithdrawals.toFixed(2) + " USDT\n" +
    "<b>🤖 Auto Withdrawals:</b> "   + autoTotalWithdrawals.toFixed(2) + " USDT\n" +
    "<b>📊 Times Auto:</b> "        + autoCount + "\n" +
    "<b>📊 Times Manual:</b> "      + manualCount + "\n" +
    "<b>💳 Total Deposits:</b> "    + totalDeposits.toFixed(2) + " USDT" + autoWithdrawStatus;

  Api.sendMessage({
    chat_id: Bot.getProperty("admin"),
    text: adminMsg,
    parse_mode: "html",
    reply_markup: { inline_keyboard: adminButtons }
  });
}
