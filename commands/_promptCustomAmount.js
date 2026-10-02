/*CMD
  command: /promptCustomAmount
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

// command: promptCustomAmount

Api.sendMessage({
  text: "Please enter an Amount You Want To Withdraw ✍️",
  parse_mode: "html",
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: "❌ Cancel Process",
          callback_data: "/cancelprocess"
        }
      ]
    ]
  }
});
Bot.runCommand("/withdraw");
