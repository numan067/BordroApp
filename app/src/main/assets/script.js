// GÜNCELLEME KONTROL SİSTEMİ PARAMETRELERİ
const CURRENT_VERSION = "1.0.0"; // Telefondaki mevcut sürümün numarası
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

// UYGULAMA İLK AÇILIŞINDA ÇALIŞACAK BLOK
window.onload = function() {
    updateExemptionAndCalculate();
    checkForAppUpdates(); // Güncelleme kontrolünü başlat
};

// SİTEDEN EN GÜNCEL SÜRÜMÜ SORGULAYAN MOTOR
async function checkForAppUpdates() {
    if (!navigator.onLine) return; // İnternet yoksa kontrolü es geç

    try {
        // GitHub'daki raw versiyon dosyasını çekiyoruz
        const response = await fetch("https://raw.githubusercontent.com/numan067/BordroApp/main/version.json");
        if (!response.ok) return;

        const data = await response.json();
        
        // Versiyon numarası karşılaştırması yap
        if (compareVersions(data.version, CURRENT_VERSION)) {
            updateDownloadUrl = data.downloadUrl || updateDownloadUrl;
            showUpdateModal();
        }
    } catch (e) {
        console.log("Güncelleme kontrolü başarısız:", e);
    }
}

// SÜRÜM KIYASLAYICI (Örn: "1.0.1" > "1.0.0" ise true döner)
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
    document.getElementById('update-modal').classList.remove('hidden');
}

function closeUpdateModal() {
    document.getElementById('update-modal').classList.add('hidden');
}

function redirectToUpdate() {
    window.open(updateDownloadUrl, "_blank");
}

// VERGİ İSTİSNASINI GÜNCELLE VE HESAPLA
function updateExemptionAndCalculate() {
    const month = parseInt(document.getElementById('calc-month').value);
    const taxRate = parseFloat(document.getElementById('tax-bracket').value);
    
    // 2026 Tahmini Brüt Asgari Ücreti ve Net İstisna Tabanı
    const minWageGross = 34996.50; 
    const minWageSgkWork = minWageGross * 0.14;
    const minWageUnempWork = minWageGross * 0.01;
    const minWageTaxBase = minWageGross - minWageSgkWork - minWageUnempWork; // 29.747,02 TL
    
    // Vergi dilimine göre istisna düşümü (Klon ekrandaki Şubat %15 istisnası 4.462,03 TL ile eşleşir)
    let monthlyExemption = minWageTaxBase * (taxRate / 100);
    
    document.getElementById('ind-exemption').innerText = formatRawTL(monthlyExemption);
    calculateBordro();
}

