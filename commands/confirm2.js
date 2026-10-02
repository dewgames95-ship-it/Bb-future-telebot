/*CMD
  command: confirm2
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

//command: confirm2
if (!content) {
    return;
}

var result;
try {
    result = JSON.parse(content);
} catch (e) {
    return; // invalid JSON
}

if (result.status === "Confirmed") {
    // Load pending data
    var rawPd = Bot.getProperty("pendingWithdrawal_" + user.telegramid);

    // 🛑 BUG FIX: Prevent Duplicate Processing (Webhook Retries) 🛑
    // If the pending withdrawal flag is already cleared, ignore this duplicate request.
    if (!rawPd || rawPd === "") {
        WebApp.render({ content: "ok" });
        return;
    }

    var tx_hash = result.tx_hash || "";
    // Double-check with tx_hash to ensure no identical transaction processes twice.
    if (tx_hash) {
        if (Bot.getProperty("processedTx_" + tx_hash)) {
            WebApp.render({ content: "ok" });
            return;
        }
        Bot.setProperty("processedTx_" + tx_hash, true, "boolean");
    }
    // 🛑 END BUG FIX 🛑

    var pd = {};
    if (typeof rawPd === "string") {
        try { pd = JSON.parse(rawPd); } catch(e) { pd = {}; }
    } else if (typeof rawPd === "object" && rawPd) {
        pd = rawPd;
    }

    // Merge with result from content
    var requested   = parseFloat(pd.amount) || parseFloat(result.amount) || 0;
    var currency    = result.currency || pd.currency || "USDT";
    var commissionR = parseFloat(pd.commissionRate) || 0.30;
    var commission  = pd.commission || (requested * commissionR);
    var networkFee  = pd.networkFee || 0.25;  // NEW: Use stored conditional networkFee
    var received    = pd.netAmount || (requested - commission - networkFee);
    var walletAddr  = result.address || pd.wallet || User.getProperty("wallet");

    // Update global stats
    var totalWithd = Libs.ResourcesLib.anotherChatRes("totalWithdrawn", "global");
    totalWithd.add(requested);

    // Load & update history
    var histKey = "withdrawalHistory_" + user.telegramid;
    var history = Bot.getProperty(histKey) || [];
    if (!Array.isArray(history)) history = [];

    // Only log entries with 30% commission
    if (commissionR === 0.30) {
        var last = history[history.length - 1] || {};
        if (
            !( last.type   === "auto" &&
               parseFloat(last.amount) === parseFloat(requested.toFixed(2)) &&  // NEW: Check against requested
               last.wallet === walletAddr )
        ) {
            history.push({
                amount: requested.toFixed(2),  // NEW: Use requested amount
                date:   new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
                wallet: walletAddr,
                type:   "auto"
            });
            Bot.setProperty(histKey, history, "json");
        }
    }

    // Clear pending withdrawal flag
    Bot.setProperty("pendingWithdrawal_" + user.telegramid, "", "string");

    // Notify the user
    Api.sendMessage({
        text: "<b>✅ Withdrawal Successful!</b>\n\n" +
              "Requested: <code>" + requested.toFixed(2) + " " + currency + "</code>\n" +
              "🤖 Commission (" + (commissionR * 100).toFixed(0) + "%): <code>" + commission.toFixed(2) + " " + currency + "</code>\n" +
              "💸 Network Fee: <code>" + networkFee.toFixed(2) + " " + currency + "</code>\n" +  // NEW: Show actual networkFee (0.00 if free, no strike)
              "👉 Received: <code>" + received.toFixed(2) + " " + currency + "</code>\n" +
              "🏦 Wallet: <code>" + walletAddr + "</code>\n" +
              "<b>Transaction ID:</b> <a href=\"https://bscscan.com/tx/" + tx_hash + "\"><b>" + tx_hash + "</b></a>\n\n" +
              `<b>Share Your Experience Get Bonus $$ 👉 <a href="https://t.me/futurecombobot_support">agent Chat</a></b>`,
        parse_mode: "html",
        disable_web_page_preview: true,
        reply_markup: {
            inline_keyboard: [
                [{ text: "Check Your Transaction Receipt 👉", url: "https://t.me/futurecombobot_stats" }],
                [{ text: "🔙 Back To Main Menu", callback_data: "/mainMenu" }]
            ]
        }
    });

    // Gather stats for admin alerts
    var minerProfit = Libs.ResourcesLib.userRes("minerProfitBalance").value() || 0;
    var totalBal    = Libs.ResourcesLib.userRes("balance").value()          || 0;
    var refCount    = Libs.ReferralLib.getRefCount()                       || 0;
    var refCommRes  = Libs.ResourcesLib.userRes("refCommission");
    if (refCommRes.value() == null) refCommRes.set(0);
    var refComm     = refCommRes.value();

    var autoCount = 0, autoSum = 0, manCount = 0, manSum = 0;
    history.forEach(function(r) {
        var a = parseFloat(r.amount) || 0;
        if (r.type === "auto") { autoCount++; autoSum += a; }
        else                    { manCount++; manSum += a; }
    });
    var totalDeps = Number(Bot.getProperty("totalDeposits_" + user.telegramid) || 0);

    // Compute VIP plan details
    var histStr = User.getProperty("miningHistory") || "[]";
    var mHist   = [];
    try { mHist = JSON.parse(histStr); } catch(e){ mHist = []; }

    var now    = Date.now();
    var groups = { "VIP 1":[], "VIP 2":[], "VIP 3":[], "VIP 4":[], "VIP 5":[], "VIP 6":[] };
    mHist.forEach(function(r) {
        var match   = r.planName.match(/VIP\s*\d+/) || [];
        var planKey = match[0] || "";
        var days    = Math.floor((now - r.purchaseTimestamp) / 86400000);
        if (days < 1) days = 1;
        if (days > r.expirationDays) days = r.expirationDays;
        var dailyProfit = parseFloat(r.dailyProfit) || 0;
        var profit  = dailyProfit * days;
        if (groups[planKey]) groups[planKey].push({ days: days, profit: profit });
    });

    // Send admin & stats-channel alerts (enhanced VIP plans)
    var fullName       = user.first_name + (user.last_name ? " " + user.last_name : "");
    var usernameHandle = user.username ? "@" + user.username : "";
    var alertMsg =
        "<b> Auto 🤖 Withdrawal Successful ✅</b>\n\n" +
        "<b>Username:</b> " + usernameHandle + "\n" +
        "<b>👤 User:</b> <a href=\"tg://user?id=" + user.telegramid + "\">" + fullName + "</a>\n" +
        "<b>User id:</b> <code>" + user.telegramid + "</code>\n\n" +
        "<b>💰 Requested Amount:</b> " + requested.toFixed(2) + " USDT\n" +
        "<b>🤖 Commission (" + (commissionR * 100).toFixed(0) + "%):</b> " + commission.toFixed(2) + " USDT\n" +
        "<b>💸 Network Fee:</b> " + networkFee.toFixed(2) + " USDT\n" +
        "<b>👉 Received:</b> " + received.toFixed(2) + " USDT\n" +
        "<b>🏦 Wallet:</b> <code>" + walletAddr + "</code>\n\n" +
        "<b>💸 Total Profit Remaining:</b> " + minerProfit.toFixed(2) + " USDT\n" +
        "<b>💼 Total Balance:</b> " + totalBal.toFixed(2) + " USDT\n" +
        "<b>🧑‍🤝‍🧑 Total Refs:</b> " + refCount + "\n" +
        "<b>🎁 Ref Commissions:</b> " + refComm.toFixed(2) + " USDT\n\n" +
        "<b>⚡ Total Active VIP Plans:</b>\n\n";

    var vipOrder = ["VIP 1", "VIP 2", "VIP 3", "VIP 4", "VIP 5", "VIP 6"];
    vipOrder.forEach(plan => {
        var list = groups[plan];
        if (list.length === 0) {
            alertMsg += "<b>🔹 " + plan + ":</b> <i>0 running</i>\n";
        } else if (list.length === 1) {
            var r = list[0];
            alertMsg += "<b>🔹 " + plan + ":</b> <i>1 running</i> <b>(Day " + r.days + ")</b> ~ $" + r.profit.toFixed(2) + "\n";
        } else {
            alertMsg += "<b>🔹 " + plan + ":</b> <i>" + list.length + " running</i>\n";
            list.forEach((r, i) => {
                alertMsg += "    Plan " + (i + 1) + " <b>(Day " + r.days + ")</b> ~ $" + r.profit.toFixed(2) + "\n";
            });
        }
    });

    alertMsg += "\n" +
        "<b>💼 Manual Withdrawals:</b> " + manSum.toFixed(2) + " USDT\n" +
        "<b>🤖 Auto Withdrawals:</b> "   + autoSum.toFixed(2) + " USDT\n" +
        "<b>📊 Times Auto:</b> "         + autoCount + "\n" +
        "<b>📊 Times Manual:</b> "       + manCount + "\n" +
        "<b>💳 Total Deposits:</b> "     + totalDeps.toFixed(2) + " USDT";

    var adminChat = Bot.getProperty("admin");
    var statsCh   = "@combobotalert";
    try { Api.sendMessage({ chat_id: adminChat, text: alertMsg, parse_mode: "html" }); } catch(e){}
    try { Api.sendMessage({ chat_id: statsCh,   text: alertMsg, parse_mode: "html" }); } catch(e){}

    // FutureComboBot_Stats alert
    var firstName = user.first_name || "";
    var lastName  = user.last_name  || "";
    var fullUser  = (firstName + " " + lastName).trim() || ("User " + user.telegramid);

    // Calculate total withdrawn (manual + auto)
    var totalWithdrawn = (manSum + autoSum).toFixed(2);

    // Build detailed VIP plans section for stats alert (Kept in memory for strict compliance)
    var vipDetailStats = "<b>⚡ Active VIP Plans:</b>\n\n";
    vipOrder.forEach(plan => {
        var list = groups[plan];
        if (list.length === 0) {
            vipDetailStats += "<b>🔹 " + plan + ":</b> <i>0 running</i>\n";
        } else if (list.length === 1) {
            var r = list[0];
            vipDetailStats += "<b>🔹 " + plan + ":</b> 1 running <b>(Day " + r.days + ")</b> ~ $" + r.profit.toFixed(2) + "\n";
        } else {
            vipDetailStats += "<b>🔹 " + plan + ":</b> " + list.length + " running\n";
            list.forEach((r, i) => {
                vipDetailStats += "    <i>Plan " + (i + 1) + "</i> <b>(Day " + r.days + ")</b> ~ $" + r.profit.toFixed(2) + "\n";
            });
        }
    });

    // Compose detailed alert for @FutureComboBot_Stats with customized format
    var comboText =
        "✅ <b>Withdrawal Completed Successfully!</b>\n\n" +
        "👤 User: " + fullUser + "\n" +
        "💳 Payment Method: USDT (BEP20)\n" +
        "💸 Withdrawn Amount: <b>" + received.toFixed(2) + " USDT</b>\n\n" +
        "🔗 Transaction ID:\n" +
        "<a href=\"https://bscscan.com/tx/" + tx_hash + "\"><b>" + tx_hash + "</b></a>\n" +
        "<i>👆 View transaction on blockchain - Verified ✅</i>\n\n" +
        "<i>🎉 Your withdrawal has been successfully processed!</i>\n" +
        "<b>🚀 Your funds are on the way! 💸</b>";

    var comboButtons = [
        [{ text: "📊 Start Future Combo Bot", url: "https://t.me/FutureCombobot" }],
        [{ text: "💎FREE VIP ACCESS - JOIN NOW🚀", url: "https://t.me/+-o0a1X684v5hMzc9" }]
    ];

    Api.sendMessage({
        chat_id: "@futurecombobot_stats",
        text: comboText,
        parse_mode: "html",
        disable_web_page_preview: true,
        reply_markup: { inline_keyboard: comboButtons }
    });

    // Increment user withdrawal count since last bonus, trigger bonusalert if conditions met
    var countKey = "withdraw_count_since_last_bonus_" + user.telegramid;
    var count = Number(Bot.getProperty(countKey, 0)) + 1;
    Bot.setProperty(countKey, count, "integer");

    var active = Bot.getProperty("bonus_active_session_" + user.telegramid, false);
    if ((count === 1 || count === 3) && !active) {
        Bot.run({
            command: "/bonusalert",
            options: { userId: user.telegramid }
        });
    }

    // Add to global recent withdrawals
    var recentWithdrawals = Bot.getProperty("recentWithdrawals") ? JSON.parse(Bot.getProperty("recentWithdrawals")) : [];
    recentWithdrawals.push({
      userId: user.telegramid.toString(),
      amount: requested.toFixed(1),
      timestamp: Date.now()
    });
    recentWithdrawals = recentWithdrawals.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
    Bot.setProperty("recentWithdrawals", JSON.stringify(recentWithdrawals), "string");
}

WebApp.render({
    content: "ok"
})

