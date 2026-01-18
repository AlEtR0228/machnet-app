/* script.js */

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand(); 

// ⚠️ ЗАМЕНИ ЭТО НА ТВОЮ ССЫЛКУ ИЗ RAILWAY
// Она должна быть вида: https://xxxx-xxxx.up.railway.app/api/user
const API_BASE = "https://machnetbot-production.up.railway.app/api/user";

const user = tg.initDataUnsafe.user;
let globalAccessKey = ""; // Сюда сохраним ключ

// --- ЗАГРУЗКА ДАННЫХ ПРИ СТАРТЕ ---
async function loadUserData() {
    if (!user) {
        document.getElementById('userName').innerText = 'Ghost Pilot';
        return;
    }
    document.getElementById('userName').innerText = user.first_name;

    try {
        const dateEl = document.getElementById('expiryDate');
        if(dateEl) dateEl.innerText = "Связь...";

        // Запрос к боту
        const response = await fetch(`${API_BASE}/${user.id}`);
        
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            console.error("API Error:", data.error);
            return;
        }

        // 1. Сохраняем полученный ключ
        globalAccessKey = data.access_key || "";

        // 2. Обновляем Имя
        if (data.username) document.getElementById('userName').innerText = data.username;

        // 3. Считаем даты
        const now = Math.floor(Date.now() / 1000);
        let dateStr = "Не активна";
        let daysLeft = 0;

        if (data.expiry > 0) {
            const dateObj = new Date(data.expiry * 1000);
            dateStr = dateObj.toLocaleDateString('ru-RU', { 
                day: 'numeric', month: 'long', year: 'numeric' 
            });
            daysLeft = Math.ceil((data.expiry - now) / 86400);
            if (daysLeft < 0) daysLeft = 0;
        }

        // 4. Обновляем интерфейс
        updateDashboard(dateStr, daysLeft, data.is_active);

    } catch (e) {
        console.error("Offline / Error:", e);
        document.getElementById('expiryDate').innerText = "-";
        tg.showAlert("Ошибка связи с сервером. Проверьте интернет.");
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

// --- НОВАЯ ЛОГИКА КНОПКИ "ПОДКЛЮЧИТЬСЯ" ---
function showConnectInfo() {
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

    // Если ключа нет или он пустой
    if (!globalAccessKey) {
        tg.showAlert("Подписка не найдена или истекла. Продлите доступ!");
        return;
    }

    // Вставляем ключ в поле внутри модалки
    document.getElementById('vpnKeyInput').value = globalAccessKey;
    
    // Показываем модалку
    document.getElementById('keyModal').classList.add('active');
}

// --- ФУНКЦИИ МОДАЛЬНОГО ОКНА ---
function closeModal() {
    document.getElementById('keyModal').classList.remove('active');
}

function copyKey() {
    const input = document.getElementById('vpnKeyInput');
    
    // Выделяем текст (важно для мобильных)
    input.select();
    input.setSelectionRange(0, 99999); 

    navigator.clipboard.writeText(input.value).then(() => {
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        tg.showAlert("Ключ скопирован! Вставьте его в V2RayNG.");
        closeModal();
    }).catch(err => {
        console.error('Ошибка копирования:', err);
        tg.showAlert("Не удалось скопировать автоматически. Скопируйте вручную.");
    });
}

// --- ОСТАЛЬНЫЕ КНОПКИ ---
function extendSub() {
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    tg.sendData(JSON.stringify({action: 'extend_subscription'}));
}

function openFeature(name) { 
    if (tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
    tg.showAlert(`Функция "${name}" скоро будет доступна!`); 
}

function openHelp() { 
    if (tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
    tg.openLink('https://t.me/machnet'); 
}

// Запускаем загрузку данных сразу
loadUserData();

