'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';

import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin, useLogout } from '@/hooks/use-auth';
import { ApiClientError } from '@/lib/api';
import { isAdmin } from '@/store/auth-store';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const login = useLogin();
  const logout = useLogout();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const user = await login.mutateAsync(values);

      // Strict admin enforcement at sign-in time. We surface a clear
      // error and immediately scrub the local session so the
      // /api/v1/admin/* routes can never be hit with a non-admin token.
      if (!isAdmin(user)) {
        logout();
        toast.error('This account does not have admin access.');
        return;
      }

      toast.success('Signed in');
      router.push('/dashboard');
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Could not sign in';
      toast.error(msg);
    }
  });

  return (
    <AuthShell
      title="Sign in to Admin"
      subtitle="Use your Ibadah admin credentials to enter the operations console."
      footer={
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5" />
          Authorized personnel only
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting || login.isPending}>
          {(isSubmitting || login.isPending) && <Loader2 className="size-4 animate-spin" />}
          Sign in
        </Button>

        <p className="rounded-md border border-dashed border-border/60 bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
          The admin role is granted server-side. To create the first admin, run{' '}
          <code className="rounded bg-card px-1">pnpm seed:admin</code> in{' '}
          <code className="rounded bg-card px-1">server/</code> after setting{' '}
          <code className="rounded bg-card px-1">ADMIN_EMAIL</code> and{' '}
          <code className="rounded bg-card px-1">ADMIN_PASSWORD</code> in your env. Other users
          will be turned away here.
        </p>
      </form>
    </AuthShell>
  );
}
