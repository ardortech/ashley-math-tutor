# 數學小老師 — Build Spec (for Claude Code)

> App name: **數學小老師**. Pet name: **跳跳**. A zh-TW math tutoring web app for a 7th grader (國一) in Taiwan, used on an iPad.
> Paste this file into the repo root as `CLAUDE.md` (or `SPEC.md`) and ask Claude Code to build it phase by phase.

---

## 1. What we're building

A student photographs a math problem → the AI tutor guides her **one step at a time** (never the full solution at once) → she works it out on paper → photographs her work → the AI checks it → she gets **2 similar practice problems** → every solved problem (including practice) makes her **screen pet** appear and grow.

**Users:** one student (my niece, 國一, Taipei). Possibly one parent/aunt viewer later.
**Device:** iPad, Safari. Must also work on iPhone and desktop.
**Language:** All UI and all AI output in 繁體中文（台灣）. Never Simplified Chinese, never 大陸用語.

---

## 2. Tech stack

- **Frontend:** Vite + React + TypeScript, Tailwind. Installable PWA (Add to Home Screen on iPad, full-screen, app icon).
- **Math rendering:** KaTeX (fractions, exponents, equations must render properly — never show raw `\frac`).
- **Backend:** Serverless functions (Netlify Functions or Vercel) as a proxy to the Claude API. **The API key lives only on the server.** Never put it in frontend code.
- **AI:** Claude API with image input (vision). Use `claude-sonnet-5-5` for tutoring/validation; model name in one config constant so it's easy to change.
- **Storage:** `localStorage`/IndexedDB on the iPad for pet state, history, and settings. No user accounts in v1.
- **Deploy:** a subdomain like `ashley.klchang.com.tw`.

---

## 3. Core flow (state machine)

```
拍題目 → 確認題目 → 引導解題（逐步提示）→ 拍解答 → 批改
   → 答對 → 寵物出現 🎉 → 練習題 1 → 批改 → 寵物 → 練習題 2 → 批改 → 寵物 → 完成
   → 答錯 → 指出哪一步怪怪的 → 回到引導 → 再拍一次
```

### 3.1 拍題目 (Capture problem)
- Big button: 「📷 拍下題目」. Use `<input type="file" accept="image/*" capture="environment">` (opens iPad camera directly; also allow choosing from photo library).
- Before upload: let her crop/rotate. Resize client-side to max ~1600px long edge, JPEG ~0.8 quality (keeps API cost and latency down).
- If the photo has several problems, ask: 「這張照片有好幾題，你要問哪一題？」 and show them as numbered choices.

### 3.2 確認題目 (Confirm problem)
- AI transcribes the problem; show it rendered with KaTeX: 「我看到的題目是這樣，對嗎？」
- Buttons: 「對！」 / 「不對，我要修改」 (simple editable text field).
- This step matters — misread handwriting/print is the #1 cause of wrong tutoring.

### 3.3 引導解題 (Guided steps — the heart of the app)

**Three-endpoint flow:**
1. `/api/analyze` — takes the photo, returns `{ problems: [{ problem_latex, problem_text, topic }] }` (always an array, even for a single problem). Fast: only transcribes, doesn't solve.
2. `/api/solve` — takes the **confirmed problem text** (no photo), returns `{ overview_hint, topic, final_answer, solution_steps }`. Each step is a one-sentence description (e.g. "把含 x 的項移到等號左邊"). Called only after she confirms or edits the problem. Does **not** generate hints — those come from `/api/hint` on demand.
3. `/api/hint` — generates a single hint on demand. Takes `{ problem_text, solution_steps, step_index, hint_level (1|2|3), final_answer, student_thought?, recent_messages? }`. Returns `{ message }`. Server-side answer leak check: if the response contains the final answer, retry once; if still leaked, return a safe fallback message.

Keep `final_answer` and `solution_steps` in app state but **never render them** until she has solved it.

**Overview hint (大方向提示):**
After `/api/solve` returns, before showing step 1, 跳跳 says the `overview_hint`: 1–2 sentences naming the problem type and goal, with **no numbers, no computation, no answer**. Example: 「這是一元一次方程式喔！我們的目標是讓 $x$ 自己站在等號一邊。想想看，要先處理什麼呢？」
Two buttons below:
- 「帶我一步一步來」→ enter step-by-step guidance (sets `usedHints = true`)
- 「我知道怎麼做了！」→ skip to 拍解答 (see **Skip** below)

