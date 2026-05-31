'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';

import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { useLogin } from '@/hooks/use-auth';
import { ApiClientError } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const login = useLogin();
  const t = useTranslations('Auth');

  // The schema is defined inside the component so error messages get
  // the active locale's strings.
  const schema = z.object({
    email: z.string().email(t('validEmail')),
    password: z.string().min(1, t('passwordRequired')),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      toast.success(t('signedIn'));
      router.push('/dashboard');
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : t('couldNotSignIn');
      toast.error(msg);
    }
  });

  return (
    <AuthShell
      title={t('loginTitle')}
      subtitle={t('loginSubtitle')}
      footer={
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5" />
          {t('loginFooter')}
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t('email')}</Label>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">{t('password')}</Label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting || login.isPending}>
          {(isSubmitting || login.isPending) && <Loader2 className="size-4 animate-spin" />}
          {t('signIn')}
        </Button>
      </form>
    </AuthShell>
  );
}
