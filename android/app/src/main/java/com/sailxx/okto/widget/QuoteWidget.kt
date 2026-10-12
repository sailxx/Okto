package com.sailxx.okto.widget

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.LocalContext
import androidx.glance.action.ActionParameters
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.action.ActionCallback
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.text.FontFamily
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import com.sailxx.okto.R
import com.sailxx.okto.data.OktoRepository
import java.time.LocalDate

// ===== «Цитата»: стоицизм и дисциплина — своя цитата на каждый день, тап листает дальше =====

private class Quote(val ru: String, val en: String, val authorRu: String, val authorEn: String)

private const val AURELIUS_RU = "Марк Аврелий"
private const val AURELIUS_EN = "Marcus Aurelius"
private const val SENECA_RU = "Сенека"
private const val SENECA_EN = "Seneca"
private const val EPICTETUS_RU = "Эпиктет"
private const val EPICTETUS_EN = "Epictetus"

private val QUOTES = listOf(
    Quote("Не трать больше времени на споры о том, каким должен быть хороший человек. Будь им.", "Waste no more time arguing what a good man should be. Be one.", AURELIUS_RU, AURELIUS_EN),
    Quote("У тебя есть власть над своим умом, а не над внешними событиями. Пойми это — и обретёшь силу.", "You have power over your mind, not outside events. Realize this, and you will find strength.", AURELIUS_RU, AURELIUS_EN),
    Quote("Препятствие на пути становится путём.", "What stands in the way becomes the way.", AURELIUS_RU, AURELIUS_EN),
    Quote("Делай каждое дело так, будто оно последнее в твоей жизни.", "Do every act of your life as though it were the last.", AURELIUS_RU, AURELIUS_EN),
    Quote("Счастье твоей жизни зависит от качества твоих мыслей.", "The happiness of your life depends upon the quality of your thoughts.", AURELIUS_RU, AURELIUS_EN),
    Quote("На рассвете, когда не хочется вставать, напомни себе: я встаю, чтобы делать дело человека.", "At dawn, when you have trouble getting out of bed, tell yourself: I have to go to work — as a human being.", AURELIUS_RU, AURELIUS_EN),
    Quote("Если это неправильно — не делай. Если неправда — не говори.", "If it is not right, do not do it; if it is not true, do not say it.", AURELIUS_RU, AURELIUS_EN),
    Quote("Лучшая месть — не уподобляться обидчику.", "The best revenge is not to be like your enemy.", AURELIUS_RU, AURELIUS_EN),
    Quote("Мы страдаем чаще в воображении, чем в действительности.", "We suffer more often in imagination than in reality.", SENECA_RU, SENECA_EN),
    Quote("Пока мы откладываем жизнь, она проходит.", "While we are postponing, life speeds by.", SENECA_RU, SENECA_EN),
    Quote("Не то чтобы у нас мало времени — мы много его теряем.", "It is not that we have a short time to live, but that we waste a lot of it.", SENECA_RU, SENECA_EN),
    Quote("Удача — это когда подготовка встречается с возможностью.", "Luck is what happens when preparation meets opportunity.", "Сенека (приписывается)", "Attributed to Seneca"),
    Quote("Трудности укрепляют ум, как труд — тело.", "Difficulties strengthen the mind, as labor does the body.", SENECA_RU, SENECA_EN),
    Quote("Начни жить сейчас и считай каждый день отдельной жизнью.", "Begin at once to live, and count each separate day as a separate life.", SENECA_RU, SENECA_EN),
    Quote("Больше всех властен тот, кто владеет собой.", "Most powerful is he who has himself in his own power.", SENECA_RU, SENECA_EN),
    Quote("Не бывает попутного ветра для того, кто не знает, куда плывёт.", "If one does not know to which port one is sailing, no wind is favorable.", SENECA_RU, SENECA_EN),
    Quote("Не свободен тот, кто не владеет собой.", "No man is free who is not master of himself.", EPICTETUS_RU, EPICTETUS_EN),
    Quote("Людей тревожат не вещи, а их мнения о вещах.", "Men are disturbed not by things, but by the views which they take of things.", EPICTETUS_RU, EPICTETUS_EN),
    Quote("Сначала скажи себе, кем хочешь быть, а потом делай то, что должен.", "First say to yourself what you would be; and then do what you have to do.", EPICTETUS_RU, EPICTETUS_EN),
    Quote("Ничто великое не создаётся вдруг.", "No great thing is created suddenly.", EPICTETUS_RU, EPICTETUS_EN),
    Quote("Сколько ещё ты будешь ждать, прежде чем потребуешь от себя лучшего?", "How long are you going to wait before you demand the best for yourself?", EPICTETUS_RU, EPICTETUS_EN),
    Quote("Не объясняй свою философию. Воплощай её.", "Don't explain your philosophy. Embody it.", EPICTETUS_RU, EPICTETUS_EN),
    Quote("Если хочешь стать лучше, будь готов казаться глупым.", "If you want to improve, be content to be thought foolish and stupid.", EPICTETUS_RU, EPICTETUS_EN),
    Quote("Дисциплина — это выбор между тем, чего хочешь сейчас, и тем, чего хочешь больше всего.", "Discipline is choosing between what you want now and what you want most.", "Авраам Линкольн (приписывается)", "Attributed to Abraham Lincoln"),
    Quote("Мы — то, что мы делаем постоянно. Совершенство — не поступок, а привычка.", "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", "Уилл Дюрант об Аристотеле", "Will Durant on Aristotle"),
    Quote("Тот, кто победил себя, сильнее того, кто победил тысячи в битве.", "Better than a thousand battles won is to conquer yourself.", "Дхаммапада", "Dhammapada"),
    Quote("Путь в тысячу ли начинается с первого шага.", "A journey of a thousand miles begins with a single step.", "Лао-цзы", "Lao Tzu"),
    Quote("Терпение горько, но плод его сладок.", "Patience is bitter, but its fruit is sweet.", "Жан-Жак Руссо", "Jean-Jacques Rousseau"),
)

