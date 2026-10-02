/*CMD
  command: /storeBotMsg
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

// Command: /storeBotMsg
try {
  var commandName = "mainMenu"; // or whatever your main command is
  var newBotMsgId = options.result.message_id;

  // Save new bot message ID
  User.setProperty("bot_msg_id_" + commandName, newBotMsgId, "integer");
} catch (e) {
  Bot.sendMessage("❌ Error storing bot message ID: " + e.message);
}
