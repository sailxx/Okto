package com.sailxx.okto.widget

import android.content.Context
import android.content.Intent
import android.net.Uri
import com.sailxx.okto.PlannerActivity

/** Открыть нужный раздел планера, например "#/tasks". */
fun oktoIntent(context: Context, hash: String = ""): Intent =
    Intent(Intent.ACTION_VIEW, Uri.parse(OKTO_URL + hash), context, PlannerActivity::class.java)
