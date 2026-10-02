/*CMD
  command: /wallet2
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

// command : /wallet2
var texts = {
    banned: "<i>🚫 You're banned.</i>",
    invalidWallet: "<i>⚠️ Invalid USDT (BEP20) wallet address. Please try again.</i>",
    walletSet: "<b>🗂️ Your USDT (BEP20) wallet has been set to:</b> <code>{wallet}</code>"
};

// Get the wallet address from the user's message, trimmed
var wallet = message.trim();
var currency = "USDT (BEP20)";

// Validate the wallet address using a regex pattern
if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
  Api.sendMessage({
    text: texts.invalidWallet,
    parse_mode: "html"
  });
  return;
}

// Save the wallet address to the user's properties
User.setProperty("wallet", wallet, "string");

// Send confirmation message with the wallet address inserted into the localized text
var confirmation = texts.walletSet.replace("{wallet}", wallet);
Api.sendMessage({
  text: confirmation,
  parse_mode: "html"
});

// Redirect to main menu
Bot.runCommand("/mainMenu");
