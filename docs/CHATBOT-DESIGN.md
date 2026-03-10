# In-app expert chatbot — homeowner assistant

The chatbot is an **assistant to the homeowner** building their dream home in the app.

---

## How to run the chat (LLM + backend + project context)

1. **Backend (Node)**  
   From the project root:
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env and set OPENAI_API_KEY=sk-...
   npm run dev
   ```
   The server runs on **http://localhost:3001**. It exposes `POST /api/chat` and uses the system prompt in `server/promptContext.js` (calculation context + advisor rules) plus the **project summary** sent by the frontend.

2. **Frontend**  
   Start the app as usual (`npm run dev`). Vite proxies `/api` to the backend, so the chat UI sends `messages` + `projectSummary` to the server. The server injects:
   - The **system prompt** (Dream Home analyst role + rules).
   - The **calculation context** (how ROI, monthly savings, and post-reno value are computed — same logic as the in-app tooltips).
   - The **current project summary** (property, wishlist, financial, onboarding) so the AI can personalize and run scenarios.

3. **What the user can ask**  
   Examples the analyst can handle:
   - *"Do you think I need a new roof if mine is only 10 years old?"* — General guidance (roof life, when to replace).
   - *"What's the difference between luxury vinyl flooring and hardwood?"* — Comparison and tradeoffs.
   - *"How are you calculating the monthly savings?"* — Uses the calculation context (same as the tooltip).
   - *"How can I afford to add another bedroom?"* — Uses their project (income, costs, budget) to suggest tradeoffs, phasing, or trimming other scope.

   The backend keeps **one source of truth** for “how we calculate” in `server/promptContext.js`. When you change `src/constants/calculationExplanations.ts` (e.g. for tooltips), sync the `CALCULATION_CONTEXT` in `server/promptContext.js` so the chat stays consistent.


## How the chatbot gets context (why it's not "just ChatGPT")

With your OpenAI key, **every request** sends the model a long **system message** that already contains everything it needs. It does **not** rely on the model's general training; it gets your app's rules and the user's data in that message.

**1. Website / backend "how it works"** — The server builds one **system prompt** per request in `server/promptContext.js`: role and rules ("You are the Dream Home analyst. Use the calculation context below.") plus the **calculation context** (exact text for ROI, monthly savings, post-renovation value — same logic as the in-app tooltips). That full text is sent to the LLM as the **system** message, so the model "sees" your website's math on every turn.

**2. The user's inputs** — The frontend sends `buildProjectSummaryForChat(project)` with every request. The server appends it to the system prompt as a **"Current project summary"** JSON block (property, wishlist, financial, onboarding). So when they ask "How can I afford to add another bedroom?", the model has their real numbers.

**3. What gets sent to OpenAI** — (1) One **system message**: role + rules + calculation context + JSON of their project. (2) **Conversation history**: all prior user and assistant messages. So the model has both "how the website works" and "what this user entered" every time. That's why it's **more intelligent than standard ChatGPT**: ChatGPT has no access to your formulas or their project; here, both are injected.

**Verify it's working:** Ask "How are you calculating the monthly savings?" — the answer should match the tooltip logic. Ask "How can I afford to add another bedroom?" after entering data — the answer should refer to their numbers.

---

## Goals

- **Explain the math**: Answer “How are you calculating ROI?” and “How are you calculating my monthly savings?” using the **exact same wording** as the tooltips next to those metrics (single source of truth: `src/constants/calculationExplanations.ts`).
- **Be the “perfect analyst”**: Describe the website’s assumptions and formulas next to the user’s inputs. Doesn’t need to be perfect or replace a human—it’s a transparent analyst who can cite how numbers are derived.
- **Proactive companion**: Do what the site does passively, but actively:
  - When the project is getting too expensive, **recommend areas to optimize** (e.g. trim low-ROI items, reduce scope) right away.
  - **Suggest personal-life tradeoffs** (where they could save to pay for the renovation period).
  - **Run scenarios** with the user: “What if I drop the pool?” “What if I do the kitchen next year?”
- **ChatGPT-like, with full context**: All of the user’s inputs (property, wishlist, financial) plus the website’s math and defensibility. The user can ask anything; the AI answers with their data and the real formulas.

## Single source of truth: tooltips + chatbot

- **`src/constants/calculationExplanations.ts`** defines:
  - `CALCULATION_TOOLTIPS` — short copy for the **(i) tooltips** next to “Monthly savings”, “ROI”, and “Est. future value” in the UI.
  - `CALCULATION_EXPLANATIONS_FOR_CHATBOT` / `getCalculationContextForChatbot()` — same facts in slightly longer form for the chatbot context.
- The **tooltips** (e.g. on Wishlist summary) and the **chatbot** both use this so they never contradict. When the homeowner asks “How do you calculate ROI?”, the chatbot’s answer matches what they’d see in the tooltip.

## How to give the chatbot “special knowledge”

### 1. System prompt (role + authority)

The model should be instructed to:

- Act as the **ExpandEase Dream Home analyst** for the homeowner: explain calculations, run scenarios, and advise on tradeoffs.
- Use **only** the calculation explanations and project summary provided in context (no inventing formulas).
- Be **proactive**: if their project cost is high relative to their budget or income, suggest optimizations (e.g. “Consider trimming the pool—it has lower ROI”) and personal savings ideas.
- Be **transparent**: call out when numbers are directional estimates, not guarantees; suggest they get contractor bids and lender advice for real decisions.

Example (trim to fit token budget):

```text
You are the ExpandEase Dream Home analyst. You help the homeowner understand how their numbers are calculated and make decisions about their renovation.

