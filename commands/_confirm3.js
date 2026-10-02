/*CMD
  command: /confirm3
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

//command: confirm3
if (!content) {return}
var bal  = Libs.ResourcesLib.userRes("balance");
var prof = Libs.ResourcesLib.userRes("minerProfitBalance");
var amt = parseFloat(params)

var result;
try {
    result = JSON.parse(content);
} catch (e) {
    Bot.sendMessage("Invalid data received. Please try again.");
    return;
}

if (result.data.track_id) {
    // Safety check (no deduction, just verify non-negative)
    if (amt > bal.value() || amt > prof.value()) {
        Bot.sendMessage("⚠️ Insufficient balance to complete withdrawal. Please contact support.");
        return;
    }

    // Load pending data for merging details
    var rawPd = Bot.getProperty("pendingWithdrawal_" + user.telegramid);
    var pd = {};
    if (typeof rawPd === "string") {
        try { pd = JSON.parse(rawPd); } catch(e) { pd = {}; }
    } else if (typeof rawPd === "object" && rawPd) {
        pd = rawPd;
    }

    Api.sendMessage({
        text:
            "<b>⁉️ Your withdrawal is processing…</b>\n\n" +
            "💸 <b>Amount:</b> <code>" + (pd.amount || amt || parseFloat(result.amount) || 0).toFixed(2) + " " + (pd.currency || result.currency || "USDT") + "</code>\n" +
            "🗂️ <b>Address:</b> <code>" + (pd.wallet || result.address || User.getProperty("wallet")) + "</code>",
        parse_mode: "html"
    });
    
} else {
    Bot.sendMessage(result.message);
}
