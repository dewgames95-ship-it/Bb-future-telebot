/*CMD
  command: /view
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

// command: /view
var admin = Bot.getProperty("admin");
var users = user.telegramid;
var botLink = "@" + bot.name;
var merchantAPI = Bot.getProperty("merchantAPI");

if (users === admin) {
  if (!merchantAPI) {
    var text = "<i>⚠️ Merchant API key not set. Set it first via admin panel.</i>";
    Api.sendMessage({
      text: text,
      parse_mode: "html"
    });
    return;
  }

  HTTP.request({
    url: "https://api.oxapay.com/merchants/inquiry/balance",
    method: "post",
    body: { api_key: merchantAPI },
    headers: { "Content-Type": "application/json" },
    success: "/onViewBalanceSuccess",
    error: "/onViewBalanceError"
  });
} else {
  var notAdminText = "<i>⚠️ You're not the admin of " + botLink + ".</i>";
  Api.sendMessage({
    text: notAdminText,
    parse_mode: "html"
  });
}
