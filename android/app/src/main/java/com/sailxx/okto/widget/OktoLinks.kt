package com.sailxx.okto.widget

import android.content.Context
import android.content.Intent
import android.net.Uri
import com.google.androidbrowserhelper.trusted.LauncherActivity

/** Открыть Okto (Trusted Web Activity) на нужном разделе, например "#/tasks". */
fun oktoIntent(context: Context, hash: String = ""): Intent =
    Intent(Intent.ACTION_VIEW, Uri.parse(OKTO_URL + hash), context, LauncherActivity::class.java)
