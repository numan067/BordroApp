// SEKME DEĞİŞTİRME MANTIĞI
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

// PARA BİRİMİ BİÇİMLENDİRİCİ
function formatTL(value) {
    return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
}

// SEÇİLEN YÖNE GÖRE YAZILARI GÜNCELLE
function toggleSalaryPlaceholder() {
    const calcType = document.getElementById('calc-type').value;
    const label = document.getElementById('salary-label');
    const input = document.getElementById('salary-input');
    
    if (calcType === 'brut-to-net') {
        label.innerText = "Brüt Maaş (TL)";
        input.placeholder = "Örn: 50000";
    } else {
        label.innerText = "Net Maaş (TL)";
        input.placeholder = "Örn: 42500";
    }
}

// AYA GÖRE KÜMÜLATİF MATRAHI OTOMATİK TAHMİN ETME
function autoSetCumulative() {
    const month = parseInt(document.getElementById('calc-month').value);
    const salary = parseFloat(document.getElementById('salary-input').value) || 0;
    const calcType = document.getElementById('calc-type').value;
    const inputCumulative = document.getElementById('cumulative-input');

    if (salary <= 0) {
        inputCumulative.value = 0;
        return;
    }

    let estimatedBrut = calcType === 'brut-to-net' ? salary : (salary / 0.72);
    let monthlyTaxBase = estimatedBrut * 0.85; // %15 SGK payı düştükten sonra kalan
    
    let estimatedCumulative = (month - 1) * monthlyTaxBase;
    inputCumulative.value = Math.round(estimatedCumulative);
}

// RESMİ GELİR VERGİSİ DİLİMLERİ (2026 TAHMİNİ)
const taxBrackets = [158000, 380000, 900000, 4300000];
const taxRates = [0.15, 0.20, 0.27, 0.35, 0.40];

// DİLİMLİ VERGİ HESAPLAYICI
function calculateProgressiveTax(cumulativeBefore, currentMatrah) {
    let taxBefore = getTaxForCumulative(cumulativeBefore);
    let taxAfter = getTaxForCumulative(cumulativeBefore + currentMatrah);
    return taxAfter - taxBefore;
}

function getTaxForCumulative(amount) {
    let tax = 0;
    let previousLimit = 0;
    for (let i = 0; i < taxBrackets.length; i++) {
        if (amount > taxBrackets[i]) {
            tax += (taxBrackets[i] - previousLimit) * taxRates[i];
            previousLimit = taxBrackets[i];
        } else {
            tax += (amount - previousLimit) * taxRates[i];
            return tax;
        }
    }
    tax += (amount - previousLimit) * taxRates[taxRates.length - 1];
    return tax;
}

