// Mach Net Mini App

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// API URL - замени на свой домен Railway
const API_BASE = "https://machnetbot-production.up.railway.app/api/user";

const user = tg.initDataUnsafe.user;
let globalAccessKey = "";

// ==========================================
// ЗАГРУЗКА ДАННЫХ
// ==========================================

async function loadUserData() {
    // Устанавливаем имя
    if (user) {
        const name = user.first_name || user.username || "Пилот";
        document.getElementById('userName').textContent = name;
        document.getElementById('avatarLetter').textContent = name.charAt(0).toUpperCase();
    } else {
        document.getElementById('userName').textContent = "Гость";
        document.getElementById('avatarLetter').textContent = "?";
        showInactive();
        return;
    }

    try {
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
        showInactive();
    }
}

// ==========================================
// ОБНОВЛЕНИЕ UI
// ==========================================

function updateDashboard(data) {
    const now = Math.floor(Date.now() / 1000);
    const statusBadge = document.getElementById('statusBadge');
    
    if (data.is_active && data.expiry > now) {
        // Активная подписка
        const expDate = new Date(data.expiry * 1000);
        const dateStr = expDate.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        const daysLeft = Math.ceil((data.expiry - now) / 86400);
        
        // Статус
        statusBadge.className = 'status-badge active';
        statusBadge.querySelector('.status-text').textContent = 'Активна';
        
        // Карточки
        document.getElementById('expiryDate').textContent = dateStr;
        document.getElementById('daysLeft').textContent = `${daysLeft} дн.`;
        document.getElementById('userSub').textContent = `Подписка активна`;
        
        // Кнопка
        document.getElementById('connectBtn').disabled = false;
        
        // Трафик
        updateTraffic(data.traffic_used, data.traffic_limit);
        
    } else {
        showInactive();
    }
}

function showInactive() {
    const statusBadge = document.getElementById('statusBadge');
    statusBadge.className = 'status-badge inactive';
    statusBadge.querySelector('.status-text').textContent = 'Не активна';
    
    document.getElementById('expiryDate').textContent = '—';
    document.getElementById('daysLeft').textContent = '—';
    document.getElementById('userSub').textContent = 'Нет активной подписки';
    document.getElementById('trafficText').textContent = '—';
    document.getElementById('trafficFill').style.width = '0%';
    
    document.getElementById('connectBtn').disabled = true;
}

function updateTraffic(used, limit) {
    const usedGB = (used || 0) / (1024 ** 3);
    const limitGB = (limit || 0) / (1024 ** 3);
    
    const trafficFill = document.getElementById('trafficFill');
    const trafficText = document.getElementById('trafficText');
    
    if (limitGB > 0) {
        const percent = Math.min(100, (usedGB / limitGB) * 100);
        trafficFill.style.width = `${percent}%`;
        
        // Меняем цвет если много использовано
        if (percent > 80) {
            trafficFill.style.background = 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)';
        } else if (percent > 50) {
            trafficFill.style.background = 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)';
        }
        
        trafficText.textContent = `${usedGB.toFixed(1)} / ${limitGB.toFixed(0)} GB`;
    } else {
        trafficFill.style.width = '30%';
        trafficText.textContent = `${usedGB.toFixed(1)} GB · Безлимит`;
    }
}

// ==========================================
// МОДАЛЬНОЕ ОКНО
// ==========================================

function showKey() {
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
    }

    if (!globalAccessKey) {
        showToast('Подписка не активна');
        return;
    }

    document.getElementById('keyInput').value = globalAccessKey;
    document.getElementById('keyModal').classList.add('active');
    document.getElementById('copyIcon').textContent = '📋';
}

function closeModal() {
    document.getElementById('keyModal').classList.remove('active');
}

function copyKey() {
    const input = document.getElementById('keyInput');
    
    navigator.clipboard.writeText(input.value)
        .then(() => {
            if (tg.HapticFeedback) {
                tg.HapticFeedback.notificationOccurred('success');
            }
            
            document.getElementById('copyIcon').textContent = '✅';
            
            setTimeout(() => {
                document.getElementById('copyIcon').textContent = '📋';
            }, 2000);
            
            showToast('Ключ скопирован!');
        })
        .catch(err => {
            console.error('Copy error:', err);
            // Fallback
            input.select();
            document.execCommand('copy');
            showToast('Ключ скопирован!');
        });
}

// ==========================================
// НАВИГАЦИЯ
// ==========================================

function openBot() {
    if (tg.HapticFeedback) {
        tg.HapticFeedback.selectionChanged();
    }
    tg.close();
}

function openHelp() {
    if (tg.HapticFeedback) {
        tg.HapticFeedback.selectionChanged();
    }
    showToast('Инструкция: V2RayNG → + → Import');
}

function openSupport() {
    if (tg.HapticFeedback) {
        tg.HapticFeedback.selectionChanged();
    }
    tg.openTelegramLink('https://t.me/machnet');
}

function openChannel() {
    if (tg.HapticFeedback) {
        tg.HapticFeedback.selectionChanged();
    }
    tg.openTelegramLink('https://t.me/machnet_blog');
}

// ==========================================
// TOAST
// ==========================================

function showToast(message) {
    // Удаляем старый toast если есть
    const oldToast = document.querySelector('.toast');
    if (oldToast) {
        oldToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 255, 255, 0.95);
        color: #0a0a0f;
        padding: 12px 24px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        z-index: 2000;
        animation: toastIn 0.3s ease;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Добавляем стили анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes toastIn {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    @keyframes toastOut {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
    }
`;
document.head.appendChild(style);

// ==========================================
// ЗАПУСК
// ==========================================

// Устанавливаем цвета темы Telegram
if (tg.themeParams) {
    document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#0a0a0f');
}

// Загружаем данные
loadUserData();

// Обновляем каждые 30 секунд
setInterval(loadUserData, 30000);
