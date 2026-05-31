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

function formatTL(value) {
    return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
}

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
    let monthlyTaxBase = estimatedBrut * 0.85;
    let estimatedCumulative = (month - 1) * monthlyTaxBase;
    inputCumulative.value = Math.round(estimatedCumulative);
}

const taxBrackets = [158000, 380000, 900000, 4300000];
const taxRates = [0.15, 0.20, 0.27, 0.35, 0.40];

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

function calculateBordroCore(brut, monthIndex, cumulativeBefore, isEmekli, disabilityDegree) {
    const minWageGross = 33030.00;
    const sgkCeiling = minWageGross * 7.5;
    
    let sgkRate = isEmekli ? 0.075 : 0.14;
    let unempRate = isEmekli ? 0.00 : 0.01;
    
    let sgkBase = Math.min(brut, sgkCeiling);
    let sgkWork = sgkBase * sgkRate;
    let unempWork = sgkBase * unempRate;
    
    let taxBase = brut - sgkWork - unempWork;
    const disabilityDeductions = [0, 20000, 10000, 5000];
    let deduction = disabilityDeductions[disabilityDegree] || 0;
    let adjustedTaxBase = Math.max(0, taxBase - deduction);
    
    let calculatedTax = calculateProgressiveTax(cumulativeBefore, adjustedTaxBase);
    
    let minWageSgkWork = minWageGross * 0.14;
    let minWageUnempWork = minWageGross * 0.01;
    let minWageTaxBase = minWageGross - minWageSgkWork - minWageUnempWork;
    
    let minWageCumulativeBefore = (monthIndex - 1) * minWageTaxBase;
    let minWageIncomeTaxExemption = calculateProgressiveTax(minWageCumulativeBefore, minWageTaxBase);
    
    let finalIncomeTax = Math.max(0, calculatedTax - minWageIncomeTaxExemption);
    
    let stampTax = brut * 0.00759;
    let minWageStampTaxExemption = minWageGross * 0.00759;
    let finalStampTax = Math.max(0, stampTax - minWageStampTaxExemption);
    
    let net = brut - sgkWork - unempWork - finalIncomeTax - finalStampTax;
    
    let sgkEmployerRate = isEmekli ? 0.225 : 0.155; 
    let unempEmployerRate = isEmekli ? 0.00 : 0.02;
    let sgkEmployer = sgkBase * sgkEmployerRate;
    let unempEmployer = sgkBase * unempEmployerRate;
    let totalEmployerCost = brut + sgkEmployer + unempEmployer;
    
    return {
        brut: brut, net: net, sgkWork: sgkWork, unempWork: unempWork,
        taxBase: taxBase, calculatedTax: calculatedTax, exemption: minWageIncomeTaxExemption,
        finalIncomeTax: finalIncomeTax, stampTax: stampTax, stampExemption: minWageStampTaxExemption,
        finalStampTax: finalStampTax, employerCost: totalEmployerCost
    };
}

function solveNetToBrut(targetNet, monthIndex, cumulativeBefore, isEmekli, disabilityDegree) {
    let low = targetNet;
    let high = targetNet * 3 + 100000;
    let epsilon = 0.001;
    let maxIterations = 100;
    let gross = (low + high) / 2;
    for (let i = 0; i < maxIterations; i++) {
        let calc = calculateBordroCore(gross, monthIndex, cumulativeBefore, isEmekli, disabilityDegree);
        if (Math.abs(calc.net - targetNet) < epsilon) break;
        if (calc.net < targetNet) low = gross;
        else high = gross;
        gross = (low + high) / 2;
    }
    return gross;
}

