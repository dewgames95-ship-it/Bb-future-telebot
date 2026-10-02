/*CMD
  command: processDeposit
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

function processDeposit(amount) {
  // Ban & Maintenance Checks
  var ban = Bot.getProperty(user.telegramid);
  if (ban === "Ban") {
    Api.sendMessage({ text: "<i>🚫 Access Denied!</i>\n\n<b>Reason:</b> You are banned.", parse_mode: "html" });
    return;
  }
  var maintenanceStatus = Bot.getProperty("maintenanceStatus");
  if (maintenanceStatus === "On") {
    Api.sendMessage({ text: "<i>🛠️ Under Maintenance</i>\n\nPlease check back later.", parse_mode: "html" });
    return;
  }

  // Network Check
  var selectedNetwork = User.getProperty("selectedNetwork");
  if (!selectedNetwork) {
    Api.sendMessage({ text: "Please select a network first by clicking '🏦 Deposit Funds'." });
    return;
  }

  // Amount Validation
  if (amount < 1 || amount > 1000000) {
    Api.sendMessage({ text: "_❌ Invalid amount. Must be between 1 and 1,000,000 USDT._", parse_mode: "markdown" });
    return;
  }

  // Store Amount
  User.setProperty("USDTDepositAmount", amount, "number");

  // API Call Options
  const apiOptions = {
    url: "merchants/request/whitelabel",
    fields: {
      amount: amount,
      currency: "USDT",
      payCurrency: "USDT",
      network: selectedNetwork,
      lifeTime: 90,
      orderId: Libs.Random.randomInt(10000, 99999999999),
      onCallback: "/onCallbackPaymentUSDT"
    },
    onSuccess: "/onCreatePaymentWithUSDT"
  };

  // Send Loading Message & Call API
  Api.sendMessage({
    chat_id: chat.chatid,
    text: "⏳ <b>Generating deposit address...</b>\n<i>Securely linking your wallet</i>",
    parse_mode: "html"
  });

  try {
    Libs.OxaPayLib.apiCall(apiOptions);
  } catch (e) {
    Api.sendMessage({
      chat_id: chat.chatid,
      text: `❌ <b>Error:</b> Failed to process deposit. Error: ${e.message}`,
      parse_mode: "html"
    });
  }
}
