/*CMD
  command: /onViewBalanceSuccess
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

// command: /onViewBalanceSuccess
var data = JSON.parse(content);

var text;
if (data.result === 100) {
  text = "<b>✅ Available Balance:</b> " + data.availableBalance + " USDT";
} else {
  text = "<b>❌ Error fetching balance:</b> " + data.message;
}

Api.sendMessage({
  text: text,
  parse_mode: "html"
});
