package com.sailxx.okto

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.view.ViewGroup
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.FileProvider
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.lifecycle.lifecycleScope
import androidx.webkit.JavaScriptReplyProxy
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import com.sailxx.okto.data.signInWithGoogle
import com.sailxx.okto.data.signOut
import com.sailxx.okto.notify.PlannerNotifications
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.io.File

private const val ORIGIN = "https://appassets.androidplatform.net"
private const val PLANNER_URL = "$ORIGIN/app/okto/planner.html"
private val routes = setOf("", "home", "tasks", "habits", "calendar", "calls", "notes", "health", "finance", "focus")

class PlannerActivity : ComponentActivity() {
    private lateinit var web: WebView
    private lateinit var container: FrameLayout
    private lateinit var downloads: PlannerDownloads
    private var fileChooser: ValueCallback<Array<Uri>>? = null
    private var captured: Uri? = null
    private var permissionReply: Reply? = null
    private var pageReady = false
    private var dockInset = 0f
    private var pendingLaunch: Intent? = null

    private val picker = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val uris = if (result.resultCode == Activity.RESULT_OK && captured != null) arrayOf(requireNotNull(captured))
            else WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)
        captured = null
        fileChooser?.onReceiveValue(uris?.filter { it.scheme == "content" }?.toTypedArray())
        fileChooser = null
    }
    private val notifications = registerForActivityResult(ActivityResultContracts.RequestPermission()) {
        permissionReply?.send(notificationPermission())
        permissionReply = null
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        downloads = PlannerDownloads(this)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        @Suppress("DEPRECATION")
        window.statusBarColor = Color.TRANSPARENT
        @Suppress("DEPRECATION")
        window.navigationBarColor = Color.TRANSPARENT
        if (Build.VERSION.SDK_INT >= 29) window.isNavigationBarContrastEnforced = false
        container = FrameLayout(this).apply { setBackgroundColor(getColor(R.color.bar)) }
        ViewCompat.setOnApplyWindowInsetsListener(container) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
            val ime = insets.getInsets(WindowInsetsCompat.Type.ime())
            val navigation = insets.getInsetsIgnoringVisibility(WindowInsetsCompat.Type.navigationBars())
            view.setPadding(bars.left, bars.top, bars.right, ime.bottom)
            // Keep the dock at its usual height while letting content draw underneath it.
            val inset = if (ime.bottom > 0) 0f else navigation.bottom / resources.displayMetrics.density
            if (dockInset != inset) {
                dockInset = inset
                if (pageReady) updateDockInset()
            }
            // The WebView already fits inside these insets. Forwarding them also adds CSS safe-area padding.
            WindowInsetsCompat.CONSUMED
        }
        val assets = WebViewAssetLoader.Builder()
            .addPathHandler("/app/", WebViewAssetLoader.AssetsPathHandler(this)).build()
        web = WebView(this).apply {
            setBackgroundColor(getColor(R.color.bar))
            isVerticalScrollBarEnabled = false
            isHorizontalScrollBarEnabled = false
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = false
            settings.allowContentAccess = true // Content URIs returned by the system file picker.
            settings.textZoom = 100
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                    assets.shouldInterceptRequest(request.url)

                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    if (request.isForMainFrame && request.url.toString().substringBefore('#') == PLANNER_URL) return false
                    if (request.isForMainFrame) openExternal(request.url)
                    return true
                }
            }
            webChromeClient = object : WebChromeClient() {
                override fun onShowFileChooser(view: WebView, callback: ValueCallback<Array<Uri>>, params: FileChooserParams): Boolean {
                    fileChooser?.onReceiveValue(null)
                    fileChooser = callback
                    captured = null
                    if (params.isCaptureEnabled && params.acceptTypes.any { it.startsWith("image/") } && launchCamera()) return true
                    try {
                        picker.launch(params.createIntent())
                    } catch (_: ActivityNotFoundException) {
                        fileChooser = null
                        callback.onReceiveValue(null)
                    }
                    return true
                }
            }
        }
        container.addView(web, ViewGroup.LayoutParams(-1, -1))
        setContentView(container)
        ViewCompat.requestApplyInsets(container)
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(web, "OktoAndroid", setOf(ORIGIN)) { _, message, _, mainFrame, proxy ->
                if (!mainFrame) return@addWebMessageListener
                message.data?.let { data -> runCatching { onMessage(JSONObject(data), proxy) } }
            }
        }
        pendingLaunch = intent
        if (savedInstanceState == null || web.restoreState(savedInstanceState) == null) {
            web.loadUrl(PLANNER_URL + fragment(intent).orEmpty())
        }
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                web.evaluateJavascript("window.oktoAndroidBack?.() === true") { result ->
                    if (result != "true") {
                        if (web.canGoBack()) web.goBack() else finish()
                    }
                }
            }
        })
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        if (pageReady) deliverLaunch(intent) else pendingLaunch = intent
    }

    override fun onResume() {
        super.onResume()
        web.onResume()
        web.evaluateJavascript("window.dispatchEvent(new Event('okto-android-resume'))", null)
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (!hasFocus) return
        WindowCompat.getInsetsController(window, container).apply {
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            hide(WindowInsetsCompat.Type.navigationBars())
        }
    }

    override fun onPause() {
        web.evaluateJavascript("window.dispatchEvent(new Event('okto-android-pause'))", null)
        web.onPause()
        super.onPause()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        web.saveState(outState)
        super.onSaveInstanceState(outState)
    }

    override fun onDestroy() {
        fileChooser?.onReceiveValue(null)
        downloads.close()
        container.removeView(web)
        web.destroy()
        super.onDestroy()
    }

    private fun deliverLaunch(intent: Intent) {
        fragment(intent)?.let { web.evaluateJavascript("window.oktoAndroidRoute?.(${JSONObject.quote(it)})", null) }
        PlannerNotifications.takeAction(this, intent)?.let { action ->
            web.evaluateJavascript("window.oktoAndroidAction?.(${JSONObject.quote(action)})", null)
        }
    }

    private fun updateDockInset() {
        web.evaluateJavascript("document.documentElement.style.setProperty('--okto-dock-inset', '${dockInset}px')", null)
    }

    private fun fragment(intent: Intent): String? {
        val uri = intent.data ?: return null
        if (uri.scheme != "https" || uri.host != "sailxx.github.io" || uri.port != -1 || uri.path?.trimEnd('/') != "/Okto") return null
        val route = uri.fragment.orEmpty().trimStart('/')
        return if (route in routes) "#/$route" else null
    }

    private fun openExternal(uri: Uri) {
        if (uri.scheme !in setOf("https", "http", "mailto", "tel", "geo") || uri.host == Uri.parse(ORIGIN).host) return
        runCatching { startActivity(Intent(Intent.ACTION_VIEW, uri)) }
    }

    private fun launchCamera(): Boolean = runCatching {
        val folder = File(cacheDir, "camera").apply { mkdirs() }
        folder.listFiles()?.filter { System.currentTimeMillis() - it.lastModified() > 86_400_000 }?.forEach { it.delete() }
        val file = File.createTempFile("photo-", ".jpg", folder)
        val uri = FileProvider.getUriForFile(this, "$packageName.fileprovider", file)
        val camera = Intent(MediaStore.ACTION_IMAGE_CAPTURE).putExtra(MediaStore.EXTRA_OUTPUT, uri)
            .addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION or Intent.FLAG_GRANT_READ_URI_PERMISSION)
            .apply { clipData = ClipData.newRawUri("photo", uri) }
        picker.launch(camera)
        captured = uri
    }.isSuccess

    private fun notificationPermission(): String = when {
        NotificationManagerCompat.from(this).areNotificationsEnabled() -> "granted"
        Build.VERSION.SDK_INT >= 33 && !getPreferences(MODE_PRIVATE).getBoolean("askedNotifications", false) -> "default"
        else -> "denied"
    }

    private fun onMessage(msg: JSONObject, proxy: JavaScriptReplyProxy) {
        val reply = Reply(msg.optInt("id"), proxy)
        when (msg.optString("type")) {
            "ready" -> {
                pageReady = true
                updateDockInset()
                pendingLaunch?.let(::deliverLaunch)
                pendingLaunch = null
                reply.send(notificationPermission())
            }
            "theme" -> {
                val darkIcons = msg.optBoolean("light")
                val color = runCatching { Color.parseColor(msg.getString("color")) }.getOrNull()
                if (color != null) container.setBackgroundColor(color)
                WindowCompat.getInsetsController(window, container).apply {
                    isAppearanceLightStatusBars = darkIcons
                    isAppearanceLightNavigationBars = darkIcons
                }
            }
            "external" -> openExternal(Uri.parse(msg.getString("url")))
            "awake" -> web.keepScreenOn = msg.optBoolean("enabled")
            "permission" -> reply.send(notificationPermission())
            "requestPermission" -> {
                if (Build.VERSION.SDK_INT >= 33 && notificationPermission() != "granted" && permissionReply == null) {
                    getPreferences(MODE_PRIVATE).edit().putBoolean("askedNotifications", true).apply()
                    permissionReply = reply
                    notifications.launch(Manifest.permission.POST_NOTIFICATIONS)
                } else reply.send(notificationPermission())
            }
            "signIn" -> lifecycleScope.launch {
                try { reply.send(signInWithGoogle(this@PlannerActivity)) }
                catch (_: GetCredentialCancellationException) { reply.send(null) }
                catch (e: CancellationException) { throw e }
                catch (_: Exception) { reply.fail() }
            }
            "signOut" -> { signOut(); reply.send(null) }
            "notify" -> PlannerNotifications.show(this, msg)
            "live" -> PlannerNotifications.live(this, msg.optJSONObject("view"))
            "reminders" -> PlannerNotifications.updateSchedule(this, msg)
            "saveStart", "saveChunk", "saveFinish" -> downloads.handle(msg, reply)
        }
    }

    internal class Reply(private val id: Int, private val proxy: JavaScriptReplyProxy) {
        fun send(result: Any?) = post(JSONObject().put("value", result ?: JSONObject.NULL))
        fun fail() = post(JSONObject().put("failed", true))
        private fun post(data: JSONObject) {
            if (id != 0) runCatching { proxy.postMessage(data.put("id", id).toString()) }
        }
    }
}
