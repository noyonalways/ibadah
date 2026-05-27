import { redirect } from 'next/navigation';

/**
 * Root entry → bounce to the dashboard. The (panel) AuthGuard takes
 * over and redirects to /login when there is no session.
 */
export default function RootPage() {
  redirect('/dashboard');
}
