// BordroApp sürüm yapılandırması.
const CURRENT_VERSION = "1.0.2";
let updateDownloadUrl = "https://github.com/numan067/BordroApp/actions";
let inflationMonthlyRates = [];
const PUBLIC_MESSAGES_URL = "https://bordro.pages.dev/api/messages";

function switchTab(tabId, element) {
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    if (element) element.classList.add('active');
    if (tabId === 'messages') loadPublicMessages();
}

function formatTL(value) {
    return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
}
function formatRawTL(value) {
    return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const MONTH_VALUES = [
    { incomeTaxExemption: 4211.33, stampTaxExemption: 250.70 },
    { incomeTaxExemption: 4211.33, stampTaxExemption: 250.70 },
    { incomeTaxExemption: 4211.33, stampTaxExemption: 250.70 },
    { incomeTaxExemption: 4211.33, stampTaxExemption: 250.70 },
    { incomeTaxExemption: 4211.33, stampTaxExemption: 250.70 },
    { incomeTaxExemption: 4211.33, stampTaxExemption: 250.70 },
    { incomeTaxExemption: 4537.75, stampTaxExemption: 250.70 },
    { incomeTaxExemption: 5615.10, stampTaxExemption: 250.70 },
    { incomeTaxExemption: 5615.10, stampTaxExemption: 250.70 },
    { incomeTaxExemption: 5615.10, stampTaxExemption: 250.70 },
    { incomeTaxExemption: 5615.10, stampTaxExemption: 250.70 },
    { incomeTaxExemption: 5615.10, stampTaxExemption: 250.70 }
];

function getSelectedMonthValues() {
    const monthIndex = Number.parseInt(document.getElementById('calc-month').value, 10) - 1;
    return MONTH_VALUES[Math.max(0, Math.min(11, monthIndex))];
}

window.onload = function() {
    addAppLogo();
    autoSetCumulativeAndCalculate();
    checkForAppUpdates();
    loadCachedRemoteContent();
    loadPublicMessages();
};

function addAppLogo() {
    const header = document.querySelector('.app-header-title');
    if (!header || header.querySelector('.app-logo')) return;
    const logo = document.createElement('img');
    logo.className = 'app-logo';
    logo.src = 'bordro-logo.svg';
    logo.alt = 'Bordro Hesaplama';
    header.insertBefore(logo, header.firstChild);
}

function loadCachedRemoteContent() {
    try {
        if (window.BordroNative && typeof window.BordroNative.getCachedContent === 'function') {
            const cached = window.BordroNative.getCachedContent();
            if (cached) applyRemoteContent(JSON.parse(cached));
        }
    } catch (error) {
        console.warn('Kayıtlı içerik yüklenemedi:', error);
    }
}

function applyRemoteContent(data) {
    if (!data || !Array.isArray(data.socialBenefits) || !data.inflation || !Array.isArray(data.inflation.monthly)) return;
    inflationMonthlyRates = data.inflation.monthly;

    const socialBody = document.querySelector('.social-table-premium tbody');
    if (socialBody) {
        socialBody.replaceChildren();
        data.socialBenefits.forEach(item => {
            const row = document.createElement('tr');
            [item.name, item.year2025, item.year2026].forEach((value, index) => {
                const cell = document.createElement('td');
                cell.textContent = String(value ?? '');
                if (index === 2) cell.className = 'text-purple-bold';
                row.appendChild(cell);
            });
            socialBody.appendChild(row);
        });
        const headings = document.querySelectorAll('.social-table-premium thead th');
        if (headings.length >= 3) {
            headings[1].textContent = String(data.inflation.year - 1);
            headings[2].textContent = String(data.inflation.year);
        }
    }

    const title = document.getElementById('inflation-title');
    if (title) title.textContent = `${data.inflation.year} Enflasyon Verileri`;
    renderInflation(data.inflation);
    calculateHourlyInflation();
}

function calculateJulyToDecemberCompound(monthly) {
    let factor = 1;
    for (let monthIndex = 6; monthIndex < 12; monthIndex++) {
        const rate = Number(monthly?.[monthIndex]?.rate) || 0;
        factor *= 1 + rate / 100;
    }
    return (factor - 1) * 100;
}

function renderInflation(inflation) {
    const table = document.querySelector('.comparison-table');
    if (!table) return;
    table.replaceChildren();

    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    months.forEach((monthName, index) => {
        const item = inflation.monthly[index];
        const rateValue = item ? Number(item.rate) || 0 : 0;
        const row = document.createElement('div');
        row.className = 'comp-row';
        const month = document.createElement('span');
        month.textContent = `${monthName} ${inflation.year}`;
        const rate = document.createElement('strong');
        rate.textContent = item && rateValue > 0 ? `%${rateValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Açıklanmadı';
        row.append(month, rate);
        table.appendChild(row);
    });

    const cumulative = calculateJulyToDecemberCompound(inflation.monthly);
    const row = document.createElement('div');
    row.className = 'comp-row highlight-purple';
    const label = document.createElement('span');
    label.textContent = 'Temmuz-Aralık birleşik enflasyon';
    const value = document.createElement('strong');
    value.textContent = `%${cumulative.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    row.append(label, value);
    table.appendChild(row);

    const adjustedRow = document.createElement('div');
    adjustedRow.className = 'comp-row';
    const adjustedLabel = document.createElement('span');
    adjustedLabel.textContent = 'Hesaplama oranı (birleşik enflasyon + 2 puan)';
    const adjustedValue = document.createElement('strong');
    adjustedValue.textContent = `%${(cumulative + 2).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    adjustedRow.append(adjustedLabel, adjustedValue);
    table.appendChild(adjustedRow);
}

async function checkForAppUpdates() {
    if (!navigator.onLine) return;
    try {
        const response = await fetch('https://raw.githubusercontent.com/numan067/BordroApp/main/version.json', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (compareVersions(data.version, CURRENT_VERSION)) {
            updateDownloadUrl = data.downloadUrl || updateDownloadUrl;
            showUpdateModal();
        }
    } catch (error) {
        console.log('Güncelleme kontrolü başarısız:', error);
    }
}

function compareVersions(remote, local) {
    const rParts = remote.split('.').map(Number);
    const lParts = local.split('.').map(Number);
    for (let i = 0; i < Math.max(rParts.length, lParts.length); i++) {
        const r = rParts[i] || 0;
        const l = lParts[i] || 0;
        if (r > l) return true;
        if (r < l) return false;
    }
    return false;
}
function showUpdateModal() {
    const modal = document.getElementById('update-modal');
    if (modal) modal.classList.remove('hidden');
}
function closeUpdateModal() {
    const modal = document.getElementById('update-modal');
    if (modal) modal.classList.add('hidden');
}
function redirectToUpdate() { window.open(updateDownloadUrl, '_blank'); }

function autoSetCumulativeAndCalculate() {
    const month = Number.parseInt(document.getElementById('calc-month').value, 10);
    const hoursInput = document.getElementById('monthly-hours');
    const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    hoursInput.value = monthDays[Math.max(0, Math.min(11, month - 1))] * 7.5;
    updateExemptionAndCalculate();
}
function updateExemptionAndCalculate() {
    const month = getSelectedMonthValues();
    document.getElementById('ind-exemption').innerText = formatRawTL(month.incomeTaxExemption + month.stampTaxExemption);
    calculateBordro();
}

function calculateBordro() {
    const month = getSelectedMonthValues();
    const taxRate = (Number.parseFloat(document.getElementById('tax-bracket').value) || 0) / 100;
    const hourlyRate = Number.parseFloat(document.getElementById('hourly-rate').value) || 0;
    const monthlyHours = Number.parseFloat(document.getElementById('monthly-hours').value) || 0;
    const nightHours = Number.parseFloat(document.getElementById('night-hours').value) || 0;
    const overtimeHours = Number.parseFloat(document.getElementById('overtime-hours').value) || 0;
    const nationalHolidayHours = Number.parseFloat(document.getElementById('national-holiday-hours').value) || 0;
    const religiousHolidayHours = Number.parseFloat(document.getElementById('religious-holiday-hours').value) || 0;
    const officialHolidayHours = Number.parseFloat(document.getElementById('official-holiday-overtime').value) || 0;
    const besDeduction = Number.parseFloat(document.getElementById('bes-deduction').value) || 0;
    const vakifPercent = Number.parseFloat(document.getElementById('vakif-percent').value) || 0;
    const transportGross = Number.parseFloat(document.getElementById('transport-gross').value) || 0;

    const baseGross = hourlyRate * monthlyHours;
    const overtimeGross = ((overtimeHours + nationalHolidayHours) * hourlyRate * 2.0) +
        (religiousHolidayHours * hourlyRate * 2.5) + (officialHolidayHours * hourlyRate * 3.0);
    const gross = baseGross + overtimeGross + nightHours * 30.0 + transportGross;
    const sgk = gross * 0.14;
    const unemployment = gross * 0.01;
    const unionDeduction = hourlyRate * 7.0;
    const incomeTaxBase = gross - sgk - unemployment - unionDeduction;
    const incomeTax = Math.max(0, incomeTaxBase * taxRate - month.incomeTaxExemption);
    const stampTax = Math.max(0, gross * 0.00759 - month.stampTaxExemption);
    const vakifNet = baseGross * vakifPercent / 100;
    const netSalary = gross - sgk - unemployment - incomeTax - stampTax - unionDeduction - vakifNet - besDeduction;

    const bonusGross = hourlyRate * 30.0 * 7.5;
    const netBonus = bonusGross - bonusGross * 0.14 - bonusGross * 0.01 - (bonusGross - bonusGross * 0.15) * taxRate - bonusGross * 0.00759;
    document.getElementById('ind-exemption').innerText = formatRawTL(month.incomeTaxExemption + month.stampTaxExemption);
    document.getElementById('ind-union').innerText = formatRawTL(unionDeduction);
    document.getElementById('ind-vakif').innerText = formatRawTL(vakifNet);
    document.getElementById('ind-bonus').innerText = formatRawTL(netBonus);
    document.getElementById('res-net-salary').innerText = formatTL(netSalary);
}

function calculateHourlyInflation() {
    const hourlyRate = Number.parseFloat(document.getElementById('hourly-rate-input').value) || 0;
    const adjustedPercent = calculateJulyToDecemberCompound(inflationMonthlyRates) + 2;
    const increase = hourlyRate * adjustedPercent / 100;
    document.getElementById('res-new-hourly').innerText = hourlyRate > 0 ? formatTL(hourlyRate + increase) : '0,00 TL';
    document.getElementById('res-hourly-diff').innerText = '+ ' + (hourlyRate > 0 ? formatTL(increase) : '0,00 TL');
}

async function loadPublicMessages() {
    const list = document.getElementById('message-list');
    if (!list) return;
    try {
        const response = await fetch(PUBLIC_MESSAGES_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error('Mesajlar yüklenemedi.');
        const data = await response.json();
        renderPublicMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (error) {
        console.warn('Ortak mesajlar alınamadı:', error);
        list.innerHTML = '<p class="no-messages">Mesajlar şu anda alınamıyor. Bağlantınızı kontrol edip yeniden deneyin.</p>';
    }
}

function renderPublicMessages(messages) {
    const list = document.getElementById('message-list');
    if (!list) return;
    list.replaceChildren();
    if (!messages.length) {
        const empty = document.createElement('p');
        empty.className = 'no-messages';
        empty.textContent = 'Henüz mesaj yok.';
        list.appendChild(empty);
        return;
    }
    messages.forEach(message => {
        const item = document.createElement('div');
        item.className = 'single-message-node';
        const name = document.createElement('strong');
        name.textContent = `${message.name || 'Ziyaretçi'} · `;
        const text = document.createElement('span');
        text.textContent = message.text || '';
        const date = document.createElement('small');
        date.textContent = message.createdAt ? ` · ${new Date(message.createdAt).toLocaleString('tr-TR')}` : '';
        item.append(name, text, date);
        list.appendChild(item);
    });
}

async function sendMessageLocally() {
    const input = document.getElementById('chat-textarea');
    const button = document.querySelector('#tab-messages button[onclick="sendMessageLocally()"]');
    const text = input.value.trim();
    if (!text) return;
    if (text.length > 500) { alert('Mesaj en fazla 500 karakter olabilir.'); return; }
    if (button) button.disabled = true;
    try {
        const response = await fetch(PUBLIC_MESSAGES_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Mesaj gönderilemedi.');
        input.value = '';
        await loadPublicMessages();
    } catch (error) {
        alert(error.message || 'Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.');
    } finally {
        if (button) button.disabled = false;
    }
}

function sendMessageLocallyPlaceholder() {}

function calculateHourlyInflationOnContentRefresh() { calculateHourlyInflation(); }
