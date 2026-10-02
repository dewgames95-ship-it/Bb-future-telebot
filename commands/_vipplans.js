/*CMD
  command: /vipplans
  help: 
  need_reply: false
  auto_retry_time: 
  folder: 

  <<ANSWER

  ANSWER

  <<KEYBOARD

  KEYBOARD
  aliases: 📊 vip investment plans
  group: 
CMD*/

//command. /vipplans
if (Bot.getProperty(user.telegramid) === "Ban") {
  Api.sendMessage({
    text: "<b>not wo.</b>\n<b>❗ Contact support for more info.</b>",
    parse_mode: "html"
  });
  return;
}
if (Bot.getProperty("maintenanceStatus") === "On") {
  Api.sendMessage({
    text: "<b>🛠️ Maintenance Mode Enabled!</b>\n<b>Please check back later. 🙏</b>",
    parse_mode: "html"
  });
  return;
}

var message =
  "<b>🚀 VIP Investment Plans 🚀</b>\n\n" +
  "💰 Invest Today & Earn <b>Daily Passive Income!</b>\n" +
  "🔒 <b>100% Transparency | Instant Profits | Fast Withdrawals</b>\n\n" +

  "🔹 <b>VIP 1 – Starter Plan</b>\n" +
  "💵 Investment: <b>30 USDT</b>\n" +
  "📈 Daily Profit: <b>1.20 USDT</b> (~4%)\n" +
  "⏳ Duration: <b>4 Months (120 Days)</b>\n" +
  "💰 Total Earnings: <b>144 USDT</b>\n" +
  "<i>✅ Max Buy – 2 Times</i>\n\n" +

  "🔹 <b>VIP 2 – Grow Steady</b>\n" +
  "💵 Investment: <b>150 USDT</b>\n" +
  "📈 Daily Profit: <b>7.50 USDT</b> (~5%)\n" +
  "⏳ Duration: <b>4 Months (120 Days)</b>\n" +
  "💰 Total Earnings: <b>900 USDT</b>\n" +
  "<i>✅ Max Buy – 2 Times</i>\n\n" +

  "🔹 <b>VIP 3 – High Return</b>\n" +
  "💵 Investment: <b>600 USDT</b>\n" +
  "📈 Daily Profit: <b>39.00 USDT</b> (~6.5%)\n" +
  "⏳ Duration: <b>4 Months (120 Days)</b>\n" +
  "💰 Total Earnings: <b>4,680 USDT</b>\n" +
  "<i>✅ Max Buy – 3 Times</i>\n\n" +

  "🔹 <b>VIP 4 – Ultimate Profits</b>\n" +
  "💵 Investment: <b>3,000 USDT</b>\n" +
  "📈 Daily Profit: <b>270.00 USDT</b> (~9%)\n" +
  "⏳ Duration: <b>4 Months (120 Days)</b>\n" +
  "💰 Total Earnings: <b>32,400 USDT</b>\n" +
  "<i>✅ Max Buy – 3 Times</i>\n\n" +

  "🚀 <b>VIP 5 – Elite Max Profit</b>\n" +
  "💵 Investment: <b>8,000 USDT</b>\n" +
  "📈 Daily Profit: <b>960.00 USDT</b> (~12%)\n" +
  "⏳ Duration: <b>2 Months (60 Days)</b>\n" +
  "💰 Total Earnings: <b>57,600 USDT</b>\n" +
  "<i>✅ Max Buy – 2 Times</i>\n\n" +

  "💠 <b>VIP 6 – Hyperion Wealth</b>\n" +
  "💵 Investment: <b>18,000 USDT</b>\n" +
  "📈 Daily Profit: <b>2,880.00 USDT</b> (~16%)\n" +
  "⏳ Duration: <b>1 Month (30 Days)</b>\n" +
  "💰 Total Earnings: <b>86,400 USDT</b>\n" +
  "<i>✅ Max Buy – 1 Time</i>\n\n" +

  "🤖 <b>Bot Commission:</b>\n" +
  "• <b>30%</b> on Profits for VIP 1–2\n" +
  "• <b>20%</b> on VIP 3\n" +
  "• <b>10%</b> on VIP 4\n" +
  "• <b>5%</b> on VIP 5\n" +
  "• <b>1%</b> on VIP 6\n\n" +

  "✅ <b>Choose Your VIP Plan Below</b>\n" +
  "📌 Tap a button to invest instantly";

var buttons = [
  [{ text: "✨ VIP 1 – Start Small (30 USDT)",           callback_data: "/buy 1" }],
  [{ text: "💎 VIP 2 – Grow Steady (150 USDT)",         callback_data: "/buy 2" }],
  [{ text: "🚀 VIP 3 – High Returns (600 USDT)",        callback_data: "/buy 3" }],
  [{ text: "🔥 VIP 4 – Pro Investor (3,000 USDT)",      callback_data: "/buy 4" }],
  [{ text: "👑 VIP 5 – Ultimate Profits (8,000 USDT)",  callback_data: "/buy 5" }],
  [{ text: "❄️ VIP 6 – Hyperion Wealth (18,000 USDT)",  callback_data: "/buy 6" }],
  [{ text: "🏡 Back To Main Menu",                      callback_data: "/close_menu" }]
];

Api.sendMessage({
  text: message,
  parse_mode: "html",
  reply_markup: { inline_keyboard: buttons }
});
