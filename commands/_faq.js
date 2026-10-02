/*CMD
  command: /faq
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

 /* command: /faq */

// Define the inline Back button for the second FAQ message
var secondMsgKeyboard = {
  inline_keyboard: [
    [{ text: "Back", callback_data: "/close_menu" }]
  ]
};

// --- FAQ PART 1 (Questions 1–12) ---
// (This part does not include an inline back button)
var faqText1 =
"<b>🤖 Future Combo Bot – Complete FAQ</b>\n\n" +
"<b>1. How does the bot generate profit?</b>\n" +
"🚀 Our bot leverages advanced AI algorithms to trade crypto 24/7, opening both Long & Short trades to capture opportunities.\n\n" +
"<b>2. What makes this bot unique?</b>\n" +
"✨ It runs dual-direction strategies with strong risk management for consistent ROI.\n\n" +
"<b>3. Is it fully automated?</b>\n" +
"🤖 <b>Yes</b> – you invest and the bot executes trades automatically.\n\n" +
"<b>4. Minimum & maximum investment?</b>\n" +
"💸 You can start from 30 USDT (VIP 1); higher VIPs allow larger amounts.\n\n" +
"<b>5. How do commissions work?</b>\n" +
"💰 Charged only on profits: VIP 1–3 <b>30%</b>, VIP 4 <b>20%</b>, VIP 5 <b>10%</b>, VIP 6 <b>5%</b>.\n\n" +
"<b>6. Can I withdraw profits daily?</b>\n" +
"⏱ <b>Yes</b>, daily profits can be withdrawn at any time. Make Sure That You Complete Account Verification After First Withdrawal To Access Full access Of Unlimited Withdrawal and no restrictions this is simple to verify \n\n" +
"<b>7. Is my capital locked?</b>\n" +
"🔒 Capital is locked for 60 or 120 days, but your <b>daily profit</b> remains accessible.\n\n" +
"<b>8. How fast are withdrawals?</b>\n" +
"⚡ Typically processed within minutes; maximum 24 hours.\n\n" +
"<b>9. Early withdrawals?</b>\n" +
"❌ <b>No</b>, early exits are not allowed to maintain trading stability.\n\n" +
"<b>10. Bot operation duration?</b>\n" +
"⏳ Planned for <b>2+ years</b> with an upcoming app & website.\n\n" +
"<b>11. What are the VIP Plans?</b>\n" +
"<b>VIP Plans Overview (Duration: 120 days, except VIP 6: 60 days):</b>\n" +
"• VIP 1: 30 USDT → 1.2 USDT/day (~4%)\n" +
"• VIP 2: 150 USDT → 7.5 USDT/day (~5%)\n" +
"• VIP 3: 600 USDT → 39 USDT/day (~6.5%)\n" +
"• VIP 4: 3000 USDT → 270 USDT/day (~9%)\n" +
"• VIP 5: 8000 USDT → 960 USDT/day (~12%)\n" +
"• VIP 6: 18000 USDT → 2880 USDT/day (~16%)\n\n" +
"<b>12. When do I recover my capital?</b>\n" +
"💵 Usually in <b>10–15 days</b> via daily profit withdrawals; thereafter, it’s pure profit.";

// --- FAQ PART 2 (Questions 13–30) ---
// (This part includes the inline Back button)
var faqText2 =
"<b>13. Reinvest or upgrade plan?</b>\n" +
"🔁 <b>Yes</b> – after a plan ends, you can reinvest or upgrade to a higher VIP for enhanced returns.\n\n" +
"<b>14. Multiple VIP plans?</b>\n" +
"📈 Some plans allow multiple buys, letting you scale your investment.\n\n" +
"<b>15. Referral system?</b>\n" +
"👥 Earn <b>10%</b> on direct referrals, credited instantly.\n\n" +
"<b>16. Referral income source?</b>\n" +
"💸 Derived from the bot’s profit commission, not user deposits.\n\n" +
"<b>17. Is KYC required?</b>\n" +
"🆓 <b>No</b>; only a Telegram account and USDT (BEP-20) wallet are required.\n\n" +
"<b>18. Live trading results?</b>\n" +
"📊 Check <b> https://t.me/+3vdtmbItQ4AwMGM1 </b> for real-time PnL and trade logs.\n\n" +
"<b>19. Which exchange is used?</b>\n" +
"🏦 All trades are executed on <b>Binance</b> via secure API integration.\n\n" +
"<b>20. Trading experience necessary?</b>\n" +
"🎓 <b>No</b>; the system is designed for beginners and passive earners.\n\n" +
"<b>21. Market crash handling?</b>\n" +
"📉 The bot uses hedging strategies and risk controls to limit losses.\n\n" +
"<b>22. Referring without investing?</b>\n" +
"🤝 You must activate at least VIP 1; referrals are optional.\n\n" +
"<b>23. Not referring anyone?</b>\n" +
"👍 You still earn full returns from your own investment.\n\n" +
"<b>24. Long-term sustainability?</b>\n" +
"🔐 Yes, it’s built on verified trading, real commissions, and a strong roadmap.\n\n" +
"<b>25. How to get support?</b>\n" +
"📞 Tap the Support button within the bot for <b>live help</b>.\n\n" +
"<b>26. How to get started?</b>\n" +
"🚀 Join <b>@FutureComboBot</b>, set your wallet, deposit USDT (BEP-20), choose a VIP plan, and start earning daily.\n\n" +
"<b>27. Tracking earnings?</b>\n" +
"📈 Your dashboard shows real-time updates on profits and referrals.\n\n" +
"<b>28. Global usage?</b>\n" +
"🌍 <b>Yes</b>; anyone with Telegram and a USDT wallet can join.\n\n" +
"<b>29. Why higher percentage for VIP 1?</b>\n" +
"💡 Designed as a starter plan; higher VIPs yield better net returns due to lower fees.\n\n" +
"<b>30. Difference from MLM?</b>\n" +
"📌 Our system relies solely on automated trading with a single-layer, transparent referral setup.";

// Send FAQ part 1 (without inline Back button)
var sendRes1 = Api.sendMessage({
  text: faqText1,
  parse_mode: "HTML"
});
if (sendRes1 && sendRes1.message_id) {
  Bot.setProperty("faqMsg1", sendRes1.message_id, "string");
} else {
  Bot.setProperty("faqMsg1", "", "string");
}

// Send FAQ part 2 (with inline Back button)
var sendRes2 = Api.sendMessage({
  text: faqText2,
  parse_mode: "HTML",
  reply_markup: JSON.stringify(secondMsgKeyboard)
});
if (sendRes2 && sendRes2.message_id) {
  Bot.setProperty("faqMsg2", sendRes2.message_id, "string");
} else {
  Bot.setProperty("faqMsg2", "", "string");
}