**Step-by-step guidance:**
The UI shows **one step at a time** in a chat-style interface (跳跳 avatar left, her messages right in primary blue). On entering each step, 跳跳 automatically shows the level 1 hint (引導問題) via `/api/hint`.

Bottom action area (top to bottom):
- 「我的想法是…」 text input — she types her idea, 跳跳 responds to *her* reasoning via `/api/hint`
- 「再給我一點提示」 → escalate to next hint level (2 方向, then 3 示範)
- 「我還是卡住了」 → jump directly to level 3 示範
- 「這步做好了，下一步 →」 (primary button, always visible) — she presses when she's done with the step, advances to the next step
- 「我知道怎麼做了！」 (small text link in problem header) → skip remaining steps, go to 拍解答

After all steps are completed, 跳跳 says 「全部步驟都走完了！把你的算式拍下來給我看看吧！」 and shows a big 「📷 拍下我的算式」 button (no auto-navigate).

**Hint ladder per step (escalate only when she asks):**
1. **提問** (level 1, auto-shown) — a guiding question. e.g. 「題目要我們求什麼？」「你覺得要先處理括號還是先移項？」
2. **方向** (level 2) — name the strategy. e.g. 「試試看把有 x 的都放到等號左邊。」
3. **示範一小步** (level 3) — do just this one step, then hand it back: 「接下來換你！」

**Skip (跳過步驟):**
- 「我知道怎麼做了！」is available on the overview screen and every step screen (small text link in problem header).
- Pressing it skips directly to 「拍下我的算式」→ same validation flow.
- `usedHints` definition: pressing 「帶我一步一步來」from the overview sets `usedHints = true`. Only pressing 「我知道怎麼做了！」from the overview **and** answering correctly on the first try earns 點心 +2; otherwise +1.
- `solveLog` entries include the `usedHints` field.

**Progress persistence:**
- Current problem state (problem, solve result, currentStep, hintLevel, messages, usedHints) is saved to `localStorage` on every state change.
- On returning to the home screen, if saved progress exists, 跳跳 asks 「要繼續剛剛那題嗎？」 with 繼續/放棄 buttons.

Rules:
- Never reveal the final answer during guidance. `/api/hint` checks server-side.
- Max 2–3 short sentences per message.
- Always end with a question or a clear "your turn" so she does the thinking.
- All math in chat uses MathText (KaTeX rendering).

### 3.4 拍解答 → 批改 (Photograph work → validate)
- Button: 「📷 拍下我的算式」
- Server sends: original problem + stored solution + her work photo. Claude checks:
  - Is the final answer correct (equivalent forms accepted: `6/4 = 3/2 = 1.5`, `x=3` vs `3`)?
  - Is the process sound? Find the **first** line where something went wrong.
- Response JSON:
```json
{ "result": "correct" | "partially_correct" | "incorrect" | "unreadable",
  "first_error_line": "...",
  "feedback": "..." }
```
- **Correct:** celebrate, praise the effort/method (「你把移項做得很仔細！」), not "you're so smart".
- **Incorrect:** point to *where*, not the fix: 「第三行的正負號再檢查一次看看？」 Then she can retry or ask for a hint. Don't give the correct answer until 2 failed attempts; on the 3rd, walk through the corrected step kindly.
- **Unreadable:** 「字有點看不清楚，可以再拍一次嗎？光線亮一點會更好喔！」

### 3.5 練習題 ×2 (Reinforcement)
- Generate 2 problems on the **same skill**, same difficulty, different numbers/context. Second one can be slightly harder.
- Prefer clean answers (integers or simple fractions) appropriate for 國一.
- Server must **verify the answers** before showing: have Claude solve each generated problem independently a second time and compare; regenerate if they disagree. (LLMs occasionally botch arithmetic; a wrong "correct answer" would really confuse her.)
- She can answer by photo (same validation as 3.4) or by typing a short final answer.
- Same hint ladder available if she gets stuck.

