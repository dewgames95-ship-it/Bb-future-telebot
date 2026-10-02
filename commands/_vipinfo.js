/*CMD
  command: /vipinfo
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

/* command: /vipinfo */

// Check if the user is the admin
var admin = Bot.getProperty("admin");
if (user.telegramid != admin) {
  Api.sendMessage({ text: "You are not authorized to use this command." });
  return;
}

// Get all user IDs
var broadcast = Bot.getProperty("Broadcast") || [];

// Initialize statistics
var stats = {
  vipTotal: {1:0, 2:0, 3:0, 4:0, 5:0, 6:0},
  vipOnly: {1:0, 2:0, 3:0, 4:0, 5:0, 6:0},
  vipWithOthers: {1:0, 2:0, 3:0, 4:0, 5:0, 6:0},
  activeVIPUsers: 0,
  noVIPUsers: 0,
  multipleVIPUsers: 0,
  singleVIPUsers: 0,
  referredAtLeastOne: 0,
  referredMoreThanOne: 0,
  referredMoreThanTwo: 0,
  referralVIPSignups: 0,
  totalUsers: broadcast.length
};

// Store initial stats and admin ID
Bot.setProperty("vipinfo_stats_temp", JSON.stringify(stats), "string");
Bot.setProperty("vipinfo_admin_id", user.telegramid, "integer");

// Start processing from batch 0
Bot.run({ command: "/vipinfo_batch", options: { start: 0 } });

// Send processing message
Api.sendMessage({ text: "🔄 Processing VIP and referral stats for all " + broadcast.length + " users... This may take a moment." });
