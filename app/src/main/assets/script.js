// GÜNCELLEME KONTROL SİSTEMİ PARAMETRELERİ
const CURRENT_VERSION = "1.0.0";
let updateDownloadUrl = "https://github.com/numan067/BordroApp/actions";

// SEKME DEĞİŞTİRİCİ
function switchTab(tabId, element) {
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
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
};

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
    document.getElementById('ind-exemption').innerText = formatRawTL(
        month.incomeTaxExemption + month.stampTaxExemption
    );
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

    // Ana çalışma brütü
    const baseGross = hourlyRate * monthlyHours;

    // Mesai çarpanları: fazla mesai/ulusal bayram %200, dini bayram %250,
    // resmi tatil fazla mesaisi %300.
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

    const netSalary = gross - sgk - unemployment - incomeTax - stampTax -
        unionDeduction - vakifNet - besDeduction;

    // 30 günlük net ikramiye (gösterge)
    const bonusGross = hourlyRate * 30.0 * 7.5;
    const bonusSgk = bonusGross * 0.14;
    const bonusUnemployment = bonusGross * 0.01;
    const bonusTaxBase = bonusGross - bonusSgk - bonusUnemployment;
    const bonusIncomeTax = bonusTaxBase * taxRate;
    const bonusStampTax = bonusGross * 0.00759;
    const netBonus = bonusGross - bonusSgk - bonusUnemployment - bonusIncomeTax - bonusStampTax;

    document.getElementById('ind-exemption').innerText = formatRawTL(
        month.incomeTaxExemption + month.stampTaxExemption
    );
    document.getElementById('ind-union').innerText = formatRawTL(unionDeduction);
    document.getElementById('ind-vakif').innerText = formatRawTL(vakifNet);
    document.getElementById('ind-bonus').innerText = formatRawTL(netBonus);
    document.getElementById('res-net-salary').innerText = formatTL(netSalary);
}

// ENFLASYON SAAT ÜCRETİ HESABI (SADE MANTIK - ÇALIŞMA SAATİSİZ)
function calculateHourlyInflation() {
    const hourlyRate = parseFloat(document.getElementById('hourly-rate-input').value) || 0;
    if (hourlyRate <= 0) {
        document.getElementById('res-new-hourly').innerText = "0,00 TL";
        document.getElementById('res-hourly-diff').innerText = "+ 0,00 TL";
        return;
    }

    const inflationRate = 14.64 / 100;
    const hourlyIncrease = hourlyRate * inflationRate;
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

    // Yeni mesaj düğümünü ekle
    const msgBubble = document.createElement('div');
    msgBubble.className = 'single-message-node';
    msgBubble.innerHTML = `<strong>Gönderildi:</strong> ${message}`;
    msgList.appendChild(msgBubble);

    // Listeyi en aşağı kaydır
    msgList.scrollTop = msgList.scrollHeight;

    // Metin alanını temizle
    textNode.value = '';
}
