// SEKME DEĞİŞTİRME MANTIĞI
function switchTab(tabId, element) {
    // Tüm sekmeleri pasif yap
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // İlgili sekmeyi aktif et
    document.getElementById(`tab-${tabId}`).classList.add('active');
    element.classList.add('active');
}

// FORMAT FORMATLAMA ARACI (Para birimi için)
function formatTL(value) {
    return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
}

// 1. MAAŞ HESAPLAMA MANTIĞI (2026 Muafiyetli Model)
function calculateSalary() {
    const calcType = document.getElementById('calc-type').value;
    const salaryInput = parseFloat(document.getElementById('salary-input').value) || 0;
    const taxRate = parseFloat(document.getElementById('tax-bracket').value) / 100;

    if (salaryInput <= 0) return;

    let net = 0;
    let brut = 0;
    let sgkWork = 0;
    let unempWork = 0;
    let taxBase = 0;
    let calculatedTax = 0;
    let exemption = 0;
    let finalTax = 0;

    // 2026 Tahmini Asgari Ücret Vergi İstisnası Parametreleri
    const asgariBrut = 35002.00; // 2026 Tahmini
    const asgariSgkExempt = asgariBrut * 0.15; // SGK Muafiyeti
    const asgariTaxBase = asgariBrut - asgariSgkExempt;
    const asgariTaxExemption = asgariTaxBase * 0.15; // Asgari Ücret Vergi İstisna Sınırı

    if (calcType === 'brut-to-net') {
        brut = salaryInput;
        sgkWork = brut * 0.14;
        unempWork = brut * 0.01;
        taxBase = brut - (sgkWork + unempWork);
        calculatedTax = taxBase * taxRate;
        
        // Vergi Muafiyeti Uygulaması
        exemption = Math.min(calculatedTax, asgariTaxExemption);
        finalTax = Math.max(0, calculatedTax - exemption);
        
        net = brut - (sgkWork + unempWork + finalTax);
    } else {
        // Netten Brüte Yaklaşık Hesaplama (Tersine Mühendislik)
        net = salaryInput;
        // Kabaca katsayı hesaplama
        let factor = 1 - (0.15 + (taxRate * 0.85)); 
        brut = net / factor;
        
        // Doğrulama ve İnce Hesap
        sgkWork = brut * 0.14;
        unempWork = brut * 0.01;
        taxBase = brut - (sgkWork + unempWork);
        calculatedTax = taxBase * taxRate;
        exemption = Math.min(calculatedTax, asgariTaxExemption);
        finalTax = Math.max(0, calculatedTax - exemption);
        brut = net + sgkWork + unempWork + finalTax;
    }

    // SONUÇLARI EKRANA YAZDIR
    document.getElementById('res-net').innerText = formatTL(net);
    document.getElementById('res-brut').innerText = formatTL(brut);
    document.getElementById('res-sgk').innerText = formatTL(sgkWork);
    document.getElementById('res-unemp').innerText = formatTL(unempWork);
    document.getElementById('res-tax-base').innerText = formatTL(taxBase);
    document.getElementById('res-calc-tax').innerText = formatTL(calculatedTax);
    document.getElementById('res-tax-exemption').innerText = formatTL(exemption);
    document.getElementById('res-final-tax').innerText = formatTL(finalTax);

    // Sonuç kartını görünür yap
    document.getElementById('salary-results').classList.remove('hidden');
}

// 2. SOSYAL HAKLAR HESAPLAMA MANTIĞI
function calculateBenefits() {
    const mealDaily = parseFloat(document.getElementById('meal-daily').value) || 0;
    const workDays = parseFloat(document.getElementById('work-days').value) || 0;
    const transport = parseFloat(document.getElementById('transport-monthly').value) || 0;
    const insurance = parseFloat(document.getElementById('private-insurance').value) || 0;
    const other = parseFloat(document.getElementById('other-benefits').value) || 0;

    const totalMeal = mealDaily * workDays;
    const totalOthers = insurance + other;
    const grandTotal = totalMeal + transport + totalOthers;

    document.getElementById('res-total-benefits').innerText = formatTL(grandTotal);
    document.getElementById('res-total-meal').innerText = formatTL(totalMeal);
    document.getElementById('res-total-transport').innerText = formatTL(transport);
    document.getElementById('res-total-other').innerText = formatTL(totalOthers);

    document.getElementById('benefits-results').classList.remove('hidden');
}

