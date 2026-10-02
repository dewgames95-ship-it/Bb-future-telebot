/*CMD
  command: /help
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

//command /help
/*––––––[ Ban Check ]––––––*/
var ban = Bot.getProperty(user.telegramid);
if (ban === "Ban") {
  Api.sendMessage({
    text: "<i>please not try weeksbots server not working in your country  criteria   .</i>",
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

/*––––––[ Help Message ]––––––*/
var helpText =
  "<b>Here You will find all community Links And Details about This Platform.</b>\n\n" +
  "<b>📌 What’s this bot?</b>\n" +
  "Future Combo Bot is your all-in-one crypto trading and investment system.\n" +
  "<b>💸 Earn passive USDT income 24/7</b> — just deposit, activate VIP, and watch your daily profits grow.\n" +
  "<b>👥 Refer friends</b> for commissions, withdraw anytime — all right inside Telegram, fully transparent.\n\n" +
  "<b>📽️ Watch Video Tutorials</b>\n" +
  "<a href='https://t.me/FutureComboBotGroup/453'>How To Use Bot Video Tutorial ( English) 🇺🇸</a>\n\n" +
  "<a href='https://t.me/FutureComboBotGroup/452'>बॉट का उपयोग कैसे करें वीडियो ट्यूटोरियल (हindi) 🇮🇳</a>\n" +
  "(Click to watch 👆)\n\n" +
  "<b>⸻</b>";

/*––––––[ Inline Keyboard Buttons - Mini App Button Removed ]––––––*/
var inlineButtons = [
  [{ text: "💬 Join Group Chat to see testimonials", url: "https://t.me/FutureComboBotgroup" }],
  [{ text: "📈 Live Profit (Proof)", url: "https://t.me/FutureComboBot_Livetrades" }],
  [{ text: "📌 Withdrawal (Proof)", url: "https://t.me/FutureComboBot_Stats" }],
  [{ text: "📘 Read Bot Manual", url: "https://telegra.ph/Dont-Sleep-on-Profits-Master-the-Bots-Features-Today-07-25" }],
  [{ text: "❓ View Bot FAQ", url: "https://telegra.ph/Your-Future-Starts-Here-Explore-the-Future-Combo-Bot-FAQ-07-26" }],
  [{ text: "🤖 Support Bot", url: "https://t.me/FutureCombosupportbot" }],
  [{ text: "📞 Live Chat with agent", url: "https://t.me/FutureComboBot_Support" }],
  [{ text: "🔙 Go Back to Main Menu", callback_data: "/close_menu" }]
];

/*––––––[ Send Help Message with Inline Keyboard ]––––––*/
Api.sendMessage({
  text: helpText,
  reply_markup: { inline_keyboard: inlineButtons },
  parse_mode: "html",
  disable_web_page_preview: true
});
