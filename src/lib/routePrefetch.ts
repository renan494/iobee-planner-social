// Map of route paths to their dynamic import factories.
// Used by sidebar links to prefetch chunks on hover/focus, so navigation feels instant.
const PREFETCHERS: Record<string, () => Promise<unknown>> = {
  "/criar": () => import("@/pages/CreatePost"),
  "/calendario": () => import("@/pages/CalendarPage"),
  "/clientes": () => import("@/pages/Clients"),
  "/analistas": () => import("@/pages/Analysts"),
  "/rascunhos": () => import("@/pages/Drafts"),
  "/estrategia": () => import("@/pages/Strategy"),
  "/copy": () => import("@/pages/CopyHub"),
  "/copy/engenharia-reversa": () => import("@/pages/ReverseEngineerCopy"),
  "/admin/usuarios": () => import("@/pages/AdminUsers"),
  "/perfil": () => import("@/pages/MyProfile"),
};

const prefetched = new Set<string>();

export function prefetchRoute(path: string) {
  if (prefetched.has(path)) return;
  const fn = PREFETCHERS[path];
  if (!fn) return;
  prefetched.add(path);
  // Fire and forget; ignore errors (chunk will retry on real navigation).
  fn().catch(() => prefetched.delete(path));
}
