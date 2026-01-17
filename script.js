/* script.js */

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand(); 

// ⚠️ СЮДА ПОТОМ ВСТАВИШЬ ДОМЕН ОТ RAILWAY (например https://app.railway.app/api/user)
// Пока оставь как есть, я скажу когда менять.
const API_BASE = "ПЛЕЙСХОЛДЕР_ДЛЯ_ДОМЕНА"; 

const user = tg.initDataUnsafe.user;

async function loadUserData() {
    if (!user) {
        document.getElementById('userName').innerText = 'Ghost Pilot';
        return;
    }
    document.getElementById('userName').innerText = user.first_name;

    // Если мы еще не поменяли домен в коде, не стучимся
    if (API_BASE.includes("ПЛЕЙСХОЛДЕР")) {
        console.log("Домен API еще не настроен");
        return;
    }

    try {
        const dateEl = document.getElementById('expiryDate');
        if(dateEl) dateEl.innerText = "Связь...";

        const response = await fetch(`${API_BASE}/${user.id}`);
        if (!response.ok) throw new Error("Network error");
        
        const data = await response.json();
        
        if (data.error) return;

        if (data.username) document.getElementById('userName').innerText = data.username;

        const expiryTimestamp = data.expiry;
        const now = Math.floor(Date.now() / 1000);
        
        // Дата
        let dateStr = "Не активна";
        if (expiryTimestamp > 0) {
            const dateObj = new Date(expiryTimestamp * 1000);
            dateStr = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
        }

        // Дни
        let daysLeft = Math.ceil((expiryTimestamp - now) / 86400);
        if (daysLeft < 0) daysLeft = 0;

        updateDashboard(dateStr, daysLeft, data.is_active);

    } catch (e) {
        console.error("Offline:", e);
    }
}

function updateDashboard(dateStr, daysLeft, isActive) {
    const dateEl = document.getElementById('expiryDate');
    const daysEl = document.getElementById('daysLeft');
    const statusEl = document.getElementById('statusBadge');

    if (dateEl) dateEl.innerText = dateStr;
    if (daysEl) daysEl.innerText = daysLeft + " дн.";

    if (isActive && daysLeft > 0) {
        statusEl.innerHTML = '<i class="fa-solid fa-check-circle"></i> Активна';
        statusEl.className = 'status-badge';
    } else {
        statusEl.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Истекла';
        statusEl.className = 'status-badge expired';
    }
}

loadUserData();

// --- КНОПКИ (СТАНДАРТНЫЕ) ---
function showConnectInfo() {
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
    tg.showPopup({
        title: 'Получение ключа',
        message: 'Прислать конфиг в чат?',
        buttons: [{id: 'yes', type: 'default', text: 'Да'}, {type: 'cancel', text: 'Нет'}]
    }, function(btnId) {
        if (btnId === 'yes') {
            tg.sendData(JSON.stringify({action: 'get_config'}));
            tg.close();
        }
    });
}

function extendSub() {
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    tg.sendData(JSON.stringify({action: 'extend_subscription'}));
}

function openFeature(name) { tg.showAlert(`Скоро: ${name}`); }
function openHelp() { tg.openLink('https://t.me/machnet'); }
