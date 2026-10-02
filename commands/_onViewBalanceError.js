/*CMD
  command: /onViewBalanceError
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

// command: /onViewBalanceError
var text = "<i>⚠️ Request failed. Try again later.</i>";

Api.sendMessage({
  text: text,
  parse_mode: "html"
});
