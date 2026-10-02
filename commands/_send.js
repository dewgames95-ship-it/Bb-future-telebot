/*CMD
  command: /send
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

// /sendPrivMsg – Send a private message to a user.
// Usage: /sendPrivMsg <userID> [message]
// This command supports sending a photo with an optional caption.
// The admin only needs to provide a User ID; any following text is used as the caption.
if (request.data) {
  params = request.data;
}

if (!params) {
  Api.sendMessage({ text: "<b>Please provide a User ID.</b>", parse_mode: "html" });
  return;
}

var parts = params.split(" ");
var targetId = parts.shift().trim();
var msg = parts.join(" "); // message may be empty

// Send photo with caption if a photo is attached; otherwise, send text message.
// This command does not enforce a message requirement.
if (request.photo && request.photo.length > 0) {
  var photo = request.photo[request.photo.length - 1].file_id;
  Api.sendPhoto({
    chat_id: targetId,
    photo: photo,
    caption: "<b>Message from Bot:</b>\n" + msg,
    parse_mode: "html"
  });
} else {
  Api.sendMessage({
    chat_id: targetId,
    text: "<b> Message from Bot 🤖 :</b>\n" + msg,
    parse_mode: "html"
  });
}

// Confirm to admin that the message was sent
Api.sendMessage({
  text: "<b>Message sent to user " + targetId + ".</b>",
  parse_mode: "html"
});