### 3.6 螢幕寵物 (Screen pet)
- The pet is a **cartoon of our family dog** (reference photos in `/design/dog-ref/`). Key features to keep: black coat, floppy semi-folded ears, cream eyebrow dots above the eyes, grey muzzle, white chest blaze, white-tipped paws, pink collar with a yellow tag, pink tongue when happy. Use the SVG from the mockup canvas as the starting point.
- Poses/expressions needed: idle sitting (happy, eyes closed smile), curious (open eyes, head tilt — for the 批改 screen), cheering (front paws up, tail wag — celebration), small head avatar for tutor chat bubbles.
- After **every** solved problem (original + each practice), the pet pops onto the screen with a short animation and a line like 「哇！你又解出一題了！」
- Growth via **levels + accessories** (not changing the dog itself): level up at e.g. 1 / 5 / 15 / 30 / 50 solves, each unlocking an accessory (小領巾, 帽子, 眼鏡, 披風…) she can put on the dog.
- Each solve earns a 「點心」 she can feed it (bone/treat animation).
- Pet lives on the home screen idling (blinks, bounces) — tap for a cute reaction.
- Pet never gets sad/sick from inactivity (no guilt mechanics).
- Store state locally. Add export/import of pet state as a backup so it isn't lost if Safari data is cleared.
- Build with SVG + CSS animations (or Lottie). Keep it light so it runs smoothly on iPad.

### 3.7 Home & history
- Home: pet, 「📷 問一題」button, today's count 「今天解了 3 題」.
- History list: past problems (thumbnail + topic + 解出來了 ✓). Tap to review the steps.
- Topic tracker (simple): counts per topic, so the parent can see what she's practicing.

---

## 4. AI tutor system prompt (zh-TW, use as base)

```
你是一位溫柔、有耐心的數學家教，正在陪一位台灣國中一年級的學生解數學題。

說話方式：
- 用國一學生聽得懂的話，句子短、口氣親切，像學長姊在旁邊陪她想。
- 一次最多 2～3 句話。
- 使用台灣國中課本的用詞（108 課綱），例如：正負數、數線、絕對值、指數律、科學記號、
  因數、倍數、質因數分解、標準分解式、最大公因數、最小公倍數、一元一次方程式、移項、
  二元一次聯立方程式、直角坐標、比例式。
- 只用繁體中文和台灣用語，不可使用簡體字或大陸用語。
- 數學式用 LaTeX 寫在 $...$ 裡。

教學原則：
- 絕對不要一次給出完整解法或最後答案。一次只帶一步，然後停下來讓她自己想。
- 每次回覆都以一個問題或「換你試試看！」結尾。
- 她卡住時，依序給：引導問題 → 解題方向 → 示範這一小步。
- 她做錯時，指出「哪一步」可以再檢查，不要直接說出正確答案。
- 稱讚她的努力和方法，不要說「你好聰明」。
- 她說「我不會」或很挫折時，先安慰她，再把問題拆成更小的一步。

範圍與安全：
- 只聊數學和學習相關的事。如果她問別的事，溫和地說：「這個我不太能幫忙喔，我們繼續來解題吧！」
- 不要詢問她的姓名、學校、住址等個人資料。
- 如果她提到不舒服、難過或被欺負，溫柔地鼓勵她跟爸媽、老師或信任的大人說。
```

Each endpoint (`/analyze`, `/hint`, `/validate`, `/practice`) adds its own task instructions + required JSON schema on top of this. Use structured output / JSON mode and validate with zod on the server; on parse failure, retry once.

---

## 5. Curriculum context (國一)

- **上學期:** 整數與數線、整數四則運算、絕對值、指數律、科學記號、因數與倍數、質因數分解（標準分解式）、最大公因數與最小公倍數、分數運算、一元一次式、一元一次方程式（含應用題）
- **下學期:** 二元一次聯立方程式、直角坐標與二元一次方程式圖形、比與比例式、一元一次不等式、統計圖表

Put the topic list in a config file.

**Textbook: 康軒.** Set `TEXTBOOK = "康軒"` in config (with a settings dropdown for 康軒 / 南一 / 翰林 in case it changes). Add to the `/practice` and `/hint` task instructions: 「題目風格、用詞和難度請參考康軒版國一數學課本。」

---

## 6. Child safety & privacy

- Photos are sent to the API for processing only; **don't store them on the server**. Thumbnails stay on the iPad.
- No accounts, no ads, no analytics that identify her.
- AI scope is restricted to math (system prompt above + reject clearly off-topic inputs).
- Anthropic's usage policy allows API apps used by minors with appropriate safeguards — the restricted system prompt, no data collection, and adult oversight cover that here.

---

## 7. Cost & abuse protection

