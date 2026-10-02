/*CMD
  command: /adminPanel
  help: 
  need_reply: false
  auto_retry_time: 
  folder: Admin Panel

  <<ANSWER

  ANSWER

  <<KEYBOARD

  KEYBOARD
  aliases: 
  group: 
CMD*/

//command: /adminPanel
var lang = {
  welcome: "<b>👋 Hello {adminName}, welcome to the admin panel of {botLink}.</b>",
  latestDepositTitle: "<b>📥 Latest Deposit Notification:</b>",
  noRecentDeposits: "No recent deposits.",
  realStatisticsTitle: "<b>Real Statistics:</b>",
  totalMembers: "🧑 Total members: {status}",
  totalWithdrawn: "💸 Total withdrawn: {totalWithdrawn} {currency}",
  totalDeposited: "🔥 Total deposited: {totalDeposits} {currency}",
  adminSettingsTitle: "<b>Admin Settings:</b>",
  setCurrency: "💲 Set currency: {currency}",
  setMinWithdraw: "💸 Set minimum withdraw: {minimumWithdraw} {currency}",
  setMaxWithdraw: "💸 Set maximum withdraw: {maximumWithdraw} {currency}",
  setWithdrawal: "🏧 Set withdrawal status: {withdrawalStatus}",
  setAutoWithdrawal: "🏧 Set Auto Withdrawal Status: {autowithStatus}",
  setAlertsChannel: "🔴 Set alerts channel: {alertsChannel}",
  setMerchantAPI: "🗝️ Set merchant API key: {merchantAPI}",
  setPayoutAPI: "🗝️ Set payout API key: {payoutAPI}",
  btnAddBalance: "➕ Add balance",
  btnRemoveBalance: "➖ Remove balance",
  btnRemoveProfitBalance: "📌 Remove Profit balance",
  btnBanUser: "🚫 Ban user",
  btnUnbanUser: "✔️ Unban user",
  btnBroadcast: "📢 Broadcast",
  btnSetCurrency: "💲 Set currency: {currency}",
  btnSetMinWithdraw: "💸 Set minimum withdraw: {minimumWithdraw} {currency}",
  btnSetMaxWithdraw: "💸 Set maximum withdraw: {maximumWithdraw} {currency}",
  btnSetWithdrawal: "🏧 Set withdrawal status: {withdrawalStatus}",
  btnSetAutoWithdrawal: "🏧 Set Auto Withdrawal Status: {autowithStatus}",
  btnSetAlertsChannel: "🔴 Set alerts channel: {alertsChannel}",
  btnSetMerchantAPI: "🗝️ Set merchant API key: {merchantAPI}",
  btnSetPayoutAPI: "🗝️ Set payout API key: {payoutAPI}",
  notAdmin: "<i>⚠️ You're not the admin of {botLink}.</i>"
};

var admin = Bot.getProperty("admin");
var users = user.telegramid;
var botLink = "@" + bot.name;

