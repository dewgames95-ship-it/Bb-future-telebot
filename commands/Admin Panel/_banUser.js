/*CMD
  command: /banUser
  help: 
  need_reply: true
  auto_retry_time: 
  folder: Admin Panel
  answer: *🚫 Send user's telegram id whom you want to ban*

  <<KEYBOARD

  KEYBOARD
  aliases: 
  group: 
CMD*/

var admin = Bot.getProperty("admin");
var users = user.telegramid;
var botLink = "@" + bot.name;

// भाषा-विशिष्ट डेटा
var banUserLangData = {
  "EN": {
    notNumber: "<i>⚠️ Send only user's telegram id.</i>",
    adminBanned: "<b>🆔 User with telegram id</b> <code>{banID}</code> <b>is banned 🚫.</b>",
    userBanned: "<i>You're not  agree by the bot to not meet certain criteria.</i>",
    notAdmin: "<i>⚠️ You're not the admin of {botLink}.</i>"
  },
  "IT": {
    notNumber: "<i>⚠️ Invia solo l'ID telegram dell'utente.</i>",
    adminBanned: "<b>🆔 L'utente con l'ID telegram</b> <code>{banID}</code> <b>è stato bannato 🚫.</b>",
    userBanned: "<i>🚫 Sei stato bannato dall'admin.</i>",
    notAdmin: "<i>⚠️ Non sei l'amministratore di {botLink}.</i>"
  },
  "ES": {
    notNumber: "<i>⚠️ Envía solo el ID de Telegram del usuario.</i>",
    adminBanned: "<b>🆔 El usuario con el ID de Telegram</b> <code>{banID}</code> <b>ha sido baneado 🚫.</b>",
    userBanned: "<i>🚫 Has sido baneado por el administrador.</i>",
    notAdmin: "<i>⚠️ No eres el administrador de {botLink}.</i>"
  },
  "PT": {
    notNumber: "<i>⚠️ Envie apenas o ID do Telegram do usuário.</i>",
    adminBanned: "<b>🆔 O usuário com o ID do Telegram</b> <code>{banID}</code> <b>foi banido 🚫.</b>",
    userBanned: "<i>🚫 Você foi banido pelo administrador.</i>",
    notAdmin: "<i>⚠️ Você não é o administrador de {botLink}.</i>"
  },
  "DE": {
    notNumber: "<i>⚠️ Sende nur die Telegram-ID des Benutzers.</i>",
    adminBanned: "<b>🆔 Benutzer mit der Telegram-ID</b> <code>{banID}</code> <b>wurde gesperrt 🚫.</b>",
    userBanned: "<i>🚫 Du wurdest vom Administrator gesperrt.</i>",
    notAdmin: "<i>⚠️ Du bist nicht der Administrator von {botLink}.</i>"
  },
  "FR": {
    notNumber: "<i>⚠️ Envoyez uniquement l'ID Telegram de l'utilisateur.</i>",
    adminBanned: "<b>🆔 L'utilisateur avec l'ID Telegram</b> <code>{banID}</code> <b>a été banni 🚫.</b>",
    userBanned: "<i>🚫 Vous avez été banni par l'administrateur.</i>",
    notAdmin: "<i>⚠️ Vous n'êtes pas l'administrateur de {botLink}.</i>"
  },
  "RU": {
    notNumber: "<i>⚠️ Отправьте только Telegram ID пользователя.</i>",
    adminBanned: "<b>🆔 Пользователь с Telegram ID</b> <code>{banID}</code> <b>забанен 🚫.</b>",
    userBanned: "<i>🚫 Вы забанены администратором.</i>",
    notAdmin: "<i>⚠️ Вы не администратор {botLink}.</i>"
  },
  "ZH": {
    notNumber: "<i>⚠️ 仅发送用户的 Telegram ID。</i>",
    adminBanned: "<b>🆔 Telegram ID为</b> <code>{banID}</code> <b>的用户已被禁止 🚫。</b>",
    userBanned: "<i>🚫 你已被管理员禁止。</i>",
    notAdmin: "<i>⚠️ 你不是 {botLink} 的管理员。</i>"
  },
  "HI": {
    notNumber: "<i>⚠️ कृपया केवल उपयोगकर्ता का Telegram ID भेजें।</i>",
    adminBanned: "<b>🆔 Telegram ID वाले उपयोगकर्ता</b> <code>{banID}</code> <b>को प्रतिबंधित कर दिया गया है 🚫।</b>",
    userBanned: "<i>🚫 आपको एडमिन द्वारा प्रतिबंधित कर दिया गया है।</i>",
    notAdmin: "<i>⚠️ आप {botLink} के एडमिन नहीं हैं।</i>"
  },
  "UR": {
    notNumber: "<i>⚠️ براہ کرم صرف صارف کا Telegram ID بھیجیں۔</i>",
    adminBanned: "<b>🆔 Telegram ID والا صارف</b> <code>{banID}</code> <b>پابندی لگا دی گئی ہے 🚫۔</b>",
    userBanned: "<i>🚫 آپ کو ایڈمن نے پابندی لگا دی ہے۔</i>",
    notAdmin: "<i>⚠️ آپ {botLink} کے ایڈمن نہیں ہیں۔</i>"
  },
  "BN": {
    notNumber: "<i>⚠️ শুধুমাত্র ব্যবহারকারীর Telegram ID পাঠান।</i>",
    adminBanned: "<b>🆔 Telegram ID সহ ব্যবহারকারী</b> <code>{banID}</code> <b>ব্যান করা হয়েছে 🚫।</b>",
    userBanned: "<i>🚫 আপনাকে অ্যাডমিন দ্বারা ব্যান করা হয়েছে।</i>",
    notAdmin: "<i>⚠️ আপনি {botLink} এর অ্যাডমিন নন।</i>"
  },
  "AR": {
    notNumber: "<i>⚠️ أرسل فقط معرف Telegram للمستخدم.</i>",
    adminBanned: "<b>🆔 المستخدم ذو معرف Telegram</b> <code>{banID}</code> <b>تم حظره 🚫.</b>",
    userBanned: "<i>🚫 لقد تم حظرك من قبل المسؤول.</i>",
    notAdmin: "<i>⚠️ أنت لست المسؤول عن {botLink}.</i>"
  },
  "TR": {
    notNumber: "<i>⚠️ Lütfen sadece kullanıcının Telegram ID'sini gönderin.</i>",
    adminBanned: "<b>🆔 Telegram ID'si</b> <code>{banID}</code> <b>olan kullanıcı yasaklandı 🚫.</b>",
    userBanned: "<i>🚫 Yönetici tarafından yasaklandınız.</i>",
    notAdmin: "<i>⚠️ {botLink} yönetici değilsiniz.</i>"
  },
  "KO": {
    notNumber: "<i>⚠️ 사용자 Telegram ID만 보내세요.</i>",
    adminBanned: "<b>🆔 Telegram ID가</b> <code>{banID}</code> <b>인 사용자가 차단되었습니다 🚫.</b>",
    userBanned: "<i>🚫 관리자에 의해 차단되었습니다.</i>",
    notAdmin: "<i>⚠️ 당신은 {botLink}의 관리자가 아닙니다.</i>"
  },
  "FIL": {
    notNumber: "<i>⚠️ Magpadala lamang ng Telegram ID ng user.</i>",
    adminBanned: "<b>🆔 User na may Telegram ID</b> <code>{banID}</code> <b>ay na-ban 🚫.</b>",
    userBanned: "<i>🚫 Na-ban ka ng admin.</i>",
    notAdmin: "<i>⚠️ Hindi ka admin ng {botLink}.</i>"
  },
  "JA": {
    notNumber: "<i>⚠️ ユーザーのTelegram IDのみを送信してください。</i>",
    adminBanned: "<b>🆔 Telegram IDが</b> <code>{banID}</code> <b>のユーザーは禁止されました 🚫。</b>",
    userBanned: "<i>🚫 管理者により禁止されました。</i>",
    notAdmin: "<i>⚠️ あなたは {botLink} の管理者ではありません。</i>"
  }
};

var userLang = User.getProperty("Language");
if (!userLang) {
  userLang = "EN";
}
var lang = banUserLangData[userLang] || banUserLangData["EN"];

if (users === admin) {
  function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  var banID = message;

  if (!isNumeric(banID)) {
    var notNumberText = lang.notNumber;
    Api.sendMessage({
      text: notNumberText,
      parse_mode: "html"
    });
    Bot.runCommand("/banUser");
    return;
  }

  Bot.setProperty(banID, "Ban");

  var adminText = lang.adminBanned.replace("{banID}", banID);
  Api.sendMessage({
    text: adminText,
    parse_mode: "html"
  });

  var userText = lang.userBanned;
  Api.sendMessage({
    chat_id: banID,
    text: userText,
    parse_mode: "html"
  });
} else {
  var notAdminText = lang.notAdmin.replace("{botLink}", botLink);
  Api.sendMessage({
    text: notAdminText,
    parse_mode: "html"
  });
}
