/* script.js */

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// ⚠️ ИСПРАВЛЕНО: убран лишний слеш в конце
const API_BASE = "https://machnetbot-production.up.railway.app/api/user";

const user = tg.initDataUnsafe.user;
let globalAccessKey = "";

// --- ЗАГРУЗКА ДАННЫХ ---
async function loadUserData() {
    if (!user) {
        document.getElementById('userName').innerText = 'Ghost Pilot';
        showError('Не удалось определить пользователя');
        return;
    }

    document.getElementById('userName').innerText = user.first_name;

    try {
        // Показываем индикатор загрузки
        setLoading(true);

        const response = await fetch(`${API_BASE}/${user.id}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // Сохраняем ключ
        globalAccessKey = data.access_key || "";

        // Обновляем UI
        updateDashboard(data);

    } catch (error) {
        console.error('Load Error:', error);
        showError('Ошибка загрузки данных. Проверьте подключение.');
    } finally {
        setLoading(false);
    }
}

// --- ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ---
function updateDashboard(data) {
    const now = Math.floor(Date.now() / 1000);
    let dateStr = "Не активна";
    let daysLeft = 0;

    if (data.expiry > 0) {
        const dateObj = new Date(data.expiry * 1000);
        dateStr = dateObj.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        daysLeft = Math.ceil((data.expiry - now) / 86400);
        if (daysLeft < 0) daysLeft = 0;
    }

    // Обновляем карточки
    document.getElementById('expiryDate').innerText = dateStr;
    document.getElementById('daysLeft').innerText = daysLeft + " дн.";

    // Обновляем статус
    const statusEl = document.getElementById('statusBadge');
    if (data.is_active && daysLeft > 0) {
        statusEl.innerHTML = '<i class="fa-solid fa-check-circle"></i> Активна';
        statusEl.className = 'status-badge';
    } else {
        statusEl.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Истекла';
        statusEl.className = 'status-badge expired';
    }
}

// --- ИНДИКАТОР ЗАГРУЗКИ ---
function setLoading(isLoading) {
    const dateEl = document.getElementById('expiryDate');
    const daysEl = document.getElementById('daysLeft');

    if (isLoading) {
        dateEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        daysEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    }
}

// --- ПОКАЗАТЬ ОШИБКУ ---
function showError(message) {
    if (tg.showAlert) {
        tg.showAlert(message);
    } else {
        alert(message);
    }
}

// --- КНОПКА "ПОДКЛЮЧИТЬСЯ" ---
function showConnectInfo() {
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
    }

    if (!globalAccessKey) {
        showError('Подписка не активна или истекла. Продлите доступ!');
        return;
    }

    // Вставляем ключ в модальное окно
    document.getElementById('vpnKeyInput').value = globalAccessKey;
    document.getElementById('keyModal').classList.add('active');
}

// --- ЗАКРЫТЬ МОДАЛКУ ---
function closeModal() {
    document.getElementById('keyModal').classList.remove('active');
}

// --- КОПИРОВАТЬ КЛЮЧ ---
function copyKey() {
    const input = document.getElementById('vpnKeyInput');

    input.select();
    input.setSelectionRange(0, 99999);

    navigator.clipboard.writeText(input.value)
        .then(() => {
            if (tg.HapticFeedback) {
                tg.HapticFeedback.notificationOccurred('success');
            }
            showError('Ключ скопирован! Вставьте его в V2RayNG.');
            closeModal();
        })
        .catch(err => {
            console.error('Copy Error:', err);
            showError('Не удалось скопировать. Скопируйте вручную.');
        });
}

// --- КНОПКА "ПРОДЛИТЬ" ---
function extendSub() {
    if (tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }

    // Отправляем событие боту (бот должен открыть меню оплаты)
    tg.sendData(JSON.stringify({ action: 'extend_subscription' }));

    // Альтернатива: закрыть Mini App и вернуть в бот
    // tg.close();
}

// --- ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ---
function openFeature(name) {
    if (tg.HapticFeedback) {
        tg.HapticFeedback.selectionChanged();
    }
    showError(`Функция "${name}" скоро будет доступна!`);
}

function openHelp() {
    if (tg.HapticFeedback) {
        tg.HapticFeedback.selectionChanged();
    }
    tg.openLink('https://t.me/machnet');
}

// --- АВТОЗАПУСК ---
loadUserData();