// 2026 RESMİ BORDRO ÇEKİRDEK HESAPLAYICISI
function calculateBordroCore(brut, monthIndex, cumulativeBefore, isEmekli, disabilityDegree) {
    const minWageGross = 33030.00; // 2026 Brüt Asgari Ücret Tahmini
    const sgkCeiling = minWageGross * 7.5; // SGK Tavan Matrahı
    
    // 1. SGK Kesintileri
    let sgkRate = isEmekli ? 0.075 : 0.14;
    let unempRate = isEmekli ? 0.00 : 0.01;
    
    let sgkBase = Math.min(brut, sgkCeiling);
    let sgkWork = sgkBase * sgkRate;
    let unempWork = sgkBase * unempRate;
    
    // 2. Gelir Vergisi Matrahı
    let taxBase = brut - sgkWork - unempWork;
    
    // Engellilik İndirimi
    const disabilityDeductions = [0, 20000, 10000, 5000];
    let deduction = disabilityDeductions[disabilityDegree] || 0;
    let adjustedTaxBase = Math.max(0, taxBase - deduction);
    
    // 3. Gelir Vergisi Hesabı
    let calculatedTax = calculateProgressiveTax(cumulativeBefore, adjustedTaxBase);
    
    // 4. Asgari Ücret Gelir Vergisi İstisna Hesabı
    let minWageSgkWork = minWageGross * 0.14;
    let minWageUnempWork = minWageGross * 0.01;
    let minWageTaxBase = minWageGross - minWageSgkWork - minWageUnempWork;
    
    let minWageCumulativeBefore = (monthIndex - 1) * minWageTaxBase;
    let minWageIncomeTaxExemption = calculateProgressiveTax(minWageCumulativeBefore, minWageTaxBase);
    
    let finalIncomeTax = Math.max(0, calculatedTax - minWageIncomeTaxExemption);
    
    // 5. Damga Vergisi ve İstisnası
    let stampTax = brut * 0.00759;
    let minWageStampTaxExemption = minWageGross * 0.00759;
    let finalStampTax = Math.max(0, stampTax - minWageStampTaxExemption);
    
    // 6. Net Ele Geçen
    let net = brut - sgkWork - unempWork - finalIncomeTax - finalStampTax;
    
    // 7. İşveren Maliyeti (5 Puanlık indirim dahil edilmiştir)
    let sgkEmployerRate = isEmekli ? 0.225 : 0.155; 
    let unempEmployerRate = isEmekli ? 0.00 : 0.02;
    let sgkEmployer = sgkBase * sgkEmployerRate;
    let unempEmployer = sgkBase * unempEmployerRate;
    let totalEmployerCost = brut + sgkEmployer + unempEmployer;
    
    return {
        brut: brut,
        net: net,
        sgkWork: sgkWork,
        unempWork: unempWork,
        taxBase: taxBase,
        calculatedTax: calculatedTax,
        exemption: minWageIncomeTaxExemption,
        finalIncomeTax: finalIncomeTax,
        stampTax: stampTax,
        stampExemption: minWageStampTaxExemption,
        finalStampTax: finalStampTax,
        employerCost: totalEmployerCost
    };
}

// NETTEN BRÜTE HASASİYETLİ ÇÖZÜCÜ (Binary Search)
function solveNetToBrut(targetNet, monthIndex, cumulativeBefore, isEmekli, disabilityDegree) {
    let low = targetNet;
    let high = targetNet * 3 + 100000;
    let epsilon = 0.001;
    let maxIterations = 100;
    
    let gross = (low + high) / 2;
    for (let i = 0; i < maxIterations; i++) {
        let calc = calculateBordroCore(gross, monthIndex, cumulativeBefore, isEmekli, disabilityDegree);
        if (Math.abs(calc.net - targetNet) < epsilon) {
            break;
        }
        if (calc.net < targetNet) {
            low = gross;
        } else {
            high = gross;
        }
        gross = (low + high) / 2;
    }
    return gross;
}

// TEK AY HESAPLAMA BUTONU
function calculateSalary() {
    const calcType = document.getElementById('calc-type').value;
    const salaryInput = parseFloat(document.getElementById('salary-input').value) || 0;
    const month = parseInt(document.getElementById('calc-month').value);
    const cumulative = parseFloat(document.getElementById('cumulative-input').value) || 0;
    const isEmekli = document.getElementById('employee-type').value === 'emekli';
    const disabilityDegree = parseInt(document.getElementById('disability-degree').value) || 0;

    if (salaryInput <= 0) return;

    let finalBrut = 0;
    if (calcType === 'brut-to-net') {
        finalBrut = salaryInput;
    } else {
        finalBrut = solveNetToBrut(salaryInput, month, cumulative, isEmekli, disabilityDegree);
    }

    const res = calculateBordroCore(finalBrut, month, cumulative, isEmekli, disabilityDegree);

    // DEĞERLERİ EKRANA YANSIT
    document.getElementById('res-net').innerText = formatTL(res.net);
    document.getElementById('res-brut').innerText = formatTL(res.brut);
    document.getElementById('res-sgk').innerText = formatTL(res.sgkWork);
    document.getElementById('res-unemp').innerText = formatTL(res.unempWork);
    document.getElementById('res-tax-base').innerText = formatTL(res.taxBase);
    document.getElementById('res-calc-tax').innerText = formatTL(res.calculatedTax);
    document.getElementById('res-tax-exemption').innerText = formatTL(res.exemption);
    document.getElementById('res-final-tax').innerText = formatTL(res.finalIncomeTax);
    document.getElementById('res-stamp').innerText = formatTL(res.stampTax);
    document.getElementById('res-stamp-exemption').innerText = formatTL(res.stampExemption);
    document.getElementById('res-final-stamp').innerText = formatTL(res.finalStampTax);
    document.getElementById('res-employer-cost').innerText = formatTL(res.employerCost);

    document.getElementById('salary-results').classList.remove('hidden');
    document.getElementById('yearly-results').classList.add('hidden');
}

