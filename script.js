/* script.js */

const tg = window.Telegram.WebApp;

// Инициализация
tg.ready();
tg.expand(); // Растягиваем на весь экран

// Получение данных пользователя (имя, ID и т.д.)
// Если открыто не в телеграм, ставим заглушку
const user = tg.initDataUnsafe.user;
if (user) {
    document.getElementById('userName').innerText = user.first_name || 'Pilot';
} else {
    document.getElementById('userName').innerText = 'Ghost Pilot';
}

// --- ЛОГИКА КНОПОК ---

// 1. Кнопка "Подключиться"
function showConnectInfo() {
    // Вибрация (тактильный отклик)
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
    
    tg.showPopup({
        title: 'Получение ключа',
        message: 'Хотите получить файл конфигурации и ключ в чат?',
        buttons: [
            {id: 'get_key', type: 'default', text: 'Да, пришлите'},
            {type: 'cancel', text: 'Отмена'}
        ]
    }, function(btnId) {
        if (btnId === 'get_key') {
            // Отправляем данные боту
            tg.sendData(JSON.stringify({action: 'get_config'}));
            // Можно закрыть окно после отправки, если нужно:
            // tg.close();
        }
    });
}

// 2. Кнопка "Продлить подписку"
function extendSub() {
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    
    // Отправляем сигнал боту
    tg.sendData(JSON.stringify({action: 'extend_subscription'}));
}

// 3. Дополнительные кнопки (YouTube, Скорость, Бонусы и т.д.)
function openFeature(featureName) {
    if (tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
    
    // Здесь пока просто показываем алерт, позже можно настроить
    tg.showAlert(`Функция "${featureName}" скоро будет доступна!`);
}

function openHelp() {
    if (tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
    // Замени на ссылку на своего саппорта или канал
    tg.openLink('https://t.me/YOUR_SUPPORT_CONTACT');
}