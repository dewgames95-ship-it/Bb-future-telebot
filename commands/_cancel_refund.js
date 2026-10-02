/*CMD
  command: /cancel_refund
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

/* Command: /cancel_refund */
if (request.data && request.data.startsWith("/cancel_refund")) {
  // 🗑️ Remove the admin panel
  try {
    Api.deleteMessage({
      chat_id: request.message.chat.id,
      message_id: request.message.message_id
    });
  } catch (e) {}

  // 📦 Parse user ID & amount
  const parts  = request.data.split(" ");
  const uid    = parts[1];
  const amount = parseFloat(parts[2]);
  if (!uid || isNaN(amount)) {
    return Api.sendMessage({ text: "⚠️ <b>Invalid refund data.</b>", parse_mode: "html" });
  }

  // 🔖 Stash the pending record (so we can read wallet later)
  const pendKey = "pendingRefW_" + uid;
  const pd      = Bot.getProperty(pendKey, "json") || {};
  Bot.setProperty("refundPending_" + uid, pd, "json");

  // 🚮 Clear the pending withdrawal
  Bot.setProperty(pendKey, "", "string");

  // 💾 Stash for the input handler
  Bot.setProperty("refundTarget",  uid,    "string");
  Bot.setProperty("refundAmount",  amount, "float");

  // ✏️ Prompt admin for custom refund message
  Api.sendMessage({
    text: "✏️ <b>Enter the message to send to the user about the refund:</b>",
    parse_mode: "html"
  });

  // ▶️ Trigger the input handler
  Bot.runCommand("refundInput");
}
