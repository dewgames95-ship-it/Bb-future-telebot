/*CMD
  command: /ping
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

if (options) {
  const start = User.getProp("start");
  const latency = Date.now() - start;

  Bot.editMessage(`Pong! Latency: ${latency}ms`, options.result.message_id);
  return;
}

const start = Date.now();

User.setProp("start", start, "integer");

Api.sendMessage({
  text: "Pinging.....",
  on_result: "/ping"
});

