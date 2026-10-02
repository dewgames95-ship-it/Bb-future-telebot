/*CMD
  command: /onRemoveAllSuccess
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

//command: /onRemoveAllSuccess
var data = Bot.getProperty("removeAllData");
if (!data) {
  Api.sendMessage({
    text: "<i>⚠️ Error: Removal data not found. Balances may have been updated, but confirmation failed.</i>",
    parse_mode: "html"
  });
  return;
}

var removeID = data.removeID;
var amount = data.amount;
var currency = data.currency;

var first_name = "User";  // Default
if (request && request.result && request.result.first_name) {
  first_name = request.result.first_name;
}

var adminText = "<b>💸 Amount</b> <code>{amount} {currency}</code> <b>is removed from both balances of user</b> <a href=\"tg://user?id={removeID}\">{first_name}</a> <code>{removeID}</code>."
                      .replace("{amount}", amount.toFixed(2))
                      .replace("{currency}", currency)
                      .replace("{removeID}", removeID)
                      .replace("{removeID}", removeID)
                      .replace("{first_name}", first_name);

Api.sendMessage({
  text: adminText,
  parse_mode: "html"
});

// Clear temp data
Bot.setProperty("removeAllData", null);
