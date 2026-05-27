import { redirect } from 'next/navigation';

/**
 * Root entry → bounce to /dashboard, the operator's overview surface.
 * The (panel) AuthGuard then takes over and bounces unauthenticated
 * requests to /login.
 */
export default function RootPage() {
  redirect('/dashboard');
}