You have:
- Their current project summary (property, wishlist, financial).
- The app’s official calculation explanations (ROI, monthly savings, post-renovation value). Use this wording when explaining; it matches the tooltips they see in the app.

You must:
- Answer “how do you calculate X?” using exactly the logic in the calculation explanations.
- When their total cost is high or over budget, proactively suggest: trimming low-ROI items, phasing scope, or areas in their personal budget they could save to fund the reno.
- Run scenarios with them: “If you drop the pool, your cost would drop by about $X and your ROI would rise because…”
- Be clear that estimates are directional; recommend contractor bids and lender input for final decisions.
```

### 2. Context payload per request

| Piece | Purpose |
|-------|--------|
| **Project summary** | From `buildProjectSummaryForChat(project)` in `src/utils/chatbotContext.ts`. Property, wishlist selections, financial totals, onboarding (goal, timeline, rate). |
| **Calculation explanations** | From `getCalculationContextForChatbot()` in `src/constants/calculationExplanations.ts`. Same facts as the tooltips, so the AI explains ROI and monthly savings consistently. |
| **Optional** | Full or summarized `docs/ASSUMPTIONS-AND-SOURCES.md` for “where do these numbers come from?” and tie-out. |

### 3. Where it runs

- **Backend** (recommended): API receives `{ message, projectSummary }`, injects `getCalculationContextForChatbot()` (and optionally ASSUMPTIONS-AND-SOURCES), builds the system prompt, calls your LLM, returns/streams the reply. Keeps keys and long docs server-side.
- **Frontend** only assembles the project summary and sends it with the user message.

### 4. Wiring the UI

- **ChatBanner.tsx** (and/or “Chat with an expert” in the footer): on send, call your backend with `message` and `buildProjectSummaryForChat(project)`; render the assistant reply.
- **Tooltips**: “Monthly savings”, “ROI”, and “Est. future value” in the Wishlist (and elsewhere) already use `InfoTooltip` + `CALCULATION_TOOLTIPS`. The chatbot should receive the matching text via `getCalculationContextForChatbot()`.

## Summary

| What | How |
|------|-----|
| **Same wording as UI** | Tooltips and chatbot both use `calculationExplanations.ts`. |
| **Explain ROI / monthly savings** | AI gets `getCalculationContextForChatbot()` in context; answers match tooltips. |
| **Proactive** | System prompt tells the AI to suggest optimizations and personal savings when cost is high. |
| **Run scenarios** | User can ask “what if I change X?”; AI uses their project summary and the same math. |
| **Defensibility** | AI cites the app’s formulas and calls out estimates; doesn’t replace human advice. |

The chatbot is the homeowner’s in-app analyst: it knows their inputs, knows the backend math (from the same schematic as the tooltips), and can advise and run scenarios with them—without needing to be perfect or replace a real advisor.