// 3. BİLEŞİK ENFLASYON HESAPLAMA MANTIĞI
function calculateInflation() {
    const startSalary = parseFloat(document.getElementById('inf-start-salary').value) || 0;
    const monthlyRate = parseFloat(document.getElementById('inf-rate').value) || 0;
    const months = parseInt(document.getElementById('inf-months').value) || 6;

    if (startSalary <= 0) return;

    // Bileşik Enflasyon Oranı Formülü: (1 + r)^n - 1
    const compoundRate = Math.pow((1 + (monthlyRate / 100)), months) - 1;
    const compoundPercent = (compoundRate * 100).toFixed(2);

    // Erimiş Maaş Gücü: P / (1 + r)^n
    const erodedSalary = startSalary / Math.pow((1 + (monthlyRate / 100)), months);

    // Alım gücünü korumak için gereken maaş: P * (1 + r)^n
    const targetSalary = startSalary * Math.pow((1 + (monthlyRate / 100)), months);

    document.getElementById('res-compound-rate').innerText = `%${compoundPercent}`;
    document.getElementById('res-eroded-salary').innerText = formatTL(erodedSalary);
    document.getElementById('res-target-salary').innerText = formatTL(targetSalary);

    document.getElementById('inflation-results').classList.remove('hidden');
}

// 4. İNTERAKTİF İK CHAT MANTIĞI
function sendMessage() {
    const chatInput = document.getElementById('chat-input');
    const chatBox = document.getElementById('chat-box');
    const text = chatInput.value.trim();

    if (!text) return;

    // Kullanıcı mesajını ekle
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble user';
    userBubble.innerText = text;
    chatBox.appendChild(userBubble);

    // Kutuyu temizle ve aşağı kaydır
    chatInput.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    // Simüle İK Yanıtı (Yapay zeka taklidi yapan İK botu)
    setTimeout(() => {
        const replyBubble = document.createElement('div');
        replyBubble.className = 'chat-bubble ik-reply';
        
        let replyText = "Talebiniz kaydedilmiştir. En kısa sürede İnsan Kaynakları departmanımız sizinle iletişime geçecektir.";
        const cleanText = text.toLowerCase();

        if (cleanText.includes("zam") || cleanText.includes("enflasyon") || cleanText.includes("artış")) {
            replyText = "2026 yılı enflasyon farkı ve performans zam oranları, yönetim kurulumuz tarafından değerlendirilmekte olup, en geç dönem sonunda duyurulacaktır.";
        } else if (cleanText.includes("yemek") || cleanText.includes("bilet") || cleanText.includes("sodexo")) {
            replyText = "Günlük yemek yardımı limitlerimiz devletin belirlediği istisna haddine göre (2026 için günlük 170 TL olarak) güncellenmiştir.";
        } else if (cleanText.includes("yol") || cleanText.includes("ulaşım") || cleanText.includes("akbil")) {
            replyText = "Yol yardımı ödemeleriniz, her ayın sonunda çalıştığınız gün baz alınarak maaş bordronuza yan hak olarak yansıtılmaktadır.";
        } else if (cleanText.includes("merhaba") || cleanText.includes("selam")) {
            replyText = "Merhaba! Ben İK Asistanı. Bordro, yan haklar veya 2026 maaş sorularınız için buradayım.";
        }

        replyBubble.innerHTML = `<strong>İK Asistanı:</strong> ${replyText}`;
        chatBox.appendChild(replyBubble);
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 1000);
}

// Klavye "Enter" tuşuna basınca mesajı gönder
document.getElementById('chat-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});