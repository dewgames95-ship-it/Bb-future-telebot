/*CMD
  command: payreferInput
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

// /* Command: payreferInput */
const uid    = Bot.getProperty("payRefTarget");
const amt    = Bot.getProperty("payRefAmount");
const custom = (message || "").trim();

// 1) Validate we have everything
if (!uid || !amt) {
  return Api.sendMessage({
    text: "⚠️ <b>Error:</b> Missing approval parameters.",
    parse_mode: "html"
  });
}

// 2) Retrieve & clear the pending withdrawal record
const pendKey = "pendingRefW_" + uid;
const pd      = Bot.getProperty(pendKey, "json") || {};
Bot.setProperty(pendKey,          "",     "string");
Bot.setProperty("payRefTarget",   "",     "string");
Bot.setProperty("payRefAmount",    0,      "float");

// 3) Update the user’s referral‐withdrawn total
Libs.ResourcesLib.anotherUserRes("refWithdrawn", uid).add(pd.amount);

// 4) Log into that user’s withdrawalHistory with type "referral"
const whKey = "withdrawalHistory_" + uid;
let whArr   = Bot.getProperty(whKey) || [];
if (!Array.isArray(whArr)) whArr = [];
whArr.push({
  amount: pd.amount.toFixed(2),
  date:   new Date().toLocaleString("en-US",{ timeZone:"Asia/kolkata" }),
  wallet: pd.wallet,
  type:   "referral"
});
Bot.setProperty(whKey, whArr, "json");

// 5) Compute updated stats for messages
const withdrawnTotal = whArr
  .filter(e => e.type === "referral")
  .reduce((sum,e) => sum + parseFloat(e.amount), 0)
  .toFixed(2);

const available = Libs.ResourcesLib
  .anotherUserRes("refCommission", uid)
  .value()
  .toFixed(2);

// Fetch referral stats for the channel alert
const refListKey = "referralList_" + uid;
let refList = JSON.parse(Bot.getProperty(refListKey) || "[]");
const refCount = refList.length; // Use the length of the referral list for total referrals
const totalDep   = Libs.ResourcesLib.anotherUserRes("refDepositTotal", uid).value()   || 0;
const totalEarn  = Libs.ResourcesLib.anotherUserRes("totalRefCommission", uid).value()|| 0;

// 6) Build & send the **admin** confirmation panel
const first = Bot.getProperty("firstName_" + uid) || "";
const last  = Bot.getProperty("lastName_"  + uid) || "";
const uname = Bot.getProperty("username_"  + uid) || "";
const full  = (first + " " + last).trim() || "User";
const mention = `<a href="tg://user?id=${uid}">${full}</a>` +
                (uname ? ` (@${uname})` : "");

const adminText =
  "✅ <b>Referral Withdrawal Approved!</b>\n\n" +
  `👤 User: ${mention}\n` +
  `🆔 ID: <code>${uid}</code>\n` +
  `💸 Amount Paid: <b>${pd.amount.toFixed(2)} USDT</b>\n` +
  `🏦 Wallet: <code>${pd.wallet}</code>\n\n` +
  `<b>🏧 Total Referral Withdrawn:</b> ${withdrawnTotal} USDT\n` +
  `<b>🏦 Available Referral Balance:</b> ${available} USDT\n\n`;

const adminId = Bot.getProperty("admin");
if (adminId) Api.sendMessage({ chat_id:adminId, text:adminText, parse_mode:"html" });

// 7) Notify the **user** with their own updated stats
Bot.sendMessageToChatWithId(uid,
  `<b>✅ Your referral withdrawal of ${pd.amount.toFixed(2)} USDT is complete!</b>\n\n` +
  `🏦 Wallet: <code>${pd.wallet}</code>\n` +
  `🏧 Available Balance: <b>${available} USDT</b>`,
  { 
    parse_mode: "html",
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "View My Transaction Id 🆔", url: "https://t.me/+YpV_YeXoM1U3ZDRl" }
        ]
      ]
    }
  }
);

// 8) Send detailed alert to @FutureComboBot_Stats
let txidLine = "";
if (custom && custom.toLowerCase() !== "skip") {
  txidLine = `🔗 Transaction ID: <a href="https://bscscan.com/tx/${custom}"><b>${custom}</b></a>\n`;
}

const channelText =
  "<b>✅ Referral Commission Withdrawal Completed!</b>\n\n" +
  `👨‍💻 User: ${full}\n` +
  `💳 Payment Method: USDT (BEP20)\n` +
  `📤 Withdrawn Amount: <b>${pd.amount.toFixed(2)} USDT</b>\n` +
  txidLine +
  `<b>🏆 Team Commission Rates:</b>\n` +
  `<b>👤 Level 1:</b> 8%\n` +
  `<b>👥 Level 2:</b> 3%\n` +
  `<b>👨‍👨‍👦 Level 3:</b> 1%\n\n` +
  `<b>🎉 Keep referring and keep earning — there’s no limit!</b>`;

const keyboard = [
  [ { text: "📊 Start Future Combo Bot", url: "https://t.me/FutureComboBot" } ],
  [ { text: "💎 FREE VIP ACCESS - JOIN NOW🚀", url: "https://t.me/+-o0a1X684v5hMzc9" } ]
];

Api.sendMessage({
  chat_id: "@FutureComboBot_Stats",
  text: channelText,
  parse_mode: "html",
  disable_web_page_preview: true,
  reply_markup: { inline_keyboard: keyboard }
});
