/*CMD
  command: /referHistory
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

// /* command: /referHistory */
if (request.data) {
  var chatID = request.message.chat_id;
  var messageID = request.message.message_id;
  Api.deleteMessage({ chat_id: chatID, message_id: messageID });
}

var ban = Bot.getProperty(user.telegramid);
if (ban === "Ban") {
  Api.sendMessage({ text: "<i>🚫 You're banned.</i>", parse_mode: "html" });
  return;
}

var maintenanceStatus = Bot.getProperty("maintenanceStatus");
if (maintenanceStatus === "On") {
  Api.sendMessage({ text: "<i>🛠️ Bot is under maintenance, please come back after some time.</i>", parse_mode: "html" });
  return;
}

// 🔍 Fetch referral list & data
const refListKey = "referralList_" + user.telegramid;
let refList = JSON.parse(Bot.getProperty(refListKey) || "[]");

const refDataKey = "referralData_" + user.telegramid;
let refData = JSON.parse(Bot.getProperty(refDataKey) || "{}");

// Group by level
let levelGroups = {1: [], 2: [], 3: []};
refList.forEach(id => {
  let d = refData[id];
  if (d && d.level) {
    levelGroups[d.level].push({...d, id: id});
  }
});

// Sort each level by totalDeposit desc
for (let lvl in levelGroups) {
  levelGroups[lvl].sort((a, b) => b.totalDeposit - a.totalDeposit);
}

let text = "📋 Your Referral Breakdown\n\n";
let hasAny = false;
const percents = [0, 8, 3, 1];
for (let lvl = 1; lvl <= 3; lvl++) {
  let group = levelGroups[lvl];
  if (group.length > 0) {
    hasAny = true;
    text += "Level " + lvl + " (" + percents[lvl] + "% Commission)\n";
    group.forEach(s => {
      text += "🆔 ID: <code>" + s.id + "</code>\n" +
              "💰 Total Deposited: <b>" + s.totalDeposit.toFixed(2) + " USDT</b>\n" +
              "💵 Your Earnings: <b>" + s.totalCommission.toFixed(2) + " USDT</b>\n\n";
    });
  }
}

if (!hasAny) {
  text += "No referrals yet.";
}

var button = [
  [{ text: "🔙 Back", callback_data: "/showInvite" }] // Updated Back button with new callback
];

Api.sendMessage({
  text: text,
  reply_markup: { inline_keyboard: button },
  parse_mode: "html"
});