private const val PREFS = "okto_quotes"
private const val KEY_SHIFT = "shift"

/** Номер цитаты: день года задаёт цитату дня, тапы сдвигают её дальше. */
private fun quoteIndex(context: Context): Int {
    val shift = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getInt(KEY_SHIFT, 0)
    return Math.floorMod(LocalDate.now().toEpochDay().toInt() + shift, QUOTES.size)
}

class QuoteWidget : GlanceAppWidget() {
    override val sizeMode: SizeMode = SizeMode.Exact

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            val state by OktoRepository.state.collectAsState()
            QuoteCard(state.palette, quoteIndex(context), textSizes())
        }
    }
}

@Composable
private fun QuoteCard(p: com.sailxx.okto.data.OktoPalette, index: Int, t: TextSizes) {
    val ctx = LocalContext.current
    val ru = ctx.resources.configuration.locales[0].language == "ru"
    val q = QUOTES[index]
    Column(
        GlanceModifier.fillMaxSize().background(p.bg).cornerRadius(24.dp).padding(16.dp)
            .clickable(actionRunCallback<NextQuoteAction>()),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            ctx.getString(R.string.quote_caption),
            maxLines = 1,
            style = TextStyle(color = cp(p.muted), fontSize = t.meta * 0.9f, fontFamily = FontFamily.Monospace),
        )
        Spacer(GlanceModifier.height(8.dp))
        Text(
            "«${if (ru) q.ru else q.en}»",
            maxLines = 7,
            modifier = GlanceModifier.fillMaxWidth(),
            style = TextStyle(color = cp(p.ink), fontSize = t.title * 1.3f, fontWeight = FontWeight.Medium),
        )
        Spacer(GlanceModifier.height(10.dp))
        Text(
            "— " + (if (ru) q.authorRu else q.authorEn).uppercase(),
            maxLines = 1,
            style = TextStyle(color = cp(p.muted), fontSize = t.meta * 1.05f, fontFamily = FontFamily.Monospace),
        )
    }
}

/** Тап: следующая цитата. */
class NextQuoteAction : ActionCallback {
    override suspend fun onAction(context: Context, glanceId: GlanceId, parameters: ActionParameters) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        prefs.edit().putInt(KEY_SHIFT, prefs.getInt(KEY_SHIFT, 0) + 1).apply()
        QuoteWidget().update(context, glanceId)
    }
}
