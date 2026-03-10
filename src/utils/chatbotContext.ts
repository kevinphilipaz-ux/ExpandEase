/**
 * Builds a minimal project summary for the in-app expert chatbot.
 * Send this (with user message) to your backend so the AI can advise using
 * the same context as the app. See docs/CHATBOT-DESIGN.md.
 *
 * For the AI to explain ROI and monthly savings the same way as the UI tooltips,
 * the backend should also inject getCalculationContextForChatbot() from
 * src/constants/calculationExplanations.ts into the system/context.
 */

import type { Project } from '../types/project';

export interface ProjectSummaryForChat {
  property: {
    address: string;
    beds: number;
    baths: number;
    sqft: number;
    currentValue?: number;
  };
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
  onboarding?: {
    goal: string;
    timeline: string;
    mortgageRate: number;
  };
}

/**
 * Build a short, PII-light summary of the current project for the chatbot context.
 * Omit or anonymize fields if you need to (e.g. address → "property on file").
 */
export function buildProjectSummaryForChat(project: Project | null): ProjectSummaryForChat | null {
  if (!project) return null;

  return {
    property: {
      address: project.property?.address ?? '',
      beds: project.property?.beds ?? 0,
      baths: project.property?.baths ?? 0,
      sqft: project.property?.sqft ?? 0,
      currentValue: project.property?.currentValue,
    },
    wishlist: {
      kitchenLevel: project.wishlist?.kitchenLevel ?? '',
      flooring: project.wishlist?.flooring ?? '',
      pool: project.wishlist?.pool ?? '',
      homeStyle: project.wishlist?.homeStyle ?? '',
      bedrooms: project.wishlist?.bedrooms ?? 0,
      bathrooms: project.wishlist?.bathrooms ?? 0,
    },
    financial: {
      totalCost: project.financial?.totalCost ?? 0,
      totalValue: project.financial?.totalValue ?? 0,
      monthlyIncome: project.financial?.monthlyIncome ?? 0,
      monthlyDebts: project.financial?.monthlyDebts ?? 0,
      currentMonthlyPayment: project.financial?.currentMonthlyPayment,
      downPaymentAtPurchase: project.financial?.downPaymentAtPurchase,
      existingMortgageBalance: project.financial?.existingMortgageBalance,
    },
    onboarding: project.onboarding
      ? {
          goal: project.onboarding.goal ?? '',
          timeline: project.onboarding.timeline ?? '',
          mortgageRate: project.onboarding.mortgageRate ?? 0,
        }
      : undefined,
  };
}
