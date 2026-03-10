import React, { useState, useCallback, createContext, useContext, useEffect } from 'react';
import {
  Project,
  createEmptyProject,
  loadProjectFromStorage,
  saveProjectToStorage,
} from '../types/project';
import { useAuthOptional } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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

async function fetchProjectFromSupabase(userId: string): Promise<Project | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('projects')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data?.data) return null;
  const parsed = data.data as unknown;
  if (parsed && typeof parsed === 'object' && parsed !== null && 'meta' in parsed && 'property' in parsed) {
    return parsed as Project;
  }
  return null;
}

async function upsertProjectToSupabase(userId: string, project: Project): Promise<void> {
  if (!supabase) return;
  await supabase.from('projects').upsert(
    { user_id: userId, data: project as unknown as Record<string, unknown> },
    { onConflict: 'user_id' }
  );
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthOptional();
  const user = auth?.user ?? null;
  const isSupabase = isSupabaseConfigured() && !!supabase;

  const [project, setProjectState] = useState<Project>(() => {
    const stored = loadProjectFromStorage();
    return stored ?? createEmptyProject();
  });

  // When user is signed in and Supabase is configured: load from Supabase or migrate localStorage.
  useEffect(() => {
    if (!user?.id || !isSupabase) return;

    let cancelled = false;
    (async () => {
      const fromServer = await fetchProjectFromSupabase(user.id);
      if (cancelled) return;
      if (fromServer) {
        setProjectState(fromServer);
        saveProjectToStorage(fromServer);
      } else {
        // No server project: migrate current (localStorage) project to Supabase.
        const current = loadProjectFromStorage();
        const toSave = current ?? createEmptyProject();
        await upsertProjectToSupabase(user.id, toSave);
        if (!cancelled && current) setProjectState(current);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, isSupabase]);

  const updateProject = useCallback(
    (updates: Partial<Project>) => {
      setProjectState((prev) => {
        const next = mergeProject(prev, updates);
        saveProjectToStorage(next);
        if (user?.id && isSupabase) {
          upsertProjectToSupabase(user.id, next);
        }
        return next;
      });
    },
    [user?.id, isSupabase]
  );

  const setProject = useCallback(
    (p: Project) => {
      setProjectState(p);
      saveProjectToStorage(p);
      if (user?.id && isSupabase) {
        upsertProjectToSupabase(user.id, p);
      }
    },
    [user?.id, isSupabase]
  );

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
