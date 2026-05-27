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
import { useLogin } from '@/hooks/use-auth';
import { ApiClientError } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
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
      subtitle="Use your Ibadah credentials to enter the operations console."
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
          Heads up: the server does not yet enforce an admin role. Any
          authenticated user can sign in here and operate on their own data
          until the <code className="rounded bg-card px-1">isAdmin</code>
          {' '}flag and <code className="rounded bg-card px-1">requireAdmin</code>
          {' '}middleware land. See <code>design.md §10.3</code>.
        </p>
      </form>
    </AuthShell>
  );
}
