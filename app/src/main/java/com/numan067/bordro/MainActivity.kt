package com.numan067.bordroapp // Eğer sendeki farklıysa burayı kendi package adınla değiştir!

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val webView = WebView(this)
        setContentView(webView)
        
        val webSettings: WebSettings = webView.settings
        webSettings.javaScriptEnabled = true
        webSettings.domStorageEnabled = true
        
        // Cihazdaki (uygulama içindeki) html dosyalarına erişim izni
        webSettings.allowFileAccess = true 
        
        webView.webViewClient = WebViewClient() 
        
        // İNTERNETTEN DEĞİL, UYGULAMANIN İÇİNDEN YÜKLÜYORUZ
        webView.loadUrl("file:///android_asset/index.html") 
    }
}