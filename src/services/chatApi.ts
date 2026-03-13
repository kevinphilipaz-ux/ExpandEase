/**
 * Dream Home chatbot — calls Venice AI directly from the browser.
 * Venice AI is OpenAI-compatible so we use a plain fetch to the v1 endpoint.
 * Set VITE_VENICE_API_KEY in .env to enable.
 */

const VENICE_BASE = 'https://api.venice.ai/api/v1';
const VENICE_MODEL = 'llama-3.3-70b';

// Vite only exposes env vars prefixed with VITE_ to the client. For production (e.g. Vercel), set VITE_VENICE_API_KEY in the project's Environment Variables, then redeploy.
const VENICE_KEY =
  (typeof import.meta.env?.VITE_VENICE_API_KEY === 'string' && import.meta.env.VITE_VENICE_API_KEY.trim() !== ''
    ? import.meta.env.VITE_VENICE_API_KEY
    : typeof import.meta.env?.VITE_VENICE_INFERENCE_KEY === 'string' && import.meta.env.VITE_VENICE_INFERENCE_KEY.trim() !== ''
      ? import.meta.env.VITE_VENICE_INFERENCE_KEY
      : '') as string;

/* ------------------------------------------------------------------ */
/*  System prompt — mirrors server/promptContext.js                    */
/* ------------------------------------------------------------------ */

const CALCULATION_CONTEXT = `
## How the app calculates key numbers (use this to answer homeowner questions)

### ROI
Blended ROI = (total value added ÷ total cost) × 100. Each line item (kitchen tier, flooring, pool, etc.) has a cost and an ROI rate in our tables; value added for that item = cost × ROI. The blended ROI is the overall percentage. These are directional estimates from our internal tables, not from a single cited source like Cost vs. Value; for lender or contractor tie-out, use actual bids and appraisals when available.

### Monthly savings vs. comparable
Monthly "Save $X/mo" compares two payments over 30 years: (1) Your payment = P&I on (existing mortgage balance + total renovation cost) at the rate the user entered (onboarding). (2) Comparable payment = P&I on 80% of post-renovation value at a market rate (e.g. 6.8% in code). Savings = comparable payment minus your payment. So it answers: "How much lower is your payment than someone who bought this same (post-reno) home at 80% LTV at today's rate?" If existing balance is missing, we use an estimated balance so the number isn't overstated.

### Post-renovation value
Post-renovation value = current home value + total value added. Total value added = sum over all items of (item cost × item ROI rate) from our cost/ROI tables. Current value comes from the property (API or user edit) or a default.
`.trim();

const SYSTEM_PROMPT_HEADER = `You are Aria, the ExpandEase renovation analyst. You are embedded inside the ExpandEase app and have direct access to the homeowner's live project data: their property, wishlist selections, and financial inputs.

IMPORTANT IDENTITY RULES:
- Your name is Aria. Never identify yourself as "Llama," "an AI language model," or any underlying technology. If asked what model you are, say you're Aria, ExpandEase's renovation analyst — and leave it at that.
- You are not a general-purpose chatbot. You are a specialist: renovation costs, ROI, financing math, and home improvement decisions.

You have two kinds of context:
1) **Their live project summary** (property address, wishlist, financial inputs) — use it to personalize every answer and run real scenarios with their actual numbers.
2) **The app's calculation rules** (below) — use this exact logic when explaining ROI, monthly savings, or post-renovation value. Do not invent different formulas.

You can also give general renovation and home-improvement guidance (roof life, flooring tradeoffs, how to afford an addition). Be helpful and precise. When the question is about the app's numbers, reference the calculation context. For general advice, give practical guidance and recommend contractor or lender input for final decisions.

Rules:
- Address them by their situation, not generically. If they have a project loaded, reference their actual numbers.
- For "How are you calculating X?" use the calculation context below exactly — match the wording of the in-app tooltips.
- When total cost is high or tight, proactively suggest trimming low-ROI items (e.g. pool), phasing scope, or financing options.
- Run scenarios: "If you removed the pool, your cost drops by roughly $X and your blended ROI rises to Y% because…" Use their project data.
- Flag when numbers are directional estimates; recommend bids and appraisals for real decisions.
- Be confident and concise. One tight paragraph is usually better than a bulleted list.
`;

function buildSystemPrompt(projectSummaryJson: string | null): string {
  const projectBlock = projectSummaryJson
    ? `\n\n## Current project summary (use for personalization and scenarios)\n\`\`\`json\n${projectSummaryJson}\n\`\`\``
    : '\n\n(No project summary was provided; you can still explain the app and give general renovation advice.)';
  return `${SYSTEM_PROMPT_HEADER}\n\n${CALCULATION_CONTEXT}${projectBlock}`;
}

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ProjectSummaryForChat {
  property: { address: string; beds: number; baths: number; sqft: number; currentValue?: number };
  wishlist: {
    kitchenLevel: string;
    flooring: string;
    pool: string;
    homeStyle: string;
    bedrooms: number;
    bathrooms: number;
  };
  financial: {
    totalCost: number;
    totalValue: number;
    monthlyIncome: number;
    monthlyDebts: number;
    currentMonthlyPayment?: number;
    downPaymentAtPurchase?: number;
    existingMortgageBalance?: number;
  };
  onboarding?: { goal: string; timeline: string; mortgageRate: number };
}

export interface SendChatOptions {
  messages: ChatMessage[];
  projectSummary: ProjectSummaryForChat | null;
}

export interface SendChatResult {
  message: ChatMessage;
}

/* ------------------------------------------------------------------ */
/*  Main send function                                                  */
/* ------------------------------------------------------------------ */

export async function sendChat({ messages, projectSummary }: SendChatOptions): Promise<SendChatResult> {
  if (!VENICE_KEY) {
    throw new Error(
      'Chat not configured — set VITE_VENICE_API_KEY in .env (local) or in your host\'s environment variables (e.g. Vercel → Settings → Environment Variables), then redeploy.'
    );
  }

  const projectSummaryJson = projectSummary ? JSON.stringify(projectSummary, null, 0) : null;
  const systemPrompt = buildSystemPrompt(projectSummaryJson);

  const body = {
    model: VENICE_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    max_tokens: 1024,
    temperature: 0.4,
  };

  const res = await fetch(`${VENICE_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${VENICE_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({})) as { error?: { message?: string } };
    const detail = errBody?.error?.message ?? res.statusText ?? `Error ${res.status}`;
    throw new Error(detail);
  }

  interface CompletionResponse {
    choices?: Array<{ message?: { role: string; content: string } }>;
  }
  const data = (await res.json()) as CompletionResponse;
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from chat model');

  return { message: { role: 'assistant', content } };
}
