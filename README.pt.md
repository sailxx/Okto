<div align="center">

[Русский](README.md) · [English](README.en.md) · [Español](README.es.md) · **Português** · [Deutsch](README.de.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Türkçe](README.tr.md) · [Українська](README.uk.md) · [Polski](README.pl.md)

<br>

<img src="assets/readme/hero-pt.svg" width="100%" alt="Okto — planeje seu dia, foque no que importa">

<a href="https://sailxx.github.io/Okto/"><img src="assets/readme/cta.svg" height="44" alt="Abrir o Okto"></a>

</div>

> [!NOTE]
> A interface do app está em russo e inglês.

<br>

<img src="assets/readme/sections-pt.svg" width="100%" alt="Seções do Okto: Início, Tarefas, Calendário, Foco">

<details>
<summary><b>Mais sobre as seções</b></summary>

### 🏠 Início

Blocos de produtividade: **Tarefas** (feitas das planejadas), **Foco** (minutos de Pomodoro), **Sequência** (dias seguidos com tarefa ou foco), **Próxima** (a tarefa mais próxima) e **contadores** por qualquer etiqueta. Adicione, remova e arraste blocos pelo botão «Editar». Toque num bloco para ver o gráfico de 7 dias e o total de 30.

### ✅ Tarefas

Filtros: Hoje (com atrasadas), Próximas, Todas, Sem data, Concluídas — e suas próprias **listas** com cores. A tarefa tem data, hora e duração, **repetição** (diária, dias úteis, semanal, mensal, intervalo, data final), **lembrete**, prioridade, nota e **subtarefas**. **Focar numa tarefa** inicia o Pomodoro e salva os minutos nela. No celular, deslize para a esquerda para «Amanhã» ou «Apagar»; tudo pode ser desfeito.

### 📅 Calendário

No estilo Apple Calendar: **Dia · Semana · Mês**, linha vermelha da hora atual e linha «dia inteiro». Uma tarefa nova aparece no calendário na hora. **Arraste** blocos para outro horário ou dia e **estique** pela borda inferior (passos de 15 minutos; no celular após um toque longo). Em tarefas repetidas o Okto pergunta: só esta, todas as futuras ou a série inteira.

### 🎯 Foco

Contador de um toque e Pomodoro: etiquetas com metas, passos +1/+5/+10, segurar para zerar, quatro modos de Pomodoro, cronômetro e «não apagar a tela».

</details>

<br>

<img src="assets/readme/more-pt.svg" width="100%" alt="Sincronização, privacidade e visual">

<details>
<summary><b>Como ativar a sincronização</b></summary>

Por padrão o Okto guarda tudo no navegador do aparelho. Para ter os mesmos dados no celular e no computador, conecte um projeto gratuito do Firebase (plano Spark, sem cartão):

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com/).
2. **Authentication → Sign-in method** — ative o **Google**. Em **Settings → Authorized domains** adicione `sailxx.github.io`.
3. **Firestore Database** — crie o banco e cole [`firestore.rules`](firestore.rules) na aba **Rules**.
4. **Project settings → Your apps → Web** — registre o app e copie `apiKey`, `authDomain`, `projectId`, `appId`.
5. No repositório do GitHub: **Settings → Secrets and variables → Actions** — adicione os secrets `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
6. Rode o deploy. Nas configurações do Okto aparecerá «Entrar com Google».

Essas chaves não são secretas: o acesso é protegido pelas regras do Firestore e cada um vê só os próprios dados. Os lembretes no site funcionam enquanto a aba está aberta.

</details>

<br>

## 🛠 Desenvolvimento

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # Vitest: repetições, estatísticas, migração, sincronização, calendário
npm run check    # svelte-check
npm run build    # gera o build em dist/
```

Para sincronizar localmente, copie `.env.example` para `.env.local` e preencha as chaves. O GitHub Pages publica automaticamente a cada mudança em `main`.

## 🗂 Histórico de versões

**2.0** — tarefas com listas, repetições, subtarefas e lembretes; calendário no estilo Apple Calendar com arrastar e soltar; início personalizável; sincronização com Firebase; foco numa tarefa.

**1.0** — Pomodoro com quatro modos, etiquetas coloridas, sete temas, idioma inglês, notificações do navegador.

## ⚖️ Licenças

A fonte [Inter](https://rsms.me/inter/) usa a licença SIL Open Font License 1.1. As imagens do README usam [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) (OFL 1.1).

<div align="center">
<br>
<sub>Feito por [Vlad](https://t.me/arkhitkovv). Se o Okto te ajudou, deixe uma ⭐ no repositório.</sub>
</div>
