package com.sailxx.okto

import android.content.Intent
import android.net.Uri
import android.util.Base64
import androidx.activity.result.contract.ActivityResultContracts
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.OutputStream

/** Streams WebView blobs to Android's document picker, including files stored offline. */
internal class PlannerDownloads(private val activity: PlannerActivity) {
    private var request: PlannerActivity.Reply? = null
    private var destination: Uri? = null
    private var output: OutputStream? = null
    private val outputLock = Mutex()

    private val picker = activity.registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val uri = result.data?.data?.takeIf { result.resultCode == android.app.Activity.RESULT_OK && it.scheme == "content" }
        destination = uri
        request?.send(uri != null)
        request = null
    }

    fun handle(msg: JSONObject, reply: PlannerActivity.Reply) {
        when (msg.optString("type")) {
            "saveStart" -> {
                if (request != null || destination != null) { reply.fail(); return }
                request = reply
                val name = msg.optString("name").substringAfterLast('/').substringAfterLast('\\').take(240)
                val mime = msg.optString("mime").takeIf { it.matches(Regex("[\\w.+-]+/[\\w.+-]+")) } ?: "application/octet-stream"
                val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE)
                    .setType(mime).putExtra(Intent.EXTRA_TITLE, name)
                runCatching { picker.launch(intent) }.onFailure { request = null; reply.fail() }
            }
            "saveChunk" -> {
                val uri = destination ?: return reply.fail()
                val data = msg.optString("data")
                if (data.length > 270_000) return reply.fail()
                activity.lifecycleScope.launch {
                    val written = withContext(Dispatchers.IO) {
                        outputLock.withLock {
                            runCatching {
                                val stream = output ?: requireNotNull(activity.contentResolver.openOutputStream(uri, "wt")).also { output = it }
                                stream.write(Base64.decode(data, Base64.DEFAULT))
                            }.isSuccess
                        }
                    }
                    if (written) reply.send(null) else reply.fail()
                }
            }
            "saveFinish" -> activity.lifecycleScope.launch {
                val closed = withContext(Dispatchers.IO) { releaseOutput() }
                destination = null
                if (closed) reply.send(null) else reply.fail()
            }
        }
    }

    fun close() {
        request = null
        destination = null
        activity.lifecycleScope.launch(Dispatchers.IO + NonCancellable) { releaseOutput() }
    }

    private suspend fun releaseOutput(): Boolean = outputLock.withLock {
        val stream = output
        output = null
        runCatching { stream?.close() }.isSuccess
    }
}