// 12 AYLIK TABLO DÖKÜMÜ JAVASCRIPT MOTORU
function generateYearlyTable() {
    const calcType = document.getElementById('calc-type').value;
    const salaryInput = parseFloat(document.getElementById('salary-input').value) || 0;
    const isEmekli = document.getElementById('employee-type').value === 'emekli';
    const disabilityDegree = parseInt(document.getElementById('disability-degree').value) || 0;

    if (salaryInput <= 0) return;

    const tableBody = document.getElementById('yearly-table-body');
    tableBody.innerHTML = '';

    let currentCumulative = 0;
    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Aralık", "Eylül", "Ekim", "Kasım", "Aralık"];
    const disabilityDeductions = [0, 20000, 10000, 5000];
    let deduction = disabilityDeductions[disabilityDegree] || 0;

    for (let month = 1; month <= 12; month++) {
        let brut = 0;
        if (calcType === 'brut-to-net') {
            brut = salaryInput;
        } else {
            brut = solveNetToBrut(salaryInput, month, currentCumulative, isEmekli, disabilityDegree);
        }

        let res = calculateBordroCore(brut, month, currentCumulative, isEmekli, disabilityDegree);

        let row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${monthNames[month - 1]}</strong></td>
            <td>${formatTL(res.brut)}</td>
            <td>${formatTL(res.net)}</td>
            <td>${formatTL(res.sgkWork + res.unempWork)}</td>
            <td>${formatTL(currentCumulative)}</td>
            <td>${formatTL(res.finalIncomeTax)}</td>
            <td>${formatTL(res.finalStampTax)}</td>
            <td>${formatTL(res.employerCost)}</td>
        `;
        tableBody.appendChild(row);

        // Kümülatif Gelir Vergisi matrahını sonraki aya aktar
        let currentMonthBase = Math.max(0, res.taxBase - deduction);
        currentCumulative += currentMonthBase;
    }

    document.getElementById('yearly-results').classList.remove('hidden');
    document.getElementById('salary-results').classList.add('hidden');
}

// SOSYAL HAKLAR HESAPLAMA
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

// BİLEŞİK ENFLASYON HESAPLAMA
function calculateInflation() {
    const startSalary = parseFloat(document.getElementById('inf-start-salary').value) || 0;
    const monthlyRate = parseFloat(document.getElementById('inf-rate').value) || 0;
    const months = parseInt(document.getElementById('inf-months').value) || 6;

    if (startSalary <= 0) return;

    const compoundRate = Math.pow((1 + (monthlyRate / 100)), months) - 1;
    const compoundPercent = (compoundRate * 100).toFixed(2);
    const erodedSalary = startSalary / Math.pow((1 + (monthlyRate / 100)), months);
    const targetSalary = startSalary * Math.pow((1 + (monthlyRate / 100)), months);

    document.getElementById('res-compound-rate').innerText = `%${compoundPercent}`;
    document.getElementById('res-eroded-salary').innerText = formatTL(erodedSalary);
    document.getElementById('res-target-salary').innerText = formatTL(targetSalary);

    document.getElementById('inflation-results').classList.remove('hidden');
}

// İNTERAKTİF SOHBET SİMÜLASYONU
function sendMessage() {
    const chatInput = document.getElementById('chat-input');
    const chatBox = document.getElementById('chat-box');
    const text = chatInput.value.trim();

    if (!text) return;

    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble user';
    userBubble.innerText = text;
    chatBox.appendChild(userBubble);

    chatInput.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

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
            replyText = "Merhaba! Ben İK Asistanı. Bordro, yan haklar veya 2026 maaş sorularınız için burayım.";
        }

        replyBubble.innerHTML = `<strong>İK Asistanı:</strong> ${replyText}`;
        chatBox.appendChild(replyBubble);
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 1000);
}

// "Enter" tuşu yakalama
document.getElementById('chat-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});