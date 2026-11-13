package com.numan067.bordro

object BordroCalculator {

    data class Input(
        val monthIndex: Int,
        val taxRate: Double,
        val hourlyRate: Double,
        val monthlyHours: Double,
        val nightHours: Double,
        val overtimeHours: Double,
        val nationalHolidayHours: Double,
        val religiousHolidayHours: Double,
        val officialHolidayHours: Double,
        val besDeduction: Double,
        val vakifPercent: Double,
        val transportGross: Double
    )

    data class Result(
        val exemption: Double,
        val unionDeduction: Double,
        val vakifNet: Double,
        val netBonus: Double,
        val netSalary: Double
    )

    private data class MonthValues(
        val incomeTaxExemption: Double,
        val stampTaxExemption: Double
    )

    // bordro.pages.dev/hesapla sayfasındaki ay verileri
    private val monthValues = listOf(
        MonthValues(4211.33, 250.70), // Ocak
        MonthValues(4211.33, 250.70), // Şubat
        MonthValues(4211.33, 250.70), // Mart
        MonthValues(4211.33, 250.70), // Nisan
        MonthValues(4211.33, 250.70), // Mayıs
        MonthValues(4211.33, 250.70), // Haziran
        MonthValues(4537.75, 250.70), // Temmuz
        MonthValues(5615.10, 250.70), // Ağustos
        MonthValues(5615.10, 250.70), // Eylül
        MonthValues(5615.10, 250.70), // Ekim
        MonthValues(5615.10, 250.70), // Kasım
        MonthValues(5615.10, 250.70)  // Aralık
    )

    fun calculate(input: Input): Result {
        val month = monthValues[input.monthIndex.coerceIn(0, 11)]
        val hourlyRate = input.hourlyRate

        val baseGross = hourlyRate * input.monthlyHours

        // Sayfadaki özel mesai çarpanları
        val overtimeGross =
            ((input.overtimeHours + input.nationalHolidayHours) * hourlyRate * 2.0) +
            (input.religiousHolidayHours * hourlyRate * 2.5) +
            (input.officialHolidayHours * hourlyRate * 3.0)

        // Gece zammı ve yol ücreti ana brüte eklenir.
        val nightGross = input.nightHours * 30.0
        val gross = baseGross + overtimeGross + nightGross + input.transportGross

        val sgk = gross * 0.14
        val unemployment = gross * 0.01
        val unionDeduction = hourlyRate * 7.0

        val incomeTaxBase = gross - sgk - unemployment - unionDeduction
        val incomeTax = maxOf(
            0.0,
            (incomeTaxBase * input.taxRate) - month.incomeTaxExemption
        )

        val stampTax = maxOf(
            0.0,
            (gross * 0.00759) - month.stampTaxExemption
        )

        // Vakıf kesintisi yalnızca saat ücreti × çalışma saati üzerinden hesaplanır.
        val vakifNet = (baseGross / 100.0) * input.vakifPercent

        val netSalary = gross -
            sgk -
            unemployment -
            incomeTax -
            stampTax -
            unionDeduction -
            vakifNet -
            input.besDeduction

        // Sayfadaki 30 günlük ikramiye formülü
        val bonusGross = hourlyRate * 30.0 * 7.5
        val bonusSgk = bonusGross * 0.14
        val bonusUnemployment = bonusGross * 0.01
        val bonusTaxBase = bonusGross - bonusSgk - bonusUnemployment
        val bonusIncomeTax = bonusTaxBase * input.taxRate
        val bonusStampTax = bonusGross * 0.00759

        val netBonus = bonusGross -
            bonusSgk -
            bonusUnemployment -
            bonusIncomeTax -
            bonusStampTax

        return Result(
            exemption = month.incomeTaxExemption + month.stampTaxExemption,
            unionDeduction = unionDeduction,
            vakifNet = vakifNet,
            netBonus = netBonus,
            netSalary = netSalary
        )
    }
}