if (users === admin) {
  var adminName = user.first_name;
  
  // Fetch the last deposit notification from a global property
  var lastDeposit = Bot.getProperty("lastDeposit") || lang.noRecentDeposits;
  
  var text =
    lang.welcome.replace("{adminName}", adminName).replace("{botLink}", botLink) + "\n\n" +
    lang.latestDepositTitle + "\n" + lastDeposit + "\n\n";
  
  // --- REAL STATISTICS (using your stored resources) ---
  var statusRes = Libs.ResourcesLib.anotherChatRes("status", "global");
  var totalWithdrawnRes = Libs.ResourcesLib.anotherChatRes("totalWithdrawn", "global");
  var totalDepositsRes = Libs.ResourcesLib.anotherChatRes("totalDeposits", "global");
  
  var currency = "USDT";
  text += lang.realStatisticsTitle + "\n" +
          lang.totalMembers.replace("{status}", statusRes.value()) + "\n" +
          lang.totalWithdrawn.replace("{totalWithdrawn}", totalWithdrawnRes.value()).replace("{currency}", currency) + "\n" +
          lang.totalDeposited.replace("{totalDeposits}", totalDepositsRes.value()).replace("{currency}", currency) + "\n\n";
  
  // --- ADMIN SETTINGS ---
  var minimumWithdraw = Bot.getProperty("minimumWithdraw");
  var maximumWithdraw = Bot.getProperty("maximumWithdraw");
  var withdrawalStatus = Bot.getProperty("withdrawalStatus");
  var autowithStatus = Bot.getProperty("autowithStatus");
  var alertsChannel = Bot.getProperty("alertsChannel");
  var merchantAPI = Bot.getProperty("merchantAPI");
  var payoutAPI = Bot.getProperty("payoutAPI");
  
  text += lang.adminSettingsTitle + "\n" +
          lang.setCurrency.replace("{currency}", currency) + "\n" +
          lang.setMinWithdraw.replace("{minimumWithdraw}", minimumWithdraw).replace("{currency}", currency) + "\n" +
          lang.setMaxWithdraw.replace("{maximumWithdraw}", maximumWithdraw).replace("{currency}", currency) + "\n" +
          lang.setWithdrawal.replace("{withdrawalStatus}", withdrawalStatus) + "\n" +
          lang.setAutoWithdrawal.replace("{autowithStatus}", autowithStatus) + "\n" +
          lang.setAlertsChannel.replace("{alertsChannel}", alertsChannel) + "\n" +
          lang.setMerchantAPI.replace("{merchantAPI}", merchantAPI) + "\n" +
          lang.setPayoutAPI.replace("{payoutAPI}", payoutAPI);
  
  var buttons = [
    [
      { text: lang.btnAddBalance, callback_data: "/addBalance" },
      { text: lang.btnRemoveBalance, callback_data: "/removeBalance" }
    ],
    [
      { text: lang.btnRemoveProfitBalance, callback_data: "/removeAllBalance" }
    ],
    [
      { text: lang.btnBanUser, callback_data: "/banUser" },
      { text: lang.btnUnbanUser, callback_data: "/unbanUser" }
    ],
    [
      { text: lang.btnBroadcast, callback_data: "/broadcast" }
    ],
    [
      { text: lang.btnSetCurrency.replace("{currency}", currency), callback_data: "/setCurrency" }
    ],
    [
      { text: lang.btnSetMinWithdraw.replace("{minimumWithdraw}", minimumWithdraw).replace("{currency}", currency), callback_data: "/setMinimumWithdraw" }
    ],
    [
      { text: lang.btnSetMaxWithdraw.replace("{maximumWithdraw}", maximumWithdraw).replace("{currency}", currency), callback_data: "/setMaximumWithdraw" }
    ],
    [
      { text: lang.btnSetWithdrawal.replace("{withdrawalStatus}", withdrawalStatus), callback_data: "/setWithdrawalStatus" }
    ],
    [
      { text: lang.btnSetAutoWithdrawal.replace("{autowithStatus}", autowithStatus), callback_data: "/setAutoWithdrawalStatus" }
    ],
    [
      { text: lang.btnSetAlertsChannel.replace("{alertsChannel}", alertsChannel), callback_data: "/setAlertsChannel" }
    ],
    [
      { text: lang.btnSetMerchantAPI.replace("{merchantAPI}", merchantAPI), callback_data: "/setMerchantAPIKey" }
    ],
    [
      { text: lang.btnSetPayoutAPI.replace("{payoutAPI}", payoutAPI), callback_data: "/setPayoutAPIKey" }
    ]
  ];
  
  Api.sendMessage({
    text: text,
    reply_markup: { inline_keyboard: buttons },
    parse_mode: "html"
  });
} else {
  var notAdminText = lang.notAdmin.replace("{botLink}", botLink);
  Api.sendMessage({ text: notAdminText, parse_mode: "html" });
}
