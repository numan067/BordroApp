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

// SAYFA İLK AÇILIŞTA RESMİ VERGİ İSTİSNASINI GÜNCELLESİN
window.onload = function() {
    updateExemptionAndCalculate();
};

// AY VE VERGİ DİLİMİNE GÖRE RESMİ MUAFİYETİ GÜNCELLE (Birebir bordro.pages.dev mantığı)
function updateExemptionAndCalculate() {
    const month = parseInt(document.getElementById('calc-month').value);
    const taxRate = parseFloat(document.getElementById('tax-bracket').value);
    
    // 2026 Tahmini Brüt Asgari Ücreti ve Net İstisna Tabanı
    const minWageGross = 34996.50; 
    const minWageSgkWork = minWageGross * 0.14;
    const minWageUnempWork = minWageGross * 0.01;
    const minWageTaxBase = minWageGross - minWageSgkWork - minWageUnempWork; // 29.747,02 TL
    
    // Vergi dilimine göre istisna düşümü (Örn: %15 için 29.747,02 * 0.15 = 4.462,03 TL)
    let monthlyExemption = minWageTaxBase * (taxRate / 100);
    
    // Gösterge paneline kuruşu kuruşuna yazdır (Ekran görüntüsüyle eşleşme için)
    document.getElementById('ind-exemption').innerText = formatRawTL(monthlyExemption);
    
    // Maaşı yeniden hesapla
    calculateBordro();
}

// ANA KLON BORDRO HESAPLAMA ROBOTU (Kuruşu Kuruşuna)
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

    // 1. Kazanç Kalemleri
    let normalWage = hourlyRate * monthlyHours;
    let nightWage = nightHours * hourlyRate * 0.10; // Gece zammı %10 ek artış
    let overtimeWage = overtimeHours * hourlyRate * 1.60; // Fazla mesai %60 ek artış
    let nationalHolidayWage = nationalHolidayHours * hourlyRate * 2.00; // Ulusal Bayram %100 ek artış
    let religiousHolidayWage = religiousHolidayHours * hourlyRate * 3.00; // Dini Bayram %200 ek artış
    let officialHolidayOvertimeWage = officialHolidayOvertime * hourlyRate * 2.00; // Resmi tatil fazla mesai %100
    
    // Toplam Brüt
    let totalGross = normalWage + nightWage + overtimeWage + nationalHolidayWage + religiousHolidayWage + officialHolidayOvertimeWage + transportGross;

    // 2. Yasal Kesintiler (SGK)
    const minWageGross = 34996.50;
    const sgkCeiling = minWageGross * 7.5;
    
    let sgkBase = Math.min(totalGross, sgkCeiling);
    let sgkWork = sgkBase * 0.14;
    let unempWork = sgkBase * 0.01;
    
    // 3. Gelir Vergisi Matrahı & Hesaplanan Vergi
    let taxBase = totalGross - sgkWork - unempWork;
    let calculatedTax = taxBase * taxRate;
    
    // Vergi İstisnası Uygulaması
    const minWageSgkWork = minWageGross * 0.14;
    const minWageUnempWork = minWageGross * 0.01;
    const minWageTaxBase = minWageGross - minWageSgkWork - minWageUnempWork;
    let maxMonthlyExemption = minWageTaxBase * taxRate;
    
    let actualExemption = Math.min(calculatedTax, maxMonthlyExemption);
    let finalIncomeTax = Math.max(0, calculatedTax - actualExemption);
    
    // 4. Damga Vergisi Kesintisi & İstisnası
    let stampTax = totalGross * 0.00759;
    let maxStampExemption = minWageGross * 0.00759;
    let actualStampExemption = Math.min(stampTax, maxStampExemption);
    let finalStampTax = Math.max(0, stampTax - actualStampExemption);

    // 5. Vakıf ve Sendika Kesintileri
    let vakifDeductionVal = normalWage * (vakifPercent / 100);
    let unionDeductionVal = 0.00; // Sendika kesintisi varsayılan

    // 30 Günlük Net İkramiye Tahmini (Ekran göstergesi için)
    let rawBonusGross = hourlyRate * 7.5 * 30;
    let bonusSgk = Math.min(rawBonusGross, sgkCeiling) * 0.15;
    let bonusTaxBase = rawBonusGross - bonusSgk;
    let bonusTax = bonusTaxBase * taxRate;
    let bonusStamp = rawBonusGross * 0.00759;
    let netBonus = Math.max(0, rawBonusGross - bonusSgk - bonusTax - bonusStamp);

    // 6. Net Ödenecek Maaş
    let netSalary = totalGross - sgkWork - unempWork - finalIncomeTax - finalStampTax - besDeduction - vakifDeductionVal - unionDeductionVal;
    netSalary = Math.max(0, netSalary);

    // PANEL GÖSTERGELERİNİ GÜNCELLE
    document.getElementById('ind-vakif').innerText = formatRawTL(vakifDeductionVal);
    document.getElementById('ind-bonus').innerText = formatRawTL(netBonus);
    document.getElementById('res-net-salary').innerText = formatTL(netSalary);

    // Detay kartı doldurma (Varsa)
    if (document.getElementById('res-net')) {
        document.getElementById('res-net').innerText = formatTL(netSalary);
        document.getElementById('res-brut').innerText = formatTL(totalGross);
        document.getElementById('res-sgk').innerText = formatTL(sgkWork);
        document.getElementById('res-unemp').innerText = formatTL(unempWork);
        document.getElementById('res-tax-base').innerText = formatTL(taxBase);
        document.getElementById('res-calc-tax').innerText = formatTL(calculatedTax);
        document.getElementById('res-tax-exemption').innerText = formatTL(actualExemption);
        document.getElementById('res-final-tax').innerText = formatTL(finalIncomeTax);
        document.getElementById('res-stamp').innerText = formatTL(stampTax);
        document.getElementById('res-stamp-exemption').innerText = formatTL(actualStampExemption);
        document.getElementById('res-final-stamp').innerText = formatTL(finalStampTax);
        document.getElementById('res-employer-cost').innerText = formatTL(totalGross + (totalGross * 0.175));
    }
}