// BORDRO HESAPLAMA ROBOTU
function calculateBordro() {
    const hourlyRate = parseFloat(document.getElementById('hourly-rate').value) || 0;
    const monthlyHours = parseFloat(document.getElementById('monthly-hours').value) || 0;
    const nightHours = parseFloat(document.getElementById('night-hours').value) || 0;
    const overtimeHours = parseFloat(document.getElementById('overtime-hours').value) || 0;
    const nationalHolidayHours = parseFloat(document.getElementById('national-holiday-hours').value) || 0;
    const religiousHolidayHours = parseFloat(document.getElementById('religious-holiday-hours').value) || 0;
    const officialHolidayOvertime = parseFloat(document.getElementById('official-holiday-overtime').value) || 0;
    const besDeduction = parseFloat(document.getElementById('bes-deduction').value) || 0;
    const vakifPercent = parseFloat(document.getElementById('vakif-percent').value) || 0;
    const transportGross = parseFloat(document.getElementById('transport-gross').value) || 0;
    const taxRate = parseFloat(document.getElementById('tax-bracket').value) / 100;

    // 1. Kazançlar
    let normalWage = hourlyRate * monthlyHours;
    let nightWage = nightHours * hourlyRate * 0.10; 
    let overtimeWage = overtimeHours * hourlyRate * 1.60; 
    let nationalHolidayWage = nationalHolidayHours * hourlyRate * 2.00; 
    let religiousHolidayWage = religiousHolidayHours * hourlyRate * 3.00; 
    let officialHolidayOvertimeWage = officialHolidayOvertime * hourlyRate * 2.00; 
    
    let totalGross = normalWage + nightWage + overtimeWage + nationalHolidayWage + religiousHolidayWage + officialHolidayOvertimeWage + transportGross;

    // 2. SGK Kesintileri
    const minWageGross = 34996.50;
    const sgkCeiling = minWageGross * 7.5;
    
    let sgkBase = Math.min(totalGross, sgkCeiling);
    let sgkWork = sgkBase * 0.14;
    let unempWork = sgkBase * 0.01;
    
    // 3. Vergi
    let taxBase = totalGross - sgkWork - unempWork;
    let calculatedTax = taxBase * taxRate;
    
    const minWageSgkWork = minWageGross * 0.14;
    const minWageUnempWork = minWageGross * 0.01;
    const minWageTaxBase = minWageGross - minWageSgkWork - minWageUnempWork;
    let maxMonthlyExemption = minWageTaxBase * taxRate;
    
    let actualExemption = Math.min(calculatedTax, maxMonthlyExemption);
    let finalIncomeTax = Math.max(0, calculatedTax - actualExemption);
    
    let stampTax = totalGross * 0.00759;
    let maxStampExemption = minWageGross * 0.00759;
    let actualStampExemption = Math.min(stampTax, maxStampExemption);
    let finalStampTax = Math.max(0, stampTax - actualStampExemption);

    // 4. Diğer Kesintiler
    let vakifDeductionVal = normalWage * (vakifPercent / 100);
    let unionDeductionVal = 0.00; 

    // 30 Günlük Net İkramiye
    let rawBonusGross = hourlyRate * 7.5 * 30;
    let bonusSgk = Math.min(rawBonusGross, sgkCeiling) * 0.15;
    let bonusTaxBase = rawBonusGross - bonusSgk;
    let bonusTax = bonusTaxBase * taxRate;
    let bonusStamp = rawBonusGross * 0.00759;
    let netBonus = Math.max(0, rawBonusGross - bonusSgk - bonusTax - bonusStamp);

    // 5. Net Maaş
    let netSalary = totalGross - sgkWork - unempWork - finalIncomeTax - finalStampTax - besDeduction - vakifDeductionVal - unionDeductionVal;
    netSalary = Math.max(0, netSalary);

    // PANEL GÖSTERGELERİNİ GÜNCELLE
    document.getElementById('ind-vakif').innerText = formatRawTL(vakifDeductionVal);
    document.getElementById('ind-bonus').innerText = formatRawTL(netBonus);
    document.getElementById('res-net-salary').innerText = formatTL(netSalary);
}

// ENFLASYON SAAT ÜCRETİ HESABI (YENİ SADE MANTIK)
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

    document.getElementById('inflation-results').classList.remove('hidden');
}

// İNTERAKTİF SOHBET VE MAİL GÖNDERİMİ
function sendMailAndRender() {
    const textNode = document.getElementById('chat-textarea');
    const msgList = document.getElementById('message-list');
    const noMsgText = document.getElementById('no-msg-text');
    const message = textNode.value.trim();

    if (!message) return;

    if (noMsgText) noMsgText.style.display = 'none';

    const msgBubble = document.createElement('div');
    msgBubble.className = 'single-message-node';
    msgBubble.innerHTML = `<strong>Gönderildi:</strong> ${message}`;
    msgList.appendChild(msgBubble);

    msgList.scrollTop = msgList.scrollHeight;

    const emailTo = "numan067@gmail.com";
    const subject = "BordroApp Geri Bildirim";
    const mailtoUrl = `mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    
    window.location.href = mailtoUrl;
    textNode.value = '';
}