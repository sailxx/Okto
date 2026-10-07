package com.sailxx.okto.data

import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import com.sailxx.okto.R

/** Значок Okto на рабочем столе: каждому соответствует activity-alias в манифесте. */
enum class AppIcon(val alias: String, val preview: Int, val label: Int) {
    Octo(".LauncherOcto", R.drawable.ic_launcher_foreground, R.string.icon_octo),
    Ring(".LauncherRing", R.drawable.ic_launcher_ring_foreground, R.string.icon_ring);

    private fun component(ctx: Context) = ComponentName(ctx, "com.sailxx.okto$alias")

    companion object {
        fun current(ctx: Context): AppIcon = entries.firstOrNull {
            when (ctx.packageManager.getComponentEnabledSetting(it.component(ctx))) {
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED -> true
                PackageManager.COMPONENT_ENABLED_STATE_DEFAULT -> it == Octo // по умолчанию в манифесте
                else -> false
            }
        } ?: Octo

        /** Сначала включаем новый alias, потом выключаем старые — чтобы значок не пропал совсем. */
        fun set(ctx: Context, icon: AppIcon) {
            val pm = ctx.packageManager
            pm.setComponentEnabledSetting(icon.component(ctx), PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP)
            entries.filter { it != icon }.forEach {
                pm.setComponentEnabledSetting(it.component(ctx), PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP)
            }
        }
    }
}
