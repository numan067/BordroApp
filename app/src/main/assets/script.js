// GÜNCELLEME KONTROL SİSTEMİ PARAMETRELERİ
const CURRENT_VERSION = "1.0.0"; // Telefondaki sürüm
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
    checkForAppUpdates(); // Güncelleme kontrolü
};

// OTOMATİK SÜRÜM GÜNCELLEME SORGULAYICI
async function checkForAppUpdates() {
    if (!navigator.onLine) return; // İnternet yoksa es geç

    try {
        const response = await fetch("https://raw.githubusercontent.com/numan067/BordroApp/main/version.json");
        if (!response.ok) return;

        const data = await response.json();
        
        // Sürümleri karşılaştır
        if (compareVersions(data.version, CURRENT_VERSION)) {
            updateDownloadUrl = data.downloadUrl || updateDownloadUrl;
            showUpdateModal();
        }
    } catch (e) {
        console.log("Güncelleme kontrolü başarısız:", e);
    }
}

// SÜRÜM KARŞILAŞTIRICI
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

// SEÇİLEN AYA GÖRE ÇALIŞMA SAATİNİ OTOMATİK GÜNCELLE (Gün Sayısı × 7,5)
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

// BİREBİR İLETİLEN RESMİ FORMÜLLERLE BORDRO HESAPLAMA MOTORU
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

    // 2. Mesailerin, Gece Vardiyasının ve İkramiyenin Brütleştirilmesi
    const calismaBrutu = monthlyHours * saatlikUcret;
    const brutTemelMaas = saatlikUcret * monthlyHours; // Brüt Temel Maaş = Saatlik Ücret × Aylık Çalışma Saati
    
    const fazlaMesaiBrutu = overtimeHours * 2.0 * saatlikUcret; // %200
    const ulusalBayramBrutu = nationalHolidayHours * 2.0 * saatlikUcret; // %200
    const diniBayramBrutu = religiousHolidayHours * 3.5 * saatlikUcret; // %350
    const resmiTatilFazlaMesaiBrutu = officialHolidayOvertime * 3.0 * saatlikUcret; // %300
    
    const geceVardiyasiBrutu = nightHours * (saatlikUcret * 0.10); // Saatlik gece vardiyası farkı (%10)
    const ikramiyeBrutu = saatlikUcret * 225; // İkramiye Brütü = Saatlik Ücret × 225
    
    const besBrut = besNet / (1 - 0.00759);
    const vakifKesintisi = calismaBrutu * vakifPercent / 100;
    const sendikaKesintisi = saatlikUcret * 7; // Sendika Kesintisi = Saatlik Ücret × 7

    // 3. Toplam Brüt Kazanç (Vergi ve SGK Havuzu)
    const totalGross = brutTemelMaas + calismaBrutu + fazlaMesaiBrutu + ulusalBayramBrutu + diniBayramBrutu + resmiTatilFazlaMesaiBrutu + geceVardiyasiBrutu + ikramiyeBrutu + besBrut;

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

    // İkramiyenin Netleştirilmesi (30 Günlük Net İkramiye Değeri)
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

// SAAT ÜCRETİ VE ENFLASYON HESAPLAYICI (YENİ SADE MANTIK - ÇALIŞMA SAATİSİZ)
function calculateHourlyInflation() {
    const hourlyRate = parseFloat(document.getElementById('hourly-rate-input').value) || 0;
    if (hourlyRate <= 0) {
        document.getElementById('res-new-hourly').innerText = "0,00 TL";
        document.getElementById('res-hourly-diff').innerText = "+ 0,00 TL";
        return;
    }

    // 4 Aylık Kümülatif Enflasyon Oranı: %14,64
    const inflationRate = 14.64 / 100;
    const hourlyIncrease = hourlyRate * inflationRate;
    const newHourlyRate = hourlyRate + hourlyIncrease;

    document.getElementById('res-new-hourly').innerText = formatTL(newHourlyRate);
    document.getElementById('res-hourly-diff').innerText = "+ " + formatTL(hourlyIncrease);
}

// GERİ BİLDİRİM VE DOĞRUDAN MAİL GÖNDERİMİ (numan067@gmail.com)
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

    // Doğrudan e-posta taslağını tetikleme
    const emailTo = "numan067@gmail.com";
    const subject = "BordroApp Geri Bildirim";
    const mailtoUrl = `mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    
    window.location.href = mailtoUrl;
    textNode.value = '';
}