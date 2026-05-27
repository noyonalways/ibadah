import { redirect } from 'next/navigation';

/**
 * Root entry → bounce to /analytics, the new landing surface for the
 * trimmed admin nav. The (panel) AuthGuard then takes over and bounces
 * unauthenticated requests to /login.
 */
export default function RootPage() {
  redirect('/analytics');
}
