/*CMD
  command: /InviteAndEarn
  help: 
  need_reply: false
  auto_retry_time: 
  folder: 

  <<ANSWER

  ANSWER

  <<KEYBOARD

  KEYBOARD
  aliases: 🤝 invite & earn
  group: 
CMD*/

// /* command: /InviteAndEarn */
const refL1 = Libs.ResourcesLib.userRes("refL1Count").value() || 0;
const refL2 = Libs.ResourcesLib.userRes("refL2Count").value() || 0;
const refL3 = Libs.ResourcesLib.userRes("refL3Count").value() || 0;
const totalRefs = Libs.ResourcesLib.userRes("refTotalCount").value() || 0;
const totalDep = Libs.ResourcesLib.userRes("refDepositTotal").value() || 0;
const totalEarn = Libs.ResourcesLib.userRes("totalRefCommission").value() || 0;
const availBal = Libs.ResourcesLib.userRes("refCommission").value() || 0;
const totalWith = Libs.ResourcesLib.userRes("refWithdrawn").value() || 0;
const commL1 = Libs.ResourcesLib.userRes("refL1Commission").value() || 0;
const commL2 = Libs.ResourcesLib.userRes("refL2Commission").value() || 0;
const commL3 = Libs.ResourcesLib.userRes("refL3Commission").value() || 0;

const referralLink = Libs.ReferralLib.getLink();
const shareText = "Hey 👋 Just wanted to share something crazy — I found this bot recently and it’s been printing money daily 💸 No joke, it’s worth checking out if you’re into passive income 💼";
const shareUrl = "https://t.me/share/url?text=" + encodeURIComponent(shareText) + "&url=" + encodeURIComponent(referralLink);

const text =
  "<b>💠 Future Combo Bot provides a generous team commission reward mechanism for each user.</b>\n\n" +
  "<b>🏆 Referral Stats:</b>\n" +
  "👤 <b>Level 1</b>: " + refL1 + " users → 💰 <b>" + commL1.toFixed(2) + " USDT</b>\n" +
  "👥 <b>Level 2</b>: " + refL2 + " users → 💰 <b>" + commL2.toFixed(2) + " USDT</b>\n" +
  "👨‍👨‍👦 <b>Level 3</b>: " + refL3 + " users → 💰 <b>" + commL3.toFixed(2) + " USDT</b>\n\n" +
  "🔹 <b>Total Referrals</b>: <b>" + totalRefs + "</b>\n" +
  "🔹 <b>Total Deposits</b>: <b>" + totalDep.toFixed(2) + " USDT</b>\n" +
  "🏦 <b>Total Earnings</b>: <b>" + totalEarn.toFixed(2) + " USDT</b>\n" +
  "📤 <b>Withdrawn</b>: <b>" + totalWith.toFixed(2) + " USDT</b>\n" +
  "💰 <b>Available</b>: <b>" + availBal.toFixed(2) + " USDT</b>\n\n" +
  "🔥 Team commission: A B C rebate <b>8%</b> <b>3%</b> <b>1%</b>\n\n" +
  "👍 A-level team <b>8%</b>, the other party deposits 1,000 USDT, you get <b>80 USDT</b>\n\n" +
  "💵 B-level team <b>3%</b>, the other party deposits 1000 USDT, you get <b>30 USDT</b>\n\n" +
  "❤️ C-level team <b>1%</b>, the other party deposits 1000 USDT, you get <b>10 USDT</b>\n\n" +
  "<b>👬 Your Invite Link:</b>\n" +
  "<b>🔗 " + referralLink + "</b>\n\n" +
  "<i>🚀 The more your team grows, the more you earn!</i>\n\n" +
  "<b>How To Withdraw Refer Commission?\n👉 <a href='https://t.me/FutureComboBotGroup/450'>Watch Video Guide</a></b>";

if (request.data === "/InviteAndEarn") {
  Api.editMessageText({
    text: text,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "👬 Referral History", callback_data: "/referHistory" },
          { text: "Share Link 🔗", url: shareUrl }
        ],
        [{ text: "💸 Withdraw Commission", callback_data: "/withdrawCommission" }],
        [{ text: "🏠 Back to Main Menu", callback_data: "/close_menu" }]
      ]
    },
    parse_mode: "html",
    message_id: request.message.message_id,
    chat_id: request.message.chat_id,
    disable_web_page_preview: true
  });
} else {
  Api.sendMessage({
    text: text,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "👬 Referral History", callback_data: "/referHistory" },
          { text: "Share Link 🔗", url: shareUrl }
        ],
        [{ text: "💸 Withdraw Commission", callback_data: "/withdrawCommission" }],
        [{ text: "🏠 Back to Main Menu", callback_data: "/close_menu" }]
      ]
    },
    parse_mode: "html",
    disable_web_page_preview: true
  });
}
