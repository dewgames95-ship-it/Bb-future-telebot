/*CMD
  command: /onRemoveAllError
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

//command: /onRemoveAllError
var errorMsg = "<i>⚠️ Error fetching user info. Balances were removed, but user details unavailable.</i>";
Api.sendMessage({
  text: errorMsg,
  parse_mode: "html"
});

// Clear temp data
Bot.setProperty("removeAllData", null);
