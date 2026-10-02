/*CMD
  command: /messageid1
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

//command. /messageid
try {
  var messageid = options.result.message_id;
  let requestMessageId = null;
  if (params) {
    User.setProp("msg_id", messageid);
    return;
  }
  if (request.message_id) {
    requestMessageId = request.message_id;
  }
  if (request.data) {
    messageid = request.message.message_id;
  }

  var requestMessage = User.getProp("request_msg_id");
  var resultMessage = User.getProp("result_msg_id");

  if (requestMessage && resultMessage) {
    Api.deleteMessage({
      message_id: requestMessage
    });
    User.setProp("request_msg_id", null);
    User.setProp("request_msg_id", requestMessageId, "string");
    Api.deleteMessage({
      message_id: resultMessage
    });
    User.setProp("result_msg_id", null);
    User.setProp("result_msg_id", messageid, "string");
    return;
  }
  User.setProp("result_msg_id", messageid, "string");
  User.setProp("request_msg_id", requestMessageId, "string");
} catch (e) {
  User.setProp("result_msg_id", null);
  User.setProp("request_msg_id", null);
}
