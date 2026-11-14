// GÜNCELLEME KONTROL SİSTEMİ PARAMETRELERİ
const CURRENT_VERSION = "1.0.0";
let updateDownloadUrl = "https://github.com/numan067/BordroApp/actions";
let configuredInflationRate = 14.64;

// SEKME DEĞİŞTİRİCİ
function switchTab(tabId, element) {
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    element.classList.add('active');
}

// PARA BİÇİMLENDİRME
function formatTL(value) {
    return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
}
function formatRawTL(value) {
    return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Aylık vergi istisnaları (2026) — hesaplamada ve ekranda aynı değerler kullanılır.
const MONTH_VALUES = [
    { incomeTaxExemption: 4211.33, stampTaxExemption: 250.70 }, // Ocak
    { incomeTaxExemption: 4211.33, stampTaxExemption: 250.70 }, // Şubat
    { incomeTaxExemption: 4211.33, stampTaxExemption: 250.70 }, // Mart
    { incomeTaxExemption: 4211.33, stampTaxExemption: 250.70 }, // Nisan
    { incomeTaxExemption: 4211.33, stampTaxExemption: 250.70 }, // Mayıs
    { incomeTaxExemption: 4211.33, stampTaxExemption: 250.70 }, // Haziran
    { incomeTaxExemption: 4537.75, stampTaxExemption: 250.70 }, // Temmuz
    { incomeTaxExemption: 5615.10, stampTaxExemption: 250.70 }, // Ağustos
    { incomeTaxExemption: 5615.10, stampTaxExemption: 250.70 }, // Eylül
    { incomeTaxExemption: 5615.10, stampTaxExemption: 250.70 }, // Ekim
    { incomeTaxExemption: 5615.10, stampTaxExemption: 250.70 }, // Kasım
    { incomeTaxExemption: 5615.10, stampTaxExemption: 250.70 }  // Aralık
];

function getSelectedMonthValues() {
    const monthIndex = Number.parseInt(document.getElementById('calc-month').value, 10) - 1;
    return MONTH_VALUES[Math.max(0, Math.min(11, monthIndex))];
}

// UYGULAMA İLK AÇILIŞINDA ÇALIŞACAK BLOK
window.onload = function() {
    autoSetCumulativeAndCalculate();
    checkForAppUpdates();
    loadCachedRemoteContent();
};

// Uzaktan yönetilen sosyal yardım ve enflasyon verileri.
// Android'de veri native katmandan alınır; tarayıcıda yerel içerik yedeği korunur.
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
    if (!data || !Array.isArray(data.socialBenefits) || !data.inflation ||
        !Array.isArray(data.inflation.monthly)) return;

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

    const inflation = data.inflation;
    const inflationTitle = document.getElementById('inflation-title');
    if (inflationTitle) inflationTitle.textContent = `${inflation.year} Enflasyon Verileri`;

    const comparisonTable = document.querySelector('.comparison-table');
    if (comparisonTable) {
        comparisonTable.replaceChildren();
        inflation.monthly.forEach(item => {
            const row = document.createElement('div');
            row.className = 'comp-row';
            const month = document.createElement('span');
            month.textContent = `${item.month} ${inflation.year}`;
            const rate = document.createElement('strong');
            rate.textContent = `%${Number(item.rate).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            row.append(month, rate);
            comparisonTable.appendChild(row);
        });
        const totalRow = document.createElement('div');
        totalRow.className = 'comp-row highlight-purple';
        const totalLabel = document.createElement('span');
        totalLabel.textContent = `${inflation.monthly.length} AYLIK TOPLAM`;
        const totalValue = document.createElement('strong');
        totalValue.textContent = `%${Number(inflation.totalRate).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        totalRow.append(totalLabel, totalValue);
        comparisonTable.appendChild(totalRow);
    }

    const newRate = Number(inflation.totalRate);
    if (Number.isFinite(newRate)) configuredInflationRate = newRate;
    calculateHourlyInflation();
}

// OTOMATİK SÜRÜM GÜNCELLEME SORGULAYICI
async function checkForAppUpdates() {
    if (!navigator.onLine) return;
    try {
        const response = await fetch("https://raw.githubusercontent.com/numan067/BordroApp/main/version.json");
        if (!response.ok) return;
        const data = await response.json();
        if (compareVersions(data.version, CURRENT_VERSION)) {
            updateDownloadUrl = data.downloadUrl || updateDownloadUrl;
            showUpdateModal();
        }
    } catch (e) {
        console.log("Güncelleme kontrolü başarısız:", e);
    }
}

// SÜRÜM KIYASLAYICI
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
function redirectToUpdate() {
    window.open(updateDownloadUrl, "_blank");
}

// Seçilen aya göre çalışma saatini otomatik güncelle (ay gün sayısı × 7,5).
function autoSetCumulativeAndCalculate() {
    const month = Number.parseInt(document.getElementById('calc-month').value, 10);
    const hoursInput = document.getElementById('monthly-hours');
    const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const days = monthDays[Math.max(0, Math.min(11, month - 1))];
    hoursInput.value = days * 7.5;
    updateExemptionAndCalculate();
}

// Ay değişince vergi istisnası göstergesini de yenile.
function updateExemptionAndCalculate() {
    const month = getSelectedMonthValues();
    document.getElementById('ind-exemption').innerText = formatRawTL(month.incomeTaxExemption + month.stampTaxExemption);
    calculateBordro();
}

// Bordro hesaplaması
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
    const overtimeGross =
        ((overtimeHours + nationalHolidayHours) * hourlyRate * 2.0) +
        (religiousHolidayHours * hourlyRate * 2.5) +
        (officialHolidayHours * hourlyRate * 3.0);
    const nightGross = nightHours * 30.0;
    const gross = baseGross + overtimeGross + nightGross + transportGross;

    const sgk = gross * 0.14;
    const unemployment = gross * 0.01;
    const unionDeduction = hourlyRate * 7.0;
    const incomeTaxBase = gross - sgk - unemployment - unionDeduction;
    const incomeTax = Math.max(0, incomeTaxBase * taxRate - month.incomeTaxExemption);
    const stampTax = Math.max(0, gross * 0.00759 - month.stampTaxExemption);
    const vakifNet = baseGross * vakifPercent / 100;
    const netSalary = gross - sgk - unemployment - incomeTax - stampTax - unionDeduction - vakifNet - besDeduction;

    const bonusGross = hourlyRate * 30.0 * 7.5;
    const bonusSgk = bonusGross * 0.14;
    const bonusUnemployment = bonusGross * 0.01;
    const bonusTaxBase = bonusGross - bonusSgk - bonusUnemployment;
    const bonusIncomeTax = bonusTaxBase * taxRate;
    const bonusStampTax = bonusGross * 0.00759;
    const netBonus = bonusGross - bonusSgk - bonusUnemployment - bonusIncomeTax - bonusStampTax;

    document.getElementById('ind-exemption').innerText = formatRawTL(month.incomeTaxExemption + month.stampTaxExemption);
    document.getElementById('ind-union').innerText = formatRawTL(unionDeduction);
    document.getElementById('ind-vakif').innerText = formatRawTL(vakifNet);
    document.getElementById('ind-bonus').innerText = formatRawTL(netBonus);
    document.getElementById('res-net-salary').innerText = formatTL(netSalary);
}

// ENFLASYON SAAT ÜCRETİ HESABI
function calculateHourlyInflation() {
    const hourlyRate = parseFloat(document.getElementById('hourly-rate-input').value) || 0;
    if (hourlyRate <= 0) {
        document.getElementById('res-new-hourly').innerText = "0,00 TL";
        document.getElementById('res-hourly-diff').innerText = "+ 0,00 TL";
        return;
    }
    const hourlyIncrease = hourlyRate * configuredInflationRate / 100;
    const newHourlyRate = hourlyRate + hourlyIncrease;
    document.getElementById('res-new-hourly').innerText = formatTL(newHourlyRate);
    document.getElementById('res-hourly-diff').innerText = "+ " + formatTL(hourlyIncrease);
}

// GERİ BİLDİRİMİ SADECE SAYFA İÇİ LİSTEDE BİRİKTİRME (MAİL GÖNDERME YOK)
function sendMessageLocally() {
    const textNode = document.getElementById('chat-textarea');
    const msgList = document.getElementById('message-list');
    const noMsgText = document.getElementById('no-msg-text');
    const message = textNode.value.trim();
    if (!message) return;
    if (noMsgText) noMsgText.style.display = 'none';
    const msgBubble = document.createElement('div');
    msgBubble.className = 'single-message-node';
    const label = document.createElement('strong');
    label.textContent = 'Gönderildi: ';
    msgBubble.append(label, document.createTextNode(message));
    msgList.appendChild(msgBubble);
    msgList.scrollTop = msgList.scrollHeight;
    textNode.value = '';
}