- The site URL is public, so add a **simple passcode/PIN** on first open (stored on device) and check a matching secret on the server, so strangers can't use your API credits.
- Rate limit per device (e.g. 60 AI calls/hour).
- Set a monthly spend cap in the Anthropic Console.
- Image resize (3.1) keeps per-call cost low.

---

## 8. UI & design notes

- Big touch targets (≥ 48px), large readable font (≥ 18px body) for iPad.
- Calm, friendly colors; light and dark mode.
- Loading states with friendly copy: 「我正在看你的題目…」「讓我想一想…」
- Works in landscape and portrait.
- Font: Noto Sans TC (400/500/700/900). Math: KaTeX. Her handwritten work is shown as her photo.

**Design tokens (from the approved mockups):**

| Token | Value | Use |
|---|---|---|
| `bg` | `#F3F6FB` | page background |
| `card` | `#FFFFFF` + border `#DCE3EE`, radius 24–28px | cards, chat bubbles |
| `ink` | `#1B2638` | main text |
| `muted` | `#4A5568` | secondary text |
| `primary` | `#2457C5` (pressed/shadow `#173E94`, soft `#E3EBFA`) | main buttons, active step |
| `pet` | `#F08A24` (soft `#FFF1DC`, celebration bg `#FFF6E8`) | 跳跳 progress bar, snacks |
| `success` | `#1F7A4D` (soft `#E2F4E9`) | 解出來了 / 答對了 |
| `fix` | `#B4441E` (soft `#FDEBE3`) | highlighted line to recheck — never harsh red |

Primary buttons are big (80–132px tall), rounded, with a solid 8–10px bottom shadow in the pressed color (a "pressable" look).

**Screens (approved mockups):**
1. **首頁** — header 數學小老師 + settings; 跳跳 card (sitting pose, name, 等級 + progress bar「再解 1 題就升級，解鎖新配件！」, 餵點心 button); huge 「拍下題目，問一題」 button; 今天 / 這星期 counts; 最近解過的題目 list.
2. **確認題目** — top bar: back + 4-step pills (1 確認題目 · 2 一步步解 · 3 批改 · 4 練習); her photo with 旋轉/裁切/重拍; 跳跳 head avatar + bubble 「我看到的題目是這樣，對嗎？」 with the KaTeX problem; buttons 不對，我要修改 / 對！開始解題.
3. **一步步解** — problem pinned at top with 第 N 步; chat (跳跳 avatar left, her messages right in primary blue); bottom panel: 「我的想法是…」 input, 再給我一點提示 / 我還是卡住了, big 「我懂了！拍下我的算式」.
4. **批改** — her work photo with the first wrong line outlined (dashed `fix` color, tag 再看一次); 跳跳 curious head + 差一點點 badge + feedback; 給我一點提示 / 改好了，再拍一次.
5. **跳跳出現** — warm background, confetti, 跳跳 cheer pose (bounce animation), 「哇！你又解出一題了！」, method praise, 點心 +1, level bar (等級 3 · 解鎖新配件), 再來挑戰 2 題練習題 / 今天先到這裡.
6. **練習題 1/2** — progress dots; problem card (康軒 7 上 label); answer by typing `x =` + 送出 or 拍下我的算式; 跳跳 small cheering + 需要提示.

**Pet art:** `/design/pet/` has the 跳跳 SVGs (`tiaotiao-sit`, `tiaotiao-cheer`, `tiaotiao-head-happy`, `tiaotiao-head-curious`). Use them as React components; animate with CSS (idle blink/bounce, cheer jump + tail wag). Reference photos of the real dog: `/design/dog-ref/`.

---

## 9. Build phases (tell Claude Code to do one at a time)

1. **Skeleton:** Vite/React/PWA, routes, home screen, camera capture + crop/resize, serverless proxy with passcode check.
2. **Analyze + confirm:** `/analyze` endpoint, transcription confirm/edit screen, KaTeX rendering.
3. **Guided steps:** hint ladder UI + `/hint` endpoint, "我的想法是…" input.
4. **Validate:** work-photo upload, `/validate`, retry logic.
5. **Practice:** `/practice` with answer double-check, 2-problem flow.
6. **Pet:** SVG pet, stages, celebration animation, feeding, naming, export/import.
7. **History & polish:** history list, topic counts, error handling, test on real iPad.

**Testing:** keep a folder of ~15 sample problem photos (printed + handwritten, each topic) and run them through `/analyze` and `/validate` after every prompt change. Check: correct transcription, no answer leaks during guidance, language level, Taiwan terms.
