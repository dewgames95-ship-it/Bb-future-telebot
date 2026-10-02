/*CMD
  command: /payrefer
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

/* Command: /payrefer */
if (request.data && request.data.startsWith("/payrefer")) {
  // 🗑️ Delete admin panel
  try {
    Api.deleteMessage({ chat_id:request.message.chat.id, message_id:request.message.message_id });
  } catch(e){}

  // 🍰 Parse & stash
  const [_, uid, amtStr] = request.data.split(" ");
  const amt = parseFloat(amtStr);
  Bot.setProperty("payRefTarget", uid, "string");
  Bot.setProperty("payRefAmount", amt, "float");

  // ✏️ Prompt admin for custom reply
  Api.sendMessage({
    text: "✏️ <b>Enter the Transaction ID or 'skip' to omit:</b>",
    parse_mode: "html"
  });

  // ▶️ Trigger the input handler
  Bot.runCommand("payreferInput");
}
