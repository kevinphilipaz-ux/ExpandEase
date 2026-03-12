import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { App } from './App';
import { LandingPage } from './pages/LandingPage';
import { OnboardingFlow } from './pages/OnboardingFlow';
import { DesignPackage } from './pages/DesignPackage';
import { ForContractors } from './pages/ForContractors';
import { ForLenders } from './pages/ForLenders';
import { ContractorReview } from './pages/ContractorReview';
import { ApprovedProjectPlan } from './pages/ApprovedProjectPlan';
import { OnboardingProvider, useOnboarding } from './context/OnboardingContext';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider, useProjectOptional } from './context/ProjectContext';

/** Sets the browser tab title to a personalized value per route (e.g. "Kevin's Dream Home Analysis | ExpandEase"). */
function DocumentTitle() {
  const { data } = useOnboarding();
  const project = useProjectOptional();
  const location = useLocation();
  const firstName = (project?.project?.homeowner?.firstName || data?.firstName || '').toString().trim();

  useEffect(() => {
    const base = 'ExpandEase';
    const titles: Record<string, string> = {
      '/': `${base} – Plan Your Dream Home`,
      '/onboarding': firstName ? `${firstName}'s Onboarding | ${base}` : `Onboarding | ${base}`,
      '/analysis': firstName ? `${firstName}'s Dream Home Analysis | ${base}` : `Dream Home Analysis | ${base}`,
      '/design-package': firstName ? `${firstName}'s Design Package | ${base}` : `Design Package | ${base}`,
      '/contractor-review': `Contractor Review | ${base}`,
      '/approved-project-plan': `Approved Project Plan | ${base}`,
    };
    document.title = titles[location.pathname] ?? base;
  }, [location.pathname, firstName]);

  return null;
}

export function AppRouter() {
  return (
    <OnboardingProvider>
      <AuthProvider>
      <ProjectProviderWrapper>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <DocumentTitle />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/onboarding" element={<OnboardingFlow />} />
          <Route path="/analysis" element={<App />} />
          <Route path="/design-package" element={<DesignPackage />} />
          <Route path="/for-contractors" element={<ForContractors />} />
          <Route path="/for-lenders" element={<ForLenders />} />
          <Route path="/contractor-review" element={<ContractorReview />} />
          <Route path="/approved-project-plan" element={<ApprovedProjectPlan />} />
        </Routes>
      </BrowserRouter>
      </ProjectProviderWrapper>
      </AuthProvider>
    </OnboardingProvider>
  );
}

/** Wraps router children with ProjectProvider so project is available on all routes. */
function ProjectProviderWrapper({ children }: { children: React.ReactNode }) {
  return <ProjectProvider>{children}</ProjectProvider>;
}