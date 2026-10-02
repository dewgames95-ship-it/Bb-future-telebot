/*CMD
  command: /refundMessage
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

/* Command: /refundMessage */
// This command is triggered after the admin enters their custom refund message.
var refundCustomMessage = message; // The admin's custom refund message.
var targetUserId = Bot.getProperty("refundTargetUserId");
var amount = Bot.getProperty("refundAmount");

if (!targetUserId || isNaN(amount)) {
  Api.sendMessage({ text: "⚠️ Error: Missing refund parameters.", parse_mode: "html" });
  return;
}

// Remove the pending withdrawal record (no commission deduction) by clearing it.
Bot.setProperty("pendingWithdrawal_" + targetUserId, "", "json");

// Notify the user that the withdrawal request has been cancelled/refunded.
var refundNotification =
  "❌ <b>Your  withdrawal request has been cancelled/refunded by the system.</b>\n\n" +
  "👉 No funds have been deducted from your referral commissions.\n" +
  "Reason: " + refundCustomMessage;
  
Bot.sendMessageToChatWithId(
  targetUserId,
  refundNotification,
  { parse_mode: "html" }
);

// Notify the admin of the cancellation.
Api.sendMessage({
  text: "❌ Withdrawal request for user <code>" + targetUserId + "</code> has been cancelled/refunded.",
  parse_mode: "html"
});

// Clear stored refund properties using Bot.setProperty.
Bot.setProperty("refundTargetUserId", "", "string");
Bot.setProperty("refundAmount", "", "float");
