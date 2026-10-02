/*CMD
  command: /depositHistory
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

// /* command: /depositHistory */
var ban = Bot.getProperty(user.telegramid);
if (ban === "Ban") {
  return Api.sendMessage({
    text: "<i>🚫 You're banned.</i>",
    parse_mode: "html"
  });
}

var maintenanceStatus = Bot.getProperty("maintenanceStatus");
if (maintenanceStatus === "On") {
  return Api.sendMessage({
    text: "<i>🛠️ Bot is under maintenance, please come back after some time.</i>",
    parse_mode: "html"
  });
}

// ── UI BUILDING ──

// 1️⃣ Load raw history from both user-specific and bot-specific properties and merge
var userHist = User.getProperty("depositHistory") || "";
var botHist = Bot.getProperty("depositHistory_" + user.telegramid) || "";
var raw = userHist + (userHist && botHist ? "\n" : "") + botHist;
var deposits = [];

// 2️⃣ Parse history lines: "5/1/2025, 2:26:45 PM - Deposited 1.00 USDT"
if (raw.trim() !== "") {
  raw.trim().split("\n").forEach(function(line) {
    line = line.trim();
    if (line) {
      var parts = line.split(" - ");
      if (parts.length === 2) {
        var dateStr = parts[0].trim();
        var depositStr = parts[1].trim();
        var match = depositStr.match(/Deposited\s+([\d.]+)\s+USDT/i);
        if (match) {
          var amt = parseFloat(match[1]) || 0;
          deposits.push({ date: dateStr, amount: amt });
        }
      }
    }
  });
}

// 3️⃣ Build header
var text = "<b>➕ Your Deposit History</b>\n";
text += "───────────────\n";

if (!deposits.length) {
  text += "\nNo deposit history available.\n";
} else {
  var totalCount = deposits.length;
  var totalAmount = 0;

  // 4️⃣ Format each entry
  deposits.forEach(function(d) {
    var formatted = "Invalid date";
    var dateParts = d.date.split(", ");
    if (dateParts.length === 2) {
      var datePart = dateParts[0];
      var timePart = dateParts[1];
      var dateComponents = datePart.split("/");
      if (dateComponents.length === 3) {
        var monthNum = parseInt(dateComponents[0], 10);
        var day = parseInt(dateComponents[1], 10);
        var year = parseInt(dateComponents[2], 10);
        var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        if (monthNum >= 1 && monthNum <= 12) {
          var mon = months[monthNum - 1];
          var dayStr = ("0" + day).slice(-2);
          var timeComponents = timePart.split(" ");
          if (timeComponents.length === 2) {
            var time = timeComponents[0];
            var ampm = timeComponents[1];
            var timeParts = time.split(":");
            if (timeParts.length >= 2) {
              var hours = parseInt(timeParts[0], 10);
              var minutes = parseInt(timeParts[1], 10);
              formatted = dayStr + " " + mon + " " + year + " – " + hours + ":" + ("0" + minutes).slice(-2) + " " + ampm;
            }
          }
        }
      }
    }

    var amt = parseFloat(d.amount) || 0;
    totalAmount += amt;

    text += "\n📅 " + formatted + "\n";
    text += "💸 Amount: <b>" + amt.toFixed(2) + " USDT</b>\n";
  });

  // 5️⃣ Footer totals
  text += "\n───────────────\n";
  text += "🔁 Total Deposits: " + totalCount + "\n";
  text += "📊 Total Amount: <b>" + totalAmount.toFixed(2) + " USDT</b>";
  var totalBonus = Number(Bot.getProperty("total_bonus_received_" + user.telegramid) || 0).toFixed(2);
  text += "\n🎁 Total Bonus Received: " + totalBonus + " USDT";
}

// 6️⃣ Back button
var button = [
  [{ text: "🔙 Back", callback_data: "/close_minning" }]
];

if (request.data) {
  Api.editMessageText({
    text: text,
    parse_mode: "html",
    reply_markup: { inline_keyboard: button },
    message_id: request.message.message_id,
    chat_id: request.message.chat_id
  });
} else {
  Api.sendMessage({
    text: text,
    parse_mode: "html",
    reply_markup: { inline_keyboard: button }
  });
}
