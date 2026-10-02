/*CMD
  command: /vipinfo_batch
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

/* command: /vipinfo_batch */

var start = options.start;
var batchSize = 60; // Safe batch size: 60 users * 3 properties = 180 reads < 200 limit
var broadcast = Bot.getProperty("Broadcast") || [];
var end = Math.min(start + batchSize, broadcast.length);

if (start >= broadcast.length) {
  // Should not happen, but safety
  return;
}

// Get current stats
var statsString = Bot.getProperty("vipinfo_stats_temp", "{}");
var stats = {};
try {
  stats = JSON.parse(statsString);
} catch (e) {
  stats = {
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
}

// Slice users for this batch
var batchUsers = broadcast.slice(start, end);

// Cache properties for batch users
var userDataCache = {};
batchUsers.forEach(function(user_id) {
  userDataCache[user_id] = {
    miningHistory: Bot.getProperty("miningHistory_" + user_id, "[]"),
    referralList: Bot.getProperty("referralList_" + user_id, "[]"),
    referrer: Bot.getProperty("referrer_" + user_id, null)
  };
});

// Process the batch
batchUsers.forEach(function(user_id) {
  var userData = userDataCache[user_id];
  
  // Parse mining history
  var miningHistory = [];
  try {
    miningHistory = JSON.parse(userData.miningHistory);
    if (!Array.isArray(miningHistory)) {
      miningHistory = [];
    }
  } catch (e) {
    miningHistory = [];
  }
  
  // Filter active plans
  var now = Date.now();
  var activePlans = miningHistory.filter(function(record) {
    var purchaseTime = record.purchaseTimestamp || 0;
    var expirationTime = purchaseTime + (record.expirationDays || 0) * 86400000;
    return now < expirationTime;
  });
  
  // Determine active VIP levels
  var activeVIPLevels = [];
  activePlans.forEach(function(record) {
    var match = (record.planName || "").match(/VIP (\d+)/);
    if (match) {
      var level = parseInt(match[1]);
      if (!activeVIPLevels.includes(level)) {
        activeVIPLevels.push(level);
      }
    }
  });
  
  // Update user overview
  if (activeVIPLevels.length > 0) {
    stats.activeVIPUsers++;
    if (activeVIPLevels.length > 1) {
      stats.multipleVIPUsers++;
    } else {
      stats.singleVIPUsers++;
    }
  } else {
    stats.noVIPUsers++;
  }
  
  // Update VIP plan distribution
  for (var i = 1; i <= 6; i++) {
    if (activeVIPLevels.includes(i)) {
      stats.vipTotal[i]++;
      if (activeVIPLevels.length == 1) {
        stats.vipOnly[i]++;
      } else {
        stats.vipWithOthers[i]++;
      }
    }
  }
  
  // Update referral summary
  var refList = [];
  try {
    refList = JSON.parse(userData.referralList);
    if (!Array.isArray(refList)) {
      refList = [];
    }
  } catch (e) {
    refList = [];
  }
  
  var refCount = refList.length;
  if (refCount >= 1) {
    stats.referredAtLeastOne++;
  }
  if (refCount > 1) {
    stats.referredMoreThanOne++;
  }
  if (refCount > 2) {
    stats.referredMoreThanTwo++;
  }
  
  // Check for referral-based VIP signups
  if (userData.referrer && activeVIPLevels.length > 0) {
    stats.referralVIPSignups++;
  }
});

// Save updated stats
Bot.setProperty("vipinfo_stats_temp", JSON.stringify(stats), "string");

// If this is the last batch, build and send the message
if (end >= broadcast.length) {
  // Define emojis
  var vipEmojis = {
    1: "🔹",
    2: "🔸",
    3: "🔹",
    4: "🚀",
    5: "💠",
    6: "💎"
  };

  // Build the formatted message
  var text = "🌐 <b>VIP Plan Distribution</b>\n\n";
  for (var i = 1; i <= 6; i++) {
    text += vipEmojis[i] + " VIP " + i + "\n";
    text += "• Total Users: " + stats.vipTotal[i] + "\n";
    text += "• Only VIP " + i + ": " + stats.vipOnly[i] + "\n";
    text += "• With Other VIPs: " + stats.vipWithOthers[i] + "\n\n";
  }

  text += "🌐 <b>Global VIP Stats</b>\n\n";
  for (var i = 1; i <= 6; i++) {
    text += vipEmojis[i] + " VIP " + i + " – " + stats.vipTotal[i] + " users\n";
  }

  text += "\n👥 <b>User Overview</b>\n\n";
  text += "👤 Total Registered Users: " + stats.totalUsers + "\n";
  text += "📊 Active VIP Users: " + stats.activeVIPUsers + "\n";
  text += "🧍‍♂️ Users with No VIP Plan: " + stats.noVIPUsers + "\n";
  text += "💎 Users with Multiple VIP Plans: " + stats.multipleVIPUsers + "\n";
  text += "👥 Users Holding Only One VIP Plan: " + stats.singleVIPUsers + "\n\n";

  text += "🎯 <b>Referral Summary</b>\n\n";
  text += "🧑‍💼 Users Who Referred At Least 1: " + stats.referredAtLeastOne + "\n";
  text += "🏆 Users Who Referred More Than 1: " + stats.referredMoreThanOne + "\n";
  text += "✅ Users Who Referred More Than 2: " + stats.referredMoreThanTwo + "\n";
  text += "📈 Referral-Based VIP Signups: " + stats.referralVIPSignups + " users";

  // Get admin ID and send
  var adminId = Bot.getProperty("vipinfo_admin_id");
  Api.sendMessage({
    chat_id: adminId,
    text: text,
    parse_mode: "html"
  });

  // Clear temp properties
  Bot.setProperty("vipinfo_stats_temp", null);
  Bot.setProperty("vipinfo_admin_id", null);
} else {
  // Run next batch
  Bot.run({ command: "/vipinfo_batch", options: { start: end } });
}
