/*CMD
  command: refundInput
  help: 
  need_reply: true
  auto_retry_time: 
  folder: 

  <<ANSWER

  ANSWER

  <<KEYBOARD

  KEYBOARD
  aliases: 
  group: 
CMD*/

/* Command: refundInput */
const uid     = Bot.getProperty("refundTarget");
const messageText = (message || "").trim();

// Validate stash
if (!uid) {
  return Api.sendMessage({
    text: "⚠️ <b>Error:</b> Missing refund target.",
    parse_mode: "html"
  });
}

// Fetch stashed amount & pending data
const amount = Bot.getProperty("refundAmount");
const pd      = Bot.getProperty("refundPending_" + uid, "json") || {};

// ➕ Restore the user’s available referral balance exactly once
Libs.ResourcesLib.anotherUserRes("refCommission", uid).add(amount);

// 🚮 Clear all stashes
Bot.setProperty("refundTarget",       "",     "string");
Bot.setProperty("refundAmount",       0,      "float");
Bot.setProperty("refundPending_" + uid, "",    "string");

// ✅ Confirm to admin
Api.sendMessage({
  text: "✅ Refund processed & message sent to the user.",
  parse_mode: "html"
});

// 📩 Notify the user with wallet & updated balance
const first    = Bot.getProperty("firstName_" + uid)   || "";
const last     = Bot.getProperty("lastName_"  + uid)   || "";
const fullName = (first + " " + last).trim() || "User";
const wallet   = pd.wallet || "Not set";
const available= Libs.ResourcesLib.anotherUserRes("refCommission", uid).value().toFixed(2);

Bot.sendMessageToChatWithId(uid,
  `<b>❌ Your referral withdrawal of ${amount.toFixed(2)} USDT has been cancelled.</b>\n\n` +
  `🏦 Wallet: <code>${wallet}</code>\n` +
  `🏧 Available Balance: <b>${available} USDT</b>\n\n` +
  `<b>Note:</b> ${messageText}`, 
  { parse_mode: "html" }
);
