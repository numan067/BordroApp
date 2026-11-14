package com.numan067.bordro

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

class MainActivity : AppCompatActivity() {
    private val contentExecutor = Executors.newSingleThreadExecutor()
    private lateinit var appWebView: WebView
    private var contentFetchStarted = false

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            appWebView = WebView(this)
            setContentView(appWebView)

            val webSettings: WebSettings = appWebView.settings
            webSettings.javaScriptEnabled = true
            webSettings.domStorageEnabled = true
            webSettings.allowFileAccess = true
            appWebView.addJavascriptInterface(ContentBridge(), "BordroNative")
            appWebView.webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView, url: String) {
                    super.onPageFinished(view, url)
                    view.evaluateJavascript("loadCachedRemoteContent()", null)
                    if (!contentFetchStarted) {
                        contentFetchStarted = true
                        fetchRemoteContent()
                    }
                }
            }
            appWebView.loadUrl("file:///android_asset/index.html")
        } catch (e: Exception) {
            val errorView = TextView(this)
            errorView.text = "Uygulama başlatılırken hata oluştu:\n\n${e.message}"
            errorView.setTextColor(android.graphics.Color.RED)
            errorView.textSize = 16f
            setContentView(errorView)
        }
    }

    private inner class ContentBridge {
        @JavascriptInterface
        fun getCachedContent(): String {
            return getSharedPreferences("bordro_remote_content", MODE_PRIVATE)
                .getString("content_json", "") ?: ""
        }
    }

    private fun fetchRemoteContent() {
        contentExecutor.execute {
            var connection: HttpURLConnection? = null
            try {
                connection = (URL(CONTENT_DATA_URL).openConnection() as HttpURLConnection).apply {
                    requestMethod = "GET"
                    connectTimeout = 8000
                    readTimeout = 8000
                    setRequestProperty("Cache-Control", "no-cache")
                }

                if (connection.responseCode !in 200..299) return@execute

                val content = BufferedReader(InputStreamReader(connection.inputStream, Charsets.UTF_8)).use { reader ->
                    reader.readText()
                }
                val parsed = JSONObject(content)
                if (!parsed.has("socialBenefits") || !parsed.has("inflation")) return@execute

                getSharedPreferences("bordro_remote_content", MODE_PRIVATE)
                    .edit()
                    .putString("content_json", content)
                    .apply()

                val safeJson = JSONObject.quote(content)
                runOnUiThread {
                    if (::appWebView.isInitialized && !isFinishing) {
                        appWebView.evaluateJavascript("applyRemoteContent(JSON.parse($safeJson))", null)
                    }
                }
            } catch (_: Exception) {
                // Ağ yoksa son başarılı içerik SharedPreferences'tan gösterilmeye devam eder.
            } finally {
                connection?.disconnect()
            }
        }
    }

    override fun onDestroy() {
        if (::appWebView.isInitialized) appWebView.destroy()
        contentExecutor.shutdownNow()
        super.onDestroy()
    }

    companion object {
        private const val CONTENT_DATA_URL =
            "https://raw.githubusercontent.com/numan067/BordroApp/main/app/src/main/assets/content-data.json"
    }
}
