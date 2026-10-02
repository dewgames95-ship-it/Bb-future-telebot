/*CMD
  command: /setMaintenanceStatus
  help: 
  need_reply: true
  auto_retry_time: 
  folder: Admin Panel

  <<ANSWER
*🛠️ Send the mode which you want to set as maintenance status from the options below 👇

👉 Options :* `On` */* `Off`
  ANSWER

  <<KEYBOARD

  KEYBOARD
  aliases: 
  group: 
CMD*/

// command : /setMaintenanceStatus
var maintenanceStatusLangData = {
  "EN": {
    maintenanceSet: "<b>🛠️ Maintenance status set to :</b> <code>{maintenance}</code>",
    sendOnly: "<i>⚠️ Send only</i> <code>On</code> <i>or</i> <code>Off</code>.",
    notAdmin: "<i>⚠️ You're not the admin of {botLink}.</i>"
  },
  "IT": {
    maintenanceSet: "<b>🛠️ Stato di manutenzione impostato su :</b> <code>{maintenance}</code>",
    sendOnly: "<i>⚠️ Invia solo</i> <code>On</code> <i>o</i> <code>Off</code>.",
    notAdmin: "<i>⚠️ Non sei l'amministratore di {botLink}.</i>"
  },
  "ES": {
    maintenanceSet: "<b>🛠️ Estado de mantenimiento configurado a :</b> <code>{maintenance}</code>",
    sendOnly: "<i>⚠️ Envía solo</i> <code>On</code> <i>o</i> <code>Off</code>.",
    notAdmin: "<i>⚠️ No eres el administrador de {botLink}.</i>"
  },
  "PT": {
    maintenanceSet: "<b>🛠️ Status de manutenção definido para :</b> <code>{maintenance}</code>",
    sendOnly: "<i>⚠️ Envie apenas</i> <code>On</code> <i>ou</i> <code>Off</code>.",
    notAdmin: "<i>⚠️ Você não é o administrador de {botLink}.</i>"
  },
  "DE": {
    maintenanceSet: "<b>🛠️ Wartungsstatus gesetzt auf :</b> <code>{maintenance}</code>",
    sendOnly: "<i>⚠️ Sende nur</i> <code>On</code> <i>oder</i> <code>Off</code>.",
    notAdmin: "<i>⚠️ Du bist nicht der Administrator von {botLink}.</i>"
  },
  "FR": {
    maintenanceSet: "<b>🛠️ Statut de maintenance défini sur :</b> <code>{maintenance}</code>",
    sendOnly: "<i>⚠️ Envoyez uniquement</i> <code>On</code> <i>ou</i> <code>Off</code>.",
    notAdmin: "<i>⚠️ Vous n'êtes pas l'administrateur de {botLink}.</i>"
  },
  "RU": {
    maintenanceSet: "<b>🛠️ Статус обслуживания установлен на :</b> <code>{maintenance}</code>",
    sendOnly: "<i>⚠️ Отправьте только</i> <code>On</code> <i>или</i> <code>Off</code>.",
    notAdmin: "<i>⚠️ Вы не администратор {botLink}.</i>"
  },
  "ZH": {
    maintenanceSet: "<b>🛠️ 维护状态设置为：</b> <code>{maintenance}</code>",
    sendOnly: "<i>⚠️ 仅发送</i> <code>On</code> <i>或</i> <code>Off</code>.",
    notAdmin: "<i>⚠️ 您不是 {botLink} 的管理员。</i>"
  },
  "HI": {
    maintenanceSet: "<b>🛠️ मेंटेनेंस स्टेटस सेट किया गया है :</b> <code>{maintenance}</code>",
    sendOnly: "<i>⚠️ कृपया केवल</i> <code>On</code> <i>या</i> <code>Off</code> <i>भेजें।</i>",
    notAdmin: "<i>⚠️ आप {botLink} के एडमिन नहीं हैं।</i>"
  },
  "UR": {
    maintenanceSet: "<b>🛠️ مینٹیننس اسٹیٹس سیٹ کیا گیا ہے :</b> <code>{maintenance}</code>",
    sendOnly: "<i>⚠️ براہ کرم صرف</i> <code>On</code> <i>یا</i> <code>Off</code> <i>بھیجیں۔</i>",
    notAdmin: "<i>⚠️ آپ {botLink} کے ایڈمن نہیں ہیں۔</i>"
  },
  "BN": {
    maintenanceSet: "<b>🛠️ রক্ষণাবেক্ষণ স্থিতি সেট করা হয়েছে :</b> <code>{maintenance}</code>",
    sendOnly: "<i>⚠️ শুধুমাত্র</i> <code>On</code> <i>অথবা</i> <code>Off</code> <i>পাঠান।</i>",
    notAdmin: "<i>⚠️ আপনি {botLink} এর অ্যাডমিন নন।</i>"
  },
  "AR": {
    maintenanceSet: "<b>🛠️ تم تعيين حالة الصيانة إلى :</b> <code>{maintenance}</code>",
    sendOnly: "<i>⚠️ أرسل فقط</i> <code>On</code> <i>أو</i> <code>Off</code>.",
    notAdmin: "<i>⚠️ أنت لست المسؤول عن {botLink}.</i>"
  },
  "TR": {
    maintenanceSet: "<b>🛠️ Bakım durumu olarak ayarlandı :</b> <code>{maintenance}</code>",
    sendOnly: "<i>⚠️ Lütfen yalnızca</i> <code>On</code> <i>veya</i> <code>Off</code> <i>gönderin.</i>",
    notAdmin: "<i>⚠️ {botLink} yönetici değilsiniz.</i>"
  },
  "KO": {
    maintenanceSet: "<b>🛠️ 유지보수 상태가 설정되었습니다 :</b> <code>{maintenance}</code>",
    sendOnly: "<i>⚠️ <code>On</code> 또는 <code>Off</code>만 보내세요.</i>",
    notAdmin: "<i>⚠️ 당신은 {botLink}의 관리자가 아닙니다.</i>"
  },
  "FIL": {
    maintenanceSet: "<b>🛠️ Na-set ang maintenance status sa :</b> <code>{maintenance}</code>",
    sendOnly: "<i>⚠️ Magpadala lamang ng</i> <code>On</code> <i>o</i> <code>Off</code>.",
    notAdmin: "<i>⚠️ Hindi ka admin ng {botLink}.</i>"
  },
  "JA": {
    maintenanceSet: "<b>🛠️ メンテナンス状態が次のように設定されました :</b> <code>{maintenance}</code>",
    sendOnly: "<i>⚠️ <code>On</code> または <code>Off</code> のみを送信してください。</i>",
    notAdmin: "<i>⚠️ あなたは {botLink} の管理者ではありません。</i>"
  }
};

var admin = Bot.getProperty("admin");
var users = user.telegramid;
var botLink = "@" + bot.name;

var userLang = User.getProperty("Language");
if (!userLang) {
  userLang = "EN";
}
var lang = maintenanceStatusLangData[userLang] || maintenanceStatusLangData["EN"];

if (users === admin) {
  var maintenance = message;

  if (maintenance === "On" || maintenance === "Off") {
    Bot.setProperty("maintenanceStatus", maintenance, "string");

    var text = lang.maintenanceSet.replace("{maintenance}", maintenance);

    Api.sendMessage({
      text: text,
      parse_mode: "html"
    });

    Bot.runCommand("/adminPanel");
  } else {
    var notText = lang.sendOnly;
    Api.sendMessage({
      text: notText,
      parse_mode: "html"
    });

    Bot.runCommand("/setMaintenanceStatus");
  }
} else {
  var notAdminText = lang.notAdmin.replace("{botLink}", botLink);
  Api.sendMessage({
    text: notAdminText,
    parse_mode: "html"
  });
}
