import React, { useEffect, Component } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { App } from './App';
import { LandingPage } from './pages/LandingPage';
import { OnboardingFlow } from './pages/OnboardingFlow';
import { DesignPackage } from './pages/DesignPackage';
import { ForContractors } from './pages/ForContractors';
import { ForLenders } from './pages/ForLenders';
import { ContractorReview } from './pages/ContractorReview';
import { ApprovedProjectPlan } from './pages/ApprovedProjectPlan';
import { ProjectSummary } from './pages/ProjectSummary';
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
      '/summary': firstName ? `${firstName}'s Project Summary | ${base}` : `Project Summary | ${base}`,
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
      <BrowserRouter future={{ v7_relativeSplatPath: true }}>
        <DocumentTitle />
        <Routes>
          <Route path="/" element={<RouteErrorBoundary><LandingPage /></RouteErrorBoundary>} />
          <Route path="/onboarding" element={<RouteErrorBoundary><OnboardingFlow /></RouteErrorBoundary>} />
          <Route path="/analysis" element={<RouteErrorBoundary><App /></RouteErrorBoundary>} />
          <Route path="/summary" element={<RouteErrorBoundary><ProjectSummary /></RouteErrorBoundary>} />
          <Route path="/design-package" element={<RouteErrorBoundary><DesignPackage /></RouteErrorBoundary>} />
          <Route path="/for-contractors" element={<RouteErrorBoundary><ForContractors /></RouteErrorBoundary>} />
          <Route path="/for-lenders" element={<RouteErrorBoundary><ForLenders /></RouteErrorBoundary>} />
          <Route path="/contractor-review" element={<RouteErrorBoundary><ContractorReview /></RouteErrorBoundary>} />
          <Route path="/approved-project-plan" element={<RouteErrorBoundary><ApprovedProjectPlan /></RouteErrorBoundary>} />
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

/** Catches render-time crashes and shows a readable error instead of silently reverting. */
interface EBState { error: Error | null }
class RouteErrorBoundary extends Component<{ children: React.ReactNode }, EBState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error): EBState {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 bg-purple-950 text-white">
          <p className="text-xl font-semibold text-red-400">Page failed to render</p>
          <pre className="text-xs bg-black/40 p-4 rounded-xl max-w-2xl w-full overflow-auto whitespace-pre-wrap text-red-300">
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => { this.setState({ error: null }); window.history.back(); }}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm"
          >
            ← Go Back
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}