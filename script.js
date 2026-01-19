const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const API_BASE = "https://machnetbot-production.up.railway.app/api/user";
const user = tg.initDataUnsafe.user;
let globalAccessKey = "";

function detectOS() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios';
    if (/android/i.test(ua)) return 'android';
    if (/Macintosh|MacIntel/.test(ua)) return 'macos';
    if (/Win32|Win64|Windows/.test(ua)) return 'windows';
    return 'desktop';
}

const currentOS = detectOS();

async function loadUserData() {
    if (user) {
        const name = user.first_name || user.username || "Пилот";
        document.getElementById('userName').textContent = name;
        document.getElementById('avatarLetter').textContent = name.charAt(0).toUpperCase();
    } else {
        document.getElementById('userName').textContent = "Гость";
        showInactive();
        return;
    }
    updateButtonHint();
    try {
        const response = await fetch(`${API_BASE}/${user.id}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        globalAccessKey = data.access_key || "";
        updateDashboard(data);
    } catch (e) {
        console.error('Error:', e);
        showInactive();
    }
}

function updateButtonHint() {
    const hint = document.getElementById('btnHint');
    if (currentOS === 'android') hint.textContent = 'Откроется Happ автоматически';
    else if (currentOS === 'ios') hint.textContent = 'Откроется Streisand автоматически';
    else hint.textContent = 'Ключ скопируется в буфер обмена';
}

function updateDashboard(data) {
    const now = Math.floor(Date.now() / 1000);
    const statusBadge = document.getElementById('statusBadge');
    if (data.is_active && data.expiry > now) {
        const expDate = new Date(data.expiry * 1000);
        const dateStr = expDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
        const daysLeft = Math.ceil((data.expiry - now) / 86400);
        statusBadge.className = 'status-badge active';
        statusBadge.querySelector('.status-text').textContent = 'Активна';
        document.getElementById('expiryDate').textContent = dateStr;
        document.getElementById('daysLeft').textContent = `${daysLeft} дн.`;
        document.getElementById('userSub').textContent = 'Подписка активна';
        document.getElementById('connectBtn').disabled = false;
        updateTraffic(data.traffic_used, data.traffic_limit);
    } else showInactive();
}

function showInactive() {
    const statusBadge = document.getElementById('statusBadge');
    statusBadge.className = 'status-badge inactive';
    statusBadge.querySelector('.status-text').textContent = 'Не активна';
    document.getElementById('expiryDate').textContent = '—';
    document.getElementById('daysLeft').textContent = '—';
    document.getElementById('userSub').textContent = 'Нет подписки';
    document.getElementById('trafficText').textContent = '—';
    document.getElementById('trafficFill').style.width = '0%';
    document.getElementById('connectBtn').disabled = true;
}

function updateTraffic(used, limit) {
    const usedGB = (used || 0) / (1024 ** 3);
    const limitGB = (limit || 0) / (1024 ** 3);
    const fill = document.getElementById('trafficFill');
    const text = document.getElementById('trafficText');
    if (limitGB > 0) {
        const pct = Math.min(100, (usedGB / limitGB) * 100);
        fill.style.width = `${pct}%`;
        if (pct > 80) fill.style.background = 'linear-gradient(135deg, #ef4444, #f97316)';
        else if (pct > 50) fill.style.background = 'linear-gradient(135deg, #f59e0b, #eab308)';
        text.textContent = `${usedGB.toFixed(1)} / ${limitGB.toFixed(0)} GB`;
    } else {
        fill.style.width = '30%';
        text.textContent = `${usedGB.toFixed(1)} GB · Безлимит`;
    }
}

function smartConnect() {
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
    if (!globalAccessKey) { showToast('Подписка не активна'); return; }
    document.getElementById('keyInput').value = globalAccessKey;
    document.getElementById('keyModal').classList.add('active');
    document.getElementById('copyIcon').textContent = '📋';
    updateModalHint();
    if (currentOS === 'android') setTimeout(() => openAndroidApp(), 500);
    else if (currentOS === 'ios') setTimeout(() => openIOSApp(), 500);
    else copyKey();
}

function updateModalHint() {
    const hint = document.getElementById('modalHint');
    if (currentOS === 'android') hint.textContent = '🤖 Android — нажми Happ для подключения';
    else if (currentOS === 'ios') hint.textContent = '🍎 iOS — нажми Streisand для подключения';
    else hint.textContent = '💻 Скопируй ключ и вставь в VPN-клиент';
}

function openAndroidApp() {
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    copyKeySilent();
    try {
        window.location.href = `happ://import/${encodeURIComponent(globalAccessKey)}`;
        setTimeout(() => showToast('Ключ скопирован! Открой Happ → + → Import'), 1500);
    } catch(e) { showToast('Ключ скопирован! Вставь в Happ'); }
}

function openIOSApp() {
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    copyKeySilent();
    try {
        window.location.href = `streisand://import/${encodeURIComponent(globalAccessKey)}`;
        setTimeout(() => showToast('Ключ скопирован! Открой Streisand → +'), 1500);
    } catch(e) { showToast('Ключ скопирован! Вставь в Streisand'); }
}

function copyKeySilent() {
    navigator.clipboard.writeText(globalAccessKey).catch(() => {
        const input = document.getElementById('keyInput');
        input.select();
        document.execCommand('copy');
    });
}

function copyKey() {
    navigator.clipboard.writeText(globalAccessKey).then(() => {
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        document.getElementById('copyIcon').textContent = '✅';
        setTimeout(() => document.getElementById('copyIcon').textContent = '📋', 2000);
        showToast('Ключ скопирован!');
    }).catch(() => {
        const input = document.getElementById('keyInput');
        input.select();
        document.execCommand('copy');
        showToast('Ключ скопирован!');
    });
}

function closeModal() { document.getElementById('keyModal').classList.remove('active'); }
function openBot() { if (tg.HapticFeedback) tg.HapticFeedback.selectionChanged(); tg.close(); }
function openHelp() { if (tg.HapticFeedback) tg.HapticFeedback.selectionChanged(); showToast('Инструкция: Happ/Streisand → + → Import'); }
function openSupport() { if (tg.HapticFeedback) tg.HapticFeedback.selectionChanged(); tg.openTelegramLink('https://t.me/machnet'); }
function openChannel() { if (tg.HapticFeedback) tg.HapticFeedback.selectionChanged(); tg.openTelegramLink('https://t.me/machnet_blog'); }

function showToast(message) {
    const old = document.querySelector('.toast');
    if (old) old.remove();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,0.95);color:#0a0a0f;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:600;z-index:2000;animation:toastIn 0.3s ease;box-shadow:0 4px 20px rgba(0,0,0,0.3);';
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'toastOut 0.3s ease forwards'; setTimeout(() => toast.remove(), 300); }, 2000);
}

const style = document.createElement('style');
style.textContent = '@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}@keyframes toastOut{from{opacity:1;transform:translateX(-50%) translateY(0)}to{opacity:0;transform:translateX(-50%) translateY(20px)}}';
document.head.appendChild(style);

loadUserData();
setInterval(loadUserData, 30000);
