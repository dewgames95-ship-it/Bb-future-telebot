/*CMD
  command: /close_menu
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

// command. /close_menu
var ban = Bot.getProperty(user.telegramid);
if (ban === "Ban") {
  var banText = "<b>🚫 You are banned from using this bot.</b>\n<i>💡 Contact support for more information.</i>";
  Api.editMessageText({
    text: banText,
    parse_mode: "html",
    message_id: request.message.message_id,
    chat_id: request.message.chat_id
  });
  return;
}

var maintenanceStatus = Bot.getProperty("maintenanceStatus");
if (maintenanceStatus === "On") {
  var onText = "<b>🛠️ The bot is currently under maintenance.</b>\n<i>⏳ Please check back later!</i>";
  Api.editMessageText({
    text: onText,
    parse_mode: "html",
    message_id: request.message.message_id,
    chat_id: request.message.chat_id
  });
  return;
}

// **Initialize global properties if not set**
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
    var perRefer = Bot.getProperty("perRefer");
    Api.sendMessage({
      chat_id: refUser.telegramid,
      text: "<b>💖 Your referral joined our channels!</b>\n\n<i>💸 You'll get :</i> <code>" +
        perRefer +
        "%</code> <i>commission on your friend's deposits.</i>",
      parse_mode: "html"
    });
    User.setProperty("referCount", 1, "integer");
    User.setProperty("referStatus", "valid", "string");
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
  "<b><a href='https://telegra.ph/Your-Future-Starts-Here-Explore-the-Future-Combo-Bot-FAQ-07-26'>See FAQs❔</a></b>\n" +
  "✅ Minimum Investment: <b>30 USDT</b>\n" +
  "✅ Minimum Deposit/Withdraw: <b>1 USDT</b>\n" +
  "<b>📺 <a href='https://t.me/FutureComboBot_Channel/59'>How To Use Bot Video Tutorial</a></b>\n\n" +
  "✅ Safe Operations: <b>" + currentDays + " Days</b>\n" +
  "💰 Cumulative Income: <b>" + currentCumulativeIncome.toLocaleString() + " USDT</b>";

/*––––––[ Inline Keyboard Buttons ]––––––*/
var inlineButtons = [
  [
    { text: "📈 Bot Profit (Proof)", url: "https://t.me/+3vdtmbItQ4AwMGM1" },
    { text: "📌 Withdraw Proof", url: "https://t.me/futurecombobot_stats" }
  ],
  [
    // 💎 Full width FREE VIP ACCESS button
    { text: "💎 FREE VIP ACCESS - JOIN NOW 🚀", url: "https://t.me/+-o0a1X684v5hMzc9" }
  ]
];

/*––––––[ Edit Welcome Message with Inline Keyboard ]––––––*/
Api.editMessageText({
  text: welcomeText,
  reply_markup: { inline_keyboard: inlineButtons },
  parse_mode: "html",
  disable_web_page_preview: true,
  message_id: request.message.message_id,
  chat_id: request.message.chat_id
});
