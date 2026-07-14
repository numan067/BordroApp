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

// SEÇİLEN AYA GÖRE ÇALIŞMA SAATİNİ OTOMATİK GÜNCELLE (Ay Gün Sayısı × 7,5)
function autoSetCumulativeAndCalculate() {
    const month = parseInt(document.getElementById('calc-month').value);
    const hoursInput = document.getElementById('monthly-hours');

    // Ayların Gün Sayıları (2026 yılına göre)
    const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const days = monthDays[month - 1];

    // Aylık Çalışma Saati = Gün Sayısı × 7,5
    hoursInput.value = (days * 7.5);

    calculateBordro();
}

// KURUŞU KURUŞUNA RESMİ FORMÜL ROBOTU (İLETİLEN YENİ MEVZUAT ŞABLONU)
function calculateBordro() {
    const taxRate = parseFloat(document.getElementById('tax-bracket').value) / 100;
    const hourlyRate = parseFloat(document.getElementById('hourly-rate').value) || 0;
    const monthlyHours = parseFloat(document.getElementById('monthly-hours').value) || 0;
    
    const nightHours = parseFloat(document.getElementById('night-hours').value) || 0;
    const overtimeHours = parseFloat(document.getElementById('overtime-hours').value) || 0;
    const nationalHolidayHours = parseFloat(document.getElementById('national-holiday-hours').value) || 0;
    const religiousHolidayHours = parseFloat(document.getElementById('religious-holiday-hours').value) || 0;
    const officialHolidayOvertime = parseFloat(document.getElementById('official-holiday-overtime').value) || 0;
    
    const besNet = parseFloat(document.getElementById('bes-deduction').value) || 0;
    const vakifPercent = parseFloat(document.getElementById('vakif-percent').value) || 0;
    const transportGross = parseFloat(document.getElementById('transport-gross').value) || 0;

    // 1. Saatlik Yalın Ücret
    const saatlikUcret = hourlyRate;

    // 2. Brütlerin Hesaplanması
    const calismaBrutu = monthlyHours * saatlikUcret; // Çalışma Brütü
    
    const fazlaMesaiBrutu = overtimeHours * 2.0 * saatlikUcret; // %200 Çarpanı (2.0)
    const ulusalBayramBrutu = nationalHolidayHours * 2.0 * saatlikUcret; // %200 Çarpanı (2.0)
    const diniBayramBrutu = religiousHolidayHours * 3.5 * saatlikUcret; // %350 Çarpanı (3.5)
    const resmiTatilFazlaMesaiBrutu = officialHolidayOvertime * 3.0 * saatlikUcret; // %300 Çarpanı (3.0)
    
    // Gece Vardiyası Zammı 2026 yılı için saatlik sabit 30 TL'dir (Tablo ile uyumlu)
    const geceVardiyasiBrutu = nightHours * 30.00; 
    
    // İkramiye Brütü (Maaş döküm göstergesi için)
    const ikramiyeBrutu = saatlikUcret * 225; 
    
    // Şahsi Kesintiler ve BES Brütleştirmesi
    const besBrut = besNet / (1 - 0.00759);
    const vakifKesintisi = calismaBrutu * vakifPercent / 100;
    const sendikaKesintisi = saatlikUcret * 7; 

    // 3. Toplam Aylık Brüt Kazanç (Maaş Havuzu)
    // HATA DÜZELTME: Temel maaşın iki kez toplanmasını önlemek için "brutTemelMaas" kaldırıldı, sadece "calismaBrutu" eklendi.
    // HATA DÜZELTME: İkramiye her ay alınmadığı için aylık Net Maaş havuzundan çıkarıldı, bağımsız göstergeye dönüştürüldü.
    const totalGross = calismaBrutu + fazlaMesaiBrutu + ulusalBayramBrutu + diniBayramBrutu + resmiTatilFazlaMesaiBrutu + geceVardiyasiBrutu + besBrut + transportGross;

    // 4. Yasal Kesintilerin Bulunması
    const sgkKesintisi = totalGross * 0.14;
    const issizlikKesintisi = totalGross * 0.01;
    
    const taxBase = totalGross - (sgkKesintisi + issizlikKesintisi);
    
    const brutGelirVergisi = taxBase * taxRate;
    const brutDamgaVergisi = totalGross * 0.00759;

    // Sabit İstisnaların Uygulanması
    const odenecekGelirVergisi = Math.max(0, brutGelirVergisi - 2805.26);
    const odenecekDamgaVergisi = Math.max(0, brutDamgaVergisi - 167.00);

    // 5. Final: Net Maaşın Çıkışı
    const netSalary = totalGross - sgkKesintisi - issizlikKesintisi - odenecekGelirVergisi - odenecekDamgaVergisi - sendikaKesintisi - vakifKesintisi - besNet;
    const finalNetSalary = Math.max(0, netSalary);

    // 30 Günlük Net İkramiye (Yalnızca gösterge kutusunda gösterilir)
    const ikramiyeSgk = ikramiyeBrutu * 0.14;
    const ikramiyeIssizlik = ikramiyeBrutu * 0.01;
    const ikramiyeMatrah = ikramiyeBrutu - (ikramiyeSgk + ikramiyeIssizlik);
    const ikramiyeVergi = ikramiyeMatrah * taxRate;
    const ikramiyeDamga = ikramiyeBrutu * 0.00759;
    const netBonus = Math.max(0, ikramiyeBrutu - ikramiyeSgk - ikramiyeIssizlik - ikramiyeVergi - ikramiyeDamga);

    // PANEL GÖSTERGELERİNE KURULUŞUNA YAZDIRMA
    document.getElementById('ind-exemption').innerText = formatRawTL(2805.26);
    document.getElementById('ind-union').innerText = formatRawTL(sendikaKesintisi);
    document.getElementById('ind-vakif').innerText = formatRawTL(vakifKesintisi);
    document.getElementById('ind-bonus').innerText = formatRawTL(netBonus);
    document.getElementById('res-net-salary').innerText = formatTL(finalNetSalary);
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