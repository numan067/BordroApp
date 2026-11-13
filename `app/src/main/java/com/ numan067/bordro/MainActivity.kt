package com.numan067.bordro

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.EditText
import android.widget.Spinner
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var monthSpinner: Spinner
    private lateinit var taxSpinner: Spinner
    private lateinit var hourlyRate: EditText
    private lateinit var monthlyHours: EditText
    private lateinit var nightHours: EditText
    private lateinit var overtimeHours: EditText
    private lateinit var nationalHolidayHours: EditText
    private lateinit var religiousHolidayHours: EditText
    private lateinit var officialHolidayHours: EditText
    private lateinit var besDeduction: EditText
    private lateinit var vakifPercent: EditText
    private lateinit var transportGross: EditText

    private lateinit var exemptionResult: TextView
    private lateinit var unionResult: TextView
    private lateinit var vakifResult: TextView
    private lateinit var bonusResult: TextView
    private lateinit var netSalaryResult: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        bindViews()
        setupSpinners()
        setDefaultMonthlyHours()
        attachCalculationListeners()
        calculate()
    }

    private fun bindViews() {
        monthSpinner = findViewById(R.id.monthSpinner)
        taxSpinner = findViewById(R.id.taxSpinner)

        hourlyRate = findViewById(R.id.hourlyRateInput)
        monthlyHours = findViewById(R.id.monthlyHoursInput)
        nightHours = findViewById(R.id.nightHoursInput)
        overtimeHours = findViewById(R.id.overtimeHoursInput)
        nationalHolidayHours = findViewById(R.id.nationalHolidayInput)
        religiousHolidayHours = findViewById(R.id.religiousHolidayInput)
        officialHolidayHours = findViewById(R.id.officialHolidayInput)
        besDeduction = findViewById(R.id.besDeductionInput)
        vakifPercent = findViewById(R.id.vakifPercentInput)
        transportGross = findViewById(R.id.transportInput)

        exemptionResult = findViewById(R.id.exemptionResult)
        unionResult = findViewById(R.id.unionResult)
        vakifResult = findViewById(R.id.vakifResult)
        bonusResult = findViewById(R.id.bonusResult)
        netSalaryResult = findViewById(R.id.netSalaryResult)
    }

    private fun setupSpinners() {
        val months = listOf(
            "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
            "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
        )

        monthSpinner.adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_dropdown_item,
            months
        )
        monthSpinner.setSelection(1) // Şubat

        val taxBrackets = listOf("15%", "20%", "27%", "35%")
        taxSpinner.adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_dropdown_item,
            taxBrackets
        )
        taxSpinner.setSelection(0)

        monthSpinner.onItemSelectedListener =
            object : AdapterView.OnItemSelectedListener {
                override fun onItemSelected(
                    parent: AdapterView<*>?,
                    view: View?,
                    position: Int,
                    id: Long
                ) {
                    setDefaultMonthlyHours()
                    calculate()
                }

                override fun onNothingSelected(parent: AdapterView<*>?) = Unit
            }

        taxSpinner.onItemSelectedListener =
            object : AdapterView.OnItemSelectedListener {
                override fun onItemSelected(
                    parent: AdapterView<*>?,
                    view: View?,
                    position: Int,
                    id: Long
                ) {
                    calculate()
                }

                override fun onNothingSelected(parent: AdapterView<*>?) = Unit
            }
    }

    private fun setDefaultMonthlyHours() {
        val days = listOf(31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)
        val month = monthSpinner.selectedItemPosition.coerceIn(0, 11)
        monthlyHours.setText((days[month] * 7.5).toString())
    }

    private fun attachCalculationListeners() {
        val watcher = object : TextWatcher {
            override fun beforeTextChanged(
                s: CharSequence?,
                start: Int,
                count: Int,
                after: Int
            ) = Unit

            override fun onTextChanged(
                s: CharSequence?,
                start: Int,
                before: Int,
                count: Int
            ) {
                calculate()
            }

            override fun afterTextChanged(s: Editable?) = Unit
        }

        listOf(
            hourlyRate,
            monthlyHours,
            nightHours,
            overtimeHours,
            nationalHolidayHours,
            religiousHolidayHours,
            officialHolidayHours,
            besDeduction,
            vakifPercent,
            transportGross
        ).forEach { it.addTextChangedListener(watcher) }
    }

    // Türkçe ondalık virgülünü de kabul eder.
    private fun readNumber(field: EditText): Double {
        return field.text.toString()
            .trim()
            .replace(',', '.')
            .toDoubleOrNull() ?: 0.0
    }

    private fun calculate() {
        if (!::netSalaryResult.isInitialized ||
            !::monthSpinner.isInitialized ||
            !::taxSpinner.isInitialized
        ) return

        val taxRate = when (taxSpinner.selectedItemPosition) {
            0 -> 0.15
            1 -> 0.20
            2 -> 0.27
            else -> 0.35
        }

        val input = BordroCalculator.Input(
            monthIndex = monthSpinner.selectedItemPosition.coerceIn(0, 11),
            taxRate = taxRate,
            hourlyRate = readNumber(hourlyRate),
            monthlyHours = readNumber(monthlyHours),
            nightHours = readNumber(nightHours),
            overtimeHours = readNumber(overtimeHours),
            nationalHolidayHours = readNumber(nationalHolidayHours),
            religiousHolidayHours = readNumber(religiousHolidayHours),
            officialHolidayHours = readNumber(officialHolidayHours),
            besDeduction = readNumber(besDeduction),
            vakifPercent = readNumber(vakifPercent),
            transportGross = readNumber(transportGross)
        )

        val result = BordroCalculator.calculate(input)

        exemptionResult.text = formatMoney(result.exemption)
        unionResult.text = formatMoney(result.unionDeduction)
        vakifResult.text = formatMoney(result.vakifNet)
        bonusResult.text = formatMoney(result.netBonus)
        netSalaryResult.text = "${formatMoney(result.netSalary)} TL"
    }

    private fun formatMoney(value: Double): String {
        return String.format(Locale("tr", "TR"), "%,.2f", value)
    }
}
