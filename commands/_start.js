/*CMD
  command: /start
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

// command: /start
// Persist this user’s name for later alerts
Bot.setProperty("firstName_" + user.telegramid, user.first_name, "string");
Bot.setProperty("lastName_"  + user.telegramid, user.last_name   || "",   "string");
Bot.setProperty("username_" + user.telegramid, user.username || "None", "string");

var broadcast = Bot.getProperty("Broadcast") || [];
if (!broadcast.includes(user.telegramid)) {
  broadcast.push(user.telegramid);
  Bot.setProperty("Broadcast", broadcast, "json");
}

function doTouchOwnLink() {
  Api.sendMessage({ text: "<i>⚠️ Oops! You can't invite yourself. Share your invite link with others to earn rewards!</i>", parse_mode: "html" });
}
function doAttracted(refUser) {
  Api.sendMessage({ chat_id: refUser.telegramid, text:
      "<b>👬 New Referral!</b>\n" +
      "🎉 <b>A new user joined through your invite link:</b> User ID: <code>" +
      user.telegramid + "</code>",
    parse_mode: "html"
  });
}
function doAlreadyAttracted() {
  Api.sendMessage({ text: "<i>⚠️ You’ve already started exploring " + "@" + bot.name + ". Keep going!</i>", parse_mode: "html" });
}

Libs.ReferralLib.track({
  onTouchOwnLink: doTouchOwnLink,
  onAttracted:     doAttracted,
  onAlreadyAttracted: doAlreadyAttracted
});

var newUser = User.getProperty("newUser");
if (!newUser) {
  User.setProperty("newUser", "Yes", "string");

  var admin    = Bot.getProperty("admin");
  var userName = user.first_name;
  var username = "@" + (user.username || "");
  var userID   = user.telegramid;
  var userLink = "<a href='tg://user?id=" + userID + "'>" + userName + "</a>";
  var status   = Libs.ResourcesLib.anotherChatRes("status", "global");
  status.add(1);

  var adminText =
    "<b>🎉 New User Alert! 🎉</b>\n\n" +
    "👤 <b>Name:</b> "     + userName  + "\n" +
    "📧 <b>Username:</b> " + username  + "\n" +
    "🔗 <b>User Link:</b> " + userLink + "\n" +
    "🆔 <b>User ID:</b> <code>" + userID + "</code>\n\n" +
    "📊 <b>Total Users:</b> <code>" + status.value() + "</code>";

  // Add referrer details if exists, traversing up the chain
  let refUser = Libs.ReferralLib.getAttractedBy();
  if (refUser) {
    let currentReferrer = refUser.telegramid;
    let level = 1;
    const rates = {1: 8, 2: 3, 3: 1};
    while (currentReferrer && level <= 3) {
      let refFirst = Bot.getProperty("firstName_" + currentReferrer) || "Unknown";
      let refLast = Bot.getProperty("lastName_" + currentReferrer) || "";
      let refUsername;
      if (level === 1) {
        refUsername = refUser.username ? "@" + refUser.username : "None";
      } else {
        let storedUsername = Bot.getProperty("username_" + currentReferrer) || "None";
        refUsername = (storedUsername !== "None") ? "@" + storedUsername : "None";
      }
      let refNameLink = "<a href='tg://user?id=" + currentReferrer + "'>" + refFirst + (refLast ? " " + refLast : "") + "</a>";
      adminText += "\n🧑‍💻Reffered By: " + refNameLink + "\nUsername: " + refUsername + "\n🆔:" + currentReferrer + "\nRefer level: " + level + " (" + rates[level] + "%)";
      currentReferrer = Bot.getProperty("referrer_" + currentReferrer);
      level++;
    }
  }

  Api.sendMessage({ chat_id: admin, text: adminText, parse_mode: "html" });
}

// ✅ Force join removed — start ke baad seedha main menu
Bot.runCommand("/mainMenu");
