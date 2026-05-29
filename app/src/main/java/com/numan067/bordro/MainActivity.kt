package com.numan067.bordro

import android.os.Bundle
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Butonları Tanımlıyoruz
        val btnMaas = findViewById<Button>(R.id.btnMaas)
        val btnFark = findViewById<Button>(R.id.btnFark)
        val btnSosyal = findViewById<Button>(R.id.btnSosyal)
        val btnEnflasyon = findViewById<Button>(R.id.btnEnflasyon)

        // Tıklama Olayları
        btnMaas.setOnClickListener {
            Toast.makeText(this, "Maaş Hesaplama Ekranı Hazırlanıyor...", Toast.LENGTH_SHORT).show()
        }

        btnFark.setOnClickListener {
            Toast.makeText(this, "Fark Hesaplama Ekranı Hazırlanıyor...", Toast.LENGTH_SHORT).show()
        }

        btnSosyal.setOnClickListener {
            Toast.makeText(this, "Sosyal Haklar Ekranı Hazırlanıyor...", Toast.LENGTH_SHORT).show()
        }

        btnEnflasyon.setOnClickListener {
            Toast.makeText(this, "Bileşik Enflasyon Ekranı Hazırlanıyor...", Toast.LENGTH_SHORT).show()
        }
    }
}
