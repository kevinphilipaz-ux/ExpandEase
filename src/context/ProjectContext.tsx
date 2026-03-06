import React, { useState, useCallback, createContext, useContext, useEffect } from 'react';
import {
  Project,
  createEmptyProject,
  loadProjectFromStorage,
  saveProjectToStorage,
} from '../types/project';

interface ProjectContextType {
  project: Project;
  updateProject: (updates: Partial<Project>) => void;
  /** Replace entire project (e.g. after loading from API) */
  setProject: (project: Project) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const SECTION_KEYS: (keyof Project)[] = ['meta', 'homeowner', 'property', 'onboarding', 'wishlist', 'financial', 'notes', 'contractor'];

function mergeProject(prev: Project, updates: Partial<Project>): Project {
  const next = { ...prev };
  for (const key of Object.keys(updates) as (keyof Project)[]) {
    const val = updates[key];
    if (val === undefined) continue;
    if (SECTION_KEYS.includes(key) && typeof val === 'object' && val !== null && !Array.isArray(val)) {
      (next as Record<string, unknown>)[key] = { ...(prev[key] as object), ...(val as object) };
    } else {
      (next as Record<string, unknown>)[key] = val;
    }
  }
  return next;
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [project, setProjectState] = useState<Project>(() => {
    const stored = loadProjectFromStorage();
    return stored ?? createEmptyProject();
  });

  const updateProject = useCallback((updates: Partial<Project>) => {
    setProjectState((prev) => {
      const next = mergeProject(prev, updates);
      saveProjectToStorage(next);
      return next;
    });
  }, []);

  const setProject = useCallback((p: Project) => {
    setProjectState(p);
    saveProjectToStorage(p);
  }, []);

  return (
    <ProjectContext.Provider value={{ project, updateProject, setProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (ctx === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return ctx;
}

/** Optional hook: returns project if available, no throw */
export function useProjectOptional(): ProjectContextType | null {
  return useContext(ProjectContext) ?? null;
}
