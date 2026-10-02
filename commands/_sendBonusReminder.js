/*CMD
  command: /sendBonusReminder
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

// /* command: /sendBonusReminder */
/*––––––[ Ban Check ]––––––*/
var ban = Bot.getProperty(user.telegramid);
if (ban === "Ban") {
  return; // Exit silently for banned users
}

// Define the reminder messages with proper formatting
var reminders = [
  {
    message: "<b>🎁 $10 USDT Gift – Just for YOU!</b>\n\n" +
             "<i>💼 No hidden terms.</i>\n" +
             "<i>📤 Profits can be fully withdrawn anytime.</i>\n" +
             "<b>⏰ Limited-time reward — Claim Before It’s Gone!</b>\n\n" +
             "💰 Your investment journey just got easier!",
    image: "https://ibb.co/C3jsc9cC",
    buttons: [{ text: "Join To See Members Profit 🤑", url: "https://t.me/FutureComboBotGroup" }],
    delay: 12 * 60 * 60 // 12 hours
  },
  {
    message: "<b>🎉 Claim Your FREE $10 Bonus NOW!</b>\n\n" +
             "<i>🚀 Start your crypto journey with a head start</i>\n" +
             "<i>💸 No deposit, no conditions — 100% withdrawable profit!</i>\n\n" +
             "<b>🎯 Don’t wait — opportunity like this won’t last!</b>",
    image: "https://ibb.co/Ps4HFMSt",
    buttons: [{ text: "Check My Balance 👉", callback_data: "/mybalance" }],
    delay: 48 * 60 * 60 // 48 hours
  },
  {
    message: "<b>🎁 Claim Your FREE $10 Bonus Now!</b>\n\n" +
             "<i>Start earning with a head start — no conditions, profits are 100% withdrawable 💸</i>\n\n" +
             "<b>🚀 How to Claim:</b>\n\n" +
             "<b>🔹 Step 1: Deposit $30 to unlock VIP 1</b>\n" +
             "➡️ You’ll start earning $1 daily profit (withdrawable anytime)\n\n" +
             "<b>🔹 Step 2: Once VIP 1 is activated,</b>\n" +
             "<i>🎁 $10 Bonus is auto-credited to your main balance</i>\n\n" +
             "<b>🔹 Step 3: Later, you’ll deposit $20 more and use it with your bonus:</b>\n" +
             "<i>💥 $20 + $10 Bonus = $30 to unlock VIP 1 again!</i>\n\n" +
             "<b>🎯 Don’t miss out — tap below to claim your $10!</b>",
    image: "https://ibb.co/MkbJM6Q1",
    buttons: [
      { text: "Start ⚡️", callback_data: "/mainMenu" },
      { text: "See Others Profit 🤑", url: "https://t.me/FutureComboBotGroup" }
    ],
    delay: 72 * 60 * 60 // 72 hours
  },
  {
    message: "<b>🌟 Start Smart with a FREE $10 Bonus!</b>\n\n" +
             "<i>💥 Join thousands already earning</i>\n" +
             "<i>✅ No strings attached</i>\n" +
             "<i>💳 100% Withdrawable Profits</i>\n\n" +
             "<b>🎬 Tap to activate your bonus — only once available!</b>",
    image: "https://ibb.co/LX5BHXXr",
    buttons: [{ text: "Activate ✅", callback_data: "/vipplans" }],
    delay: 96 * 60 * 60 // 4 days (96 hours)
  }
];

// Get the current reminder index
var reminderIndex = Number(User.getProperty("reminderIndex") || 0);
if (reminderIndex >= reminders.length) {
  return; // Exit if all reminders have been sent
}

// Check if the user has purchased any VIP plans
var historyString = User.getProperty("miningHistory");
var miningHistory = [];
if (historyString) {
  try {
    miningHistory = JSON.parse(historyString);
  } catch (e) {
    miningHistory = [];
  }
}

// Only proceed if no VIP plans are active
if (miningHistory.length === 0) {
  var reminder = reminders[reminderIndex];
  
  // Send the reminder with image and inline buttons
  Api.sendPhoto({
    photo: reminder.image,
    caption: reminder.message,
    parse_mode: "html",
    reply_markup: { inline_keyboard: [reminder.buttons] }
  });

  // Schedule the next reminder
  if (reminderIndex + 1 < reminders.length) {
    Bot.run({
      command: "/sendBonusReminder",
      run_after: reminders[reminderIndex + 1].delay // Use the next reminder's delay
    });
  }

  // Increment the reminder index
  User.setProperty("reminderIndex", reminderIndex + 1, "integer");
}
