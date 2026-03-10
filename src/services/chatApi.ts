/**
 * Client for the Dream Home chat API. Sends conversation + project summary
 * so the LLM can answer with full context (backend math + their inputs).
 */

const CHAT_API =
  typeof import.meta.env?.VITE_CHAT_API_URL === 'string' && import.meta.env.VITE_CHAT_API_URL !== ''
    ? import.meta.env.VITE_CHAT_API_URL
    : '/api';

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

export async function sendChat({ messages, projectSummary }: SendChatOptions): Promise<SendChatResult> {
  const res = await fetch(`${CHAT_API}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, projectSummary }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = (body as { detail?: string })?.detail ?? res.statusText;
    throw new Error(detail || `Chat request failed (${res.status})`);
  }

  const data = (await res.json()) as SendChatResult;
  if (!data?.message?.content) {
    throw new Error('Empty response from chat');
  }
  return data;
}
