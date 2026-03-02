import React, { useState, createContext, useContext } from 'react';
export interface OnboardingData {
  /** User's first name for personalization (e.g. tab title, greetings). Demo default: Kevin */
  firstName: string;
  address: string;
  goal: string;
  mortgageRate: number;
  income: number;
  timeline: string;
  choice: 'analysis' | 'visualization' | null;
}
interface OnboardingContextType {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}
const defaultData: OnboardingData = {
  firstName: 'Kevin', // Demo default; replace with real user data when available
  address: '',
  goal: '',
  mortgageRate: 3.5,
  income: 150000,
  timeline: '',
  choice: null
};
const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);
export function OnboardingProvider({ children }: {children: ReactNode;}) {
  const [data, setData] = useState<OnboardingData>(defaultData);
  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({
      ...prev,
      ...updates
    }));
  };
  return (
    <OnboardingContext.Provider
      value={{
        data,
        updateData
      }}>

      {children}
    </OnboardingContext.Provider>);

}
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}