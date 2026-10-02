/*CMD
  command: /onDepositSent
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

// Command: /onDepositSent
if (!options.result) { return; }
let msg = options.result;
let mid = msg.message_id;
let cid = msg.chat.id;
let tempData = Bot.getProperty("tempDepositData_" + user.telegramid);
if (!tempData) { return; }
Bot.setProperty("lastDeposit_" + user.telegramid, {
  message_id: mid,
  chat_id: cid,
  expiredAt: tempData.expiredAt,
  address: tempData.address,
  currency: tempData.currency,
  network: tempData.network,
  payAmount: tempData.payAmount,
  payCurrency: tempData.payCurrency
}, "json");
Bot.setProperty("tempDepositData_" + user.telegramid, null);