// ENFLASYON SAAT ÜCRETİ HESABI (YENİ SADE MANTIK)
function calculateHourlyInflation() {
    const hourlyRate = parseFloat(document.getElementById('hourly-rate-input').value) || 0;
    if (hourlyRate <= 0) {
        document.getElementById('res-new-hourly').innerText = "0,00 TL";
        document.getElementById('res-hourly-diff').innerText = "+ 0,00 TL";
        return;
    }

    // 4 Aylık Kümülatif Enflasyon: %14,64
    const inflationRate = 14.64 / 100;
    const hourlyIncrease = hourlyRate * inflationRate;
    const newHourlyRate = hourlyRate + hourlyIncrease;

    document.getElementById('res-new-hourly').innerText = formatTL(newHourlyRate);
    document.getElementById('res-hourly-diff').innerText = "+ " + formatTL(hourlyIncrease);

    document.getElementById('inflation-results').classList.remove('hidden');
}

// İNTERAKTİF E-POSTA MESAJ GÖNDERME MANTIĞI
function sendMailAndRender() {
    const textNode = document.getElementById('chat-textarea');
    const msgList = document.getElementById('message-list');
    const noMsgText = document.getElementById('no-msg-text');
    const message = textNode.value.trim();

    if (!message) return;

    // 1. Ekrandaki Mesajlar listesine ekle
    if (noMsgText) noMsgText.style.display = 'none';

    const msgBubble = document.createElement('div');
    msgBubble.className = 'single-message-node';
    msgBubble.innerHTML = `<strong>Gönderildi:</strong> ${message}`;
    msgList.appendChild(msgBubble);

    // Listeyi en aşağı kaydır
    msgList.scrollTop = msgList.scrollHeight;

    // 2. Android cihazın E-posta uygulamasını otomatik tetikle
    const emailTo = "numan067@gmail.com";
    const subject = "BordroApp Geri Bildirim";
    const mailtoUrl = `mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    
    window.location.href = mailtoUrl;

    // Metin alanını temizle
    textNode.value = '';
}