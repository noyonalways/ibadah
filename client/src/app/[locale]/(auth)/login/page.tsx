'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Link, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { AuthShell } from '@/components/auth/auth-shell';
import { GoogleButton } from '@/components/auth/google-button';
import { useCurrentUser, useLogin } from '@/hooks/use-auth';
import { ApiClientError } from '@/lib/api';

export default function LoginPage() {
  const t = useTranslations('Auth');
  const tCommon = useTranslations('Common');
  const router = useRouter();
  const login = useLogin();

  // Already signed in? Don't show the form again — send them to the app.
  const { user, hasHydrated } = useCurrentUser();
  useEffect(() => {
    if (hasHydrated && user) router.replace('/dashboard');
  }, [hasHydrated, user, router]);

  const schema = z.object({
    email: z.string().email(t('validation_emailInvalid')),
    password: z.string().min(1, t('validation_passwordRequired')),
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
      toast.success(t('loginSuccess'));
      router.push('/dashboard');
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : t('loginError');
      toast.error(msg);
    }
  });

  return (
    <AuthShell
      title={t('loginTitle')}
      subtitle={t('loginSubtitle')}
      footer={
        <span>
          {t('noAccount')}{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            {t('switchToRegister')}
          </Link>
        </span>
      }
    >
      <div className="space-y-5">
        <GoogleButton disabled={isSubmitting || login.isPending} />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="h-px w-full bg-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {tCommon('or')}
            </span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">{t('emailLabel')}</Label>
            <Input id="email" type="email" autoComplete="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">{t('passwordLabel')}</Label>
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
            {t('submitLogin')}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
