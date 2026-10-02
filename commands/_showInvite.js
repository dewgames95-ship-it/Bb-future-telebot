/*CMD
  command: /showInvite
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

// /* command: /showInvite */
if (request.data === "/showInvite") {
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
    "🔥 Exclusive Referral Commission System! 🔥\n\n" +
    "💰 Earn commissions on deposits by your referrals! The more you refer, the more you earn! 🚀\n\n" +
    "<b>🏆 Referral Stats:</b>\n" +
    "👤 <b>Level 1</b>: " + refL1 + " users → 💰 <b>" + commL1.toFixed(2) + " USDT</b>\n" +
    "👥 <b>Level 2</b>: " + refL2 + " users → 💰 <b>" + commL2.toFixed(2) + " USDT</b>\n" +
    "👨‍👨‍👦 <b>Level 3</b>: " + refL3 + " users → 💰 <b>" + commL3.toFixed(2) + " USDT</b>\n\n" +
    "🔹 <b>Total Referrals</b>: <b>" + totalRefs + "</b>\n" +
    "🔹 <b>Total Deposits</b>: <b>" + totalDep.toFixed(2) + " USDT</b>\n" +
    "🔹 <b>Total Earnings</b>: <b>" + totalEarn.toFixed(2) + " USDT</b>\n" +
    "✅ <b>Total Withdrawn</b>: <b>" + totalWith.toFixed(2) + " USDT</b>\n" +
    "✅ <b>Available Balance</b>: <b>" + availBal.toFixed(2) + " USDT</b>\n\n" +
    "<b>🔥 Team Commission Rates:</b>\n" +
    "👍 A-level team <b>8%</b>, deposits 1,000 USDT → you earn <b>80 USDT</b>\n" +
    "💵 B-level team <b>3%</b>, deposits 1,000 USDT → you earn <b>30 USDT</b>\n" +
    "❤️ C-level team <b>1%</b>, deposits 1,000 USDT → you earn <b>10 USDT</b>\n\n" +
    "<b>👬 Your Invite Link:</b>\n" +
    "🔗 <b>" + referralLink + "</b>\n\n" +
    "<b>💎 How to Start?</b>\n" +
    "📢 1. Share your link (WhatsApp, Telegram, X, Instagram, YouTube)\n" +
    "💰 2. Earn <b>8%</b>, <b>3%</b>, <b>1%</b> commissions on your referrals’ deposits\n" +
    "💳 3. Withdraw anytime!\n\n" +
    "🚀 More referrals = More earnings!";

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
}
