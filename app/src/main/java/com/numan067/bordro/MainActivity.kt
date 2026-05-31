package com.numan067.bordro

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import java.io.PrintWriter
import java.io.StringWriter

class MainActivity : AppCompatActivity() {
    
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        try {
            // Normal uygulama başlatma süreci
            val webView = WebView(this)
            setContentView(webView)
            
            val webSettings: WebSettings = webView.settings
            webSettings.javaScriptEnabled = true
            webSettings.domStorageEnabled = true
            webSettings.allowFileAccess = true 
            
            webView.webViewClient = WebViewClient() 
            webView.loadUrl("file:///android_asset/index.html") 
            
        } catch (e: Exception) {
            // EĞER KODDA BİR HATA OLURSA UYGULAMA ÇÖKMEYECEK!
            // Hatayı telefonunun ekranında kırmızı yazıyla gösterecek, böylece sorunu hemen göreceğiz.
            val errorView = TextView(this)
            val sw = StringWriter()
            e.printStackTrace(PrintWriter(sw))
            errorView.text = "KODDA HATA OLUŞTU:\n\n" + sw.toString()
            errorView.setTextColor(android.graphics.Color.RED)
            errorView.setTextSize(16f)
            setContentView(errorView)
        }
    }
}