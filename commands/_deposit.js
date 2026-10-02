/*CMD
  command: /deposit
  help: 
  need_reply: false
  auto_retry_time: 
  folder: 

  <<ANSWER

  ANSWER

  <<KEYBOARD

  KEYBOARD
  aliases: 🏦 deposit funds
  group: 
CMD*/

/* command: /deposit */
Api.sendMessage({
  text: "<b>Don’t know How to Deposit USDT❔</b>\n<b><a href='https://t.me/FutureComboBot_Channel/53'>👉 Watch Video Guide</a></b>\n\n<b>✅ Please select your deposit network:</b>",
  reply_markup: {
    inline_keyboard: [
      [{ text: "USDT (BEP20)", callback_data: "/selectBEP20" }],
      [{ text: "USDT (TRC20)", callback_data: "/selectTRC20" }],
      [{ text: "🔙 Back", callback_data: "/close_menu" }] // Added Back button
    ]
  },
  parse_mode: "html",
  disable_web_page_preview: true
});
