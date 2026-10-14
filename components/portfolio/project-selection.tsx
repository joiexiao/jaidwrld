"use client";

// project-selection.tsx — state "project aktif" yang di-share antar-route.
// Fungsi: menyimpan slug project aktif supaya elemen shared View Transition
//         (card di home ⇄ panel di detail) punya `name` yang konsisten saat
//         balik dari halaman detail. Diletakkan di layout (portfolio) yang
//         TIDAK unmount saat navigasi, jadi state-nya bertahan.
// Catatan: provider ini client; layout tetap server dan menurunkan children
//          (server component) sebagai props.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ProjectSelectionValue = {
  /** Slug project yang terakhir dilihat (null sebelum dipilih). */
  activeSlug: string | null;
  /** Set slug aktif (dipanggil carousel di home & saat detail mount). */
  setActiveSlug: (slug: string) => void;
};

const ProjectSelectionContext = createContext<ProjectSelectionValue | null>(
  null,
);

export function ProjectSelectionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [activeSlug, setActiveSlugState] = useState<string | null>(null);

  const setActiveSlug = useCallback((slug: string) => {
    setActiveSlugState((current) => (current === slug ? current : slug));
  }, []);

  const value = useMemo(
    () => ({ activeSlug, setActiveSlug }),
    [activeSlug, setActiveSlug],
  );

  return (
    <ProjectSelectionContext.Provider value={value}>
      {children}
    </ProjectSelectionContext.Provider>
  );
}

export function useProjectSelection(): ProjectSelectionValue {
  const context = useContext(ProjectSelectionContext);

  if (!context) {
    throw new Error(
      "useProjectSelection harus dipakai di dalam ProjectSelectionProvider",
    );
  }

  return context;
}
