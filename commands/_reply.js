/*CMD
  command: /reply
  help: 
  need_reply: true
  auto_retry_time: 
  folder: 
  answer: *📞 Send the reply*

  <<KEYBOARD

  KEYBOARD
  aliases: 
  group: 
CMD*/

var admin = Bot.getProperty("admin");
var users = user.telegramid;
var botLink = "@" + bot.name;

if (users === admin) {
  var replyID = Bot.getProperty("replyID");
  var replyText = message ? message : null;
  var userText = "<b>📞 Reply from Support Executive</b>\n\n";
  
  // Check if admin sent a photo
  if (request.photo && request.photo.length > 0) {
    var photoID = request.photo[request.photo.length - 1].file_id;
    var captionText = request.caption ? request.caption : "No message provided.";
    userText += "<b>👉 Reply:</b> <i>" + captionText + "</i>";

    var button = [
      [
        {
          text: "📞 Reply ",
          callback_data: "📞 Support"
        }
      ]
    ];

    Api.sendPhoto({
      chat_id: replyID,
      photo: photoID,
      caption: userText,
      parse_mode: "html",
      reply_markup: { inline_keyboard: button }
    });

    var adminText =
      "<b>📞 Reply sent to</b> <code>" +
      replyID +
      "</code>\n\n<b>👉 Reply (Photo):</b> <i>" +
      captionText +
      "</i>";

    Api.sendMessage({
      text: adminText,
      parse_mode: "html"
    });

  } else if (replyText) {
    userText += "<b>👉 Reply:</b> <i>" + replyText + "</i>";

    var button = [
      [
        {
          text: "📞 Reply ",
          callback_data: "📞 Support"
        }
      ]
    ];

    Api.sendMessage({
      chat_id: replyID,
      text: userText,
      reply_markup: { inline_keyboard: button },
      parse_mode: "html"
    });

    var adminText =
      "<b>📞 Reply sent to</b> <code>" +
      replyID +
      "</code>\n\n<b>👉 Reply:</b> <i>" +
      replyText +
      "</i>";

    Api.sendMessage({
      text: adminText,
      parse_mode: "html"
    });

  } else {
    Api.sendMessage({
      text: "<i>⚠️ Error: No message or photo found in your reply.</i>",
      parse_mode: "html"
    });
  }

} else {
  var notAdminText = "<i>⚠️ You're not the admin of " + botLink + ".</i>";

  Api.sendMessage({
    text: notAdminText,
    parse_mode: "html"
  });
}