function calculateSalary() {
    const calcType = document.getElementById('calc-type').value;
    const salaryInput = parseFloat(document.getElementById('salary-input').value) || 0;
    const month = parseInt(document.getElementById('calc-month').value);
    const cumulative = parseFloat(document.getElementById('cumulative-input').value) || 0;
    const isEmekli = document.getElementById('employee-type').value === 'emekli';
    const disabilityDegree = parseInt(document.getElementById('disability-degree').value) || 0;

    if (salaryInput <= 0) return;

    let finalBrut = 0;
    if (calcType === 'brut-to-net') finalBrut = salaryInput;
    else finalBrut = solveNetToBrut(salaryInput, month, cumulative, isEmekli, disabilityDegree);

    const res = calculateBordroCore(finalBrut, month, cumulative, isEmekli, disabilityDegree);

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

function generateYearlyTable() {
    const calcType = document.getElementById('calc-type').value;
    const salaryInput = parseFloat(document.getElementById('salary-input').value) || 0;
    const isEmekli = document.getElementById('employee-type').value === 'emekli';
    const disabilityDegree = parseInt(document.getElementById('disability-degree').value) || 0;

    if (salaryInput <= 0) return;

    const tableBody = document.getElementById('yearly-table-body');
    tableBody.innerHTML = '';

    let currentCumulative = 0;
    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const disabilityDeductions = [0, 20000, 10000, 5000];
    let deduction = disabilityDeductions[disabilityDegree] || 0;

    for (let month = 1; month <= 12; month++) {
        let brut = 0;
        if (calcType === 'brut-to-net') brut = salaryInput;
        else brut = solveNetToBrut(salaryInput, month, currentCumulative, isEmekli, disabilityDegree);

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

        let currentMonthBase = Math.max(0, res.taxBase - deduction);
        currentCumulative += currentMonthBase;
    }

    document.getElementById('yearly-results').classList.remove('hidden');
    document.getElementById('salary-results').classList.add('hidden');
}

function calculateBenefits() {
    const minWageGross = 33030.00;
    const mealCardTaxLimit = 330.00; 
    const mealCashLimit = 300.00; 
    const transportCardLimit = 158.00; 
    const familySgkLimit = 3303.00; 
    const childSgkLimitPerChild = 660.60; 
    const child06TaxLimit = 693.94; 
    const child6plusTaxLimit = 346.97; 
    const besSgkLimit = 9909.00; 

    const mealType = document.getElementById('meal-type').value;
    const mealDaily = parseFloat(document.getElementById('meal-daily').value) || 0;
    const mealDays = parseFloat(document.getElementById('meal-days').value) || 22;
    const transportType = document.getElementById('transport-type').value;
    const transportDaily = parseFloat(document.getElementById('transport-daily').value) || 0;
    const familyMonthly = parseFloat(document.getElementById('family-monthly').value) || 0;
    const childMonthlyVal = parseFloat(document.getElementById('child-monthly-val').value) || 0;
    const child06Count = parseInt(document.getElementById('child-06-count').value) || 0;
    const child6plusCount = parseInt(document.getElementById('child-6plus-count').value) || 0;
    const besMonthly = parseFloat(document.getElementById('bes-monthly').value) || 0;

    let mealGross = mealDaily * mealDays;
    let mealTaxExempt = 0, mealSgkExempt = 0;
    if (mealType === 'ayni') {
        mealTaxExempt = Math.min(mealDaily, mealCardTaxLimit) * mealDays;
        mealSgkExempt = mealGross;
    } else if (mealType === 'nakdi') {
        mealTaxExempt = Math.min(mealDaily, mealCashLimit) * mealDays;
        mealSgkExempt = Math.min(mealDaily, mealCashLimit) * mealDays;
    } else if (mealType === 'isyeri') {
        mealTaxExempt = mealGross; mealSgkExempt = mealGross;
    }

    let transportGross = transportDaily * mealDays;
    let transportTaxExempt = 0, transportSgkExempt = 0;
    if (transportType === 'ayni') {
        transportTaxExempt = Math.min(transportDaily, transportCardLimit) * mealDays;
        transportSgkExempt = transportGross;
    }

    let familyGross = familyMonthly;
    let familySgkExempt = Math.min(familyMonthly, familySgkLimit);

    const totalChildren = child06Count + child6plusCount;
    let childGross = totalChildren * childMonthlyVal;
    let childSgkExempt = Math.min(childGross, childSgkLimitPerChild * Math.min(totalChildren, 2));
    let childTaxExempt = Math.min(childGross, (child06Count * child06TaxLimit) + (child6plusCount * child6plusTaxLimit));

    let besGross = besMonthly;
    let besSgkExempt = Math.min(besMonthly, besSgkLimit);
    let besTaxExempt = besMonthly * 0.15;

    let totalGross = mealGross + transportGross + familyGross + childGross + besGross;
    let totalTaxExempt = mealTaxExempt + transportTaxExempt + childTaxExempt + besTaxExempt;
    let totalSgkExempt = mealSgkExempt + transportSgkExempt + familySgkExempt + childSgkExempt + besSgkExempt;

    let taxSaved = totalTaxExempt * 0.20;
    let sgkSaved = totalSgkExempt * 0.15;
    let totalNetValue = totalGross - ( (totalGross - totalTaxExempt) * 0.20 ) - ( (totalGross - totalSgkExempt) * 0.15 );
    totalNetValue = Math.min(totalGross, Math.max(0, totalNetValue));

    let employerCostSaved = totalSgkExempt * 0.175;
    let totalEmployerCost = totalGross + (totalGross * 0.175) - employerCostSaved;

    document.getElementById('res-total-gross').innerText = formatTL(totalGross);
    document.getElementById('res-total-net').innerText = formatTL(totalNetValue);
    document.getElementById('res-tax-saving').innerText = formatTL(taxSaved);
    document.getElementById('res-sgk-saving').innerText = formatTL(sgkSaved);
    document.getElementById('res-total-employer-cost').innerText = formatTL(totalEmployerCost);

    document.getElementById('benefits-results').classList.remove('hidden');
}

// SAAT ÜCRETİ VE ENFLASYON HESAPLAYICI (YENİ EKLEME)
function calculateHourlyInflation() {
    const hourlyRate = parseFloat(document.getElementById('hourly-rate-input').value) || 0;
    const monthlyHours = parseFloat(document.getElementById('monthly-hours').value) || 225;

    if (hourlyRate <= 0) return;

    // Resmi 4 Aylık Kümülatif Enflasyon Oranı: %14.64
    const inflationRate = 14.64 / 100;

    // Saatlik Hesaplamalar
    const hourlyIncrease = hourlyRate * inflationRate;
    const newHourlyRate = hourlyRate + hourlyIncrease;

    // Aylık Hesaplamalar
    const oldMonthlySalary = hourlyRate * monthlyHours;
    const newMonthlySalary = newHourlyRate * monthlyHours;
    const monthlyIncrease = oldMonthlySalary * inflationRate;

    // EKRANA YANSIT
    document.getElementById('res-new-hourly').innerText = formatTL(newHourlyRate);
    document.getElementById('res-hourly-diff').innerText = "+ " + formatTL(hourlyIncrease);
    document.getElementById('res-old-monthly').innerText = formatTL(oldMonthlySalary);
    document.getElementById('res-new-monthly').innerText = formatTL(newMonthlySalary);
    document.getElementById('res-monthly-diff').innerText = "+ " + formatTL(monthlyIncrease);

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
            replyText = "2026 yılı ilk 4 aylık kümülatif enflasyon farkı %14.64 olarak belirlenmiştir. Saatlik ücret güncellemeleri bu oran baz alınarak yapılacaktır.";
        } else if (cleanText.includes("yemek") || cleanText.includes("bilet") || cleanText.includes("sodexo")) {
            replyText = "Yemek kartı yardımı limitlerimiz günlük ayni 330 TL (nakit 300 TL) sınırına kadar vergiden muaftır.";
        } else if (cleanText.includes("yol") || cleanText.includes("ulaşım") || cleanText.includes("akbil")) {
            replyText = "Yol yardımı ayni ödemeleriniz günlük 158 TL sınırına kadar vergiden istisnadır.";
        } else if (cleanText.includes("merhaba") || cleanText.includes("selam")) {
            replyText = "Merhaba! İK asistanıyım. Maaş, sosyal haklar ve 4 aylık %14.64 kümülatif enflasyon zammı sorularınız için buradayım.";
        }

        replyBubble.innerHTML = `<strong>İK Asistanı:</strong> ${replyText}`;
        chatBox.appendChild(replyBubble);
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 1000);
}

document.getElementById('chat-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});