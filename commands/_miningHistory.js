/*CMD
  command: /miningHistory
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

// command: /miningHistory
var ban = Bot.getProperty(user.telegramid);
if (ban === "Ban") {
  Api.sendMessage({
    text: "<i>🚫 You're banned.</i>",
    parse_mode: "html"
  });
  return;
}

var maintenanceStatus = Bot.getProperty("maintenanceStatus");
if (maintenanceStatus === "On") {
  Api.sendMessage({
    text: "<i>🛠️ Bot is under maintenance, please come back after some time.</i>",
    parse_mode: "html"
  });
  return;
}

var historyString = User.getProperty("miningHistory");
Bot.setProperty("miningHistory_" + user.telegramid, historyString, "string"); // Store globally
var history = [];
if (historyString) {
  try {
    history = JSON.parse(historyString);
  } catch (e) {
    history = [];
  }
}

if (history.length === 0) {
  var noHistoryText = "<b>📊 Investment History</b>\n\n<i>No active VIP plans found. Please purchase VIP plans to see your vip plan history.</i>";
  var button = [
    [{ text: "🔙 Back", callback_data: "/close_minning" }]
  ];
  if (request.data) {
    Api.editMessageText({
      text: noHistoryText,
      parse_mode: "html",
      reply_markup: { inline_keyboard: button },
      message_id: request.message.message_id,
      chat_id: request.message.chat_id
    });
  } else {
    Api.sendMessage({
      text: noHistoryText,
      parse_mode: "html",
      reply_markup: { inline_keyboard: button }
    });
  }
  return;
}

var now = Date.now();
var text = "<b>📊 Your Investment History:</b>\n\n";
var groups = {
  "VIP 1": [], "VIP 2": [], "VIP 3": [], "VIP 4": [], "VIP 5": [], "VIP 6": []
};

for (var i = 0; i < history.length; i++) {
  var rec = history[i];
  var match = rec.planName.match(/VIP\s*\d+/);
  if (!match) continue;
  var planKey = match[0];
  if (groups.hasOwnProperty(planKey)) {
    groups[planKey].push(rec);
  }
}

var vipOrder = ["VIP 1", "VIP 2", "VIP 3", "VIP 4", "VIP 5", "VIP 6"];
for (var j = 0; j < vipOrder.length; j++) {
  var plan = vipOrder[j];
  var records = groups[plan];
  if (records.length === 0) continue;
  text += "<b>🔹 " + plan + ":</b>\n";
  for (var k = 0; k < records.length; k++) {
    var record = records[k];
    var purchaseDate = new Date(record.purchaseTimestamp).toLocaleString();
    var elapsedDays = Math.floor((now - record.purchaseTimestamp) / 86400000);
    if (elapsedDays > record.expirationDays) {
      elapsedDays = record.expirationDays;
    }
    var profitReceived = (elapsedDays * record.dailyProfit).toFixed(2);
    var remainingDays = record.expirationDays - elapsedDays;
    var planLabel = records.length > 1 ? " (Plan " + (k + 1) + ")" : "";
    text += "<b>" + record.planName + planLabel + "</b>\n" +
            "<b>📆 Purchased:</b> " + purchaseDate + "\n" +
            "<b>💰 Total Profit Earned:</b> " + profitReceived + " USDT\n" +
            "<b>♻️ Progress:</b> " + elapsedDays + " of " + record.expirationDays + " days\n" +
            "<b>⏳ Time Remaining:</b> " + (remainingDays > 0 ? remainingDays + " days left" : "Expired") + "\n\n";
  }
}

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
