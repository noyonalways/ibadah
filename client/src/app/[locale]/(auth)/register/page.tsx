'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Link, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthShell } from '@/components/auth/auth-shell';
import { useRegister } from '@/hooks/use-auth';
import { ApiClientError } from '@/lib/api';

const schema = z.object({
  name: z.string().min(2, 'Name is too short').max(80),
  email: z.string().email(),
  password: z.string().min(8, 'At least 8 characters').max(128),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const reg = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await reg.mutateAsync(values);
      toast.success('Account created');
      router.push('/dashboard');
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Registration failed';
      toast.error(msg);
    }
  });

  return (
    <AuthShell
      title={t('registerTitle')}
      subtitle={t('registerSubtitle')}
      footer={
        <span>
          {t('haveAccount')}{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t('switchToLogin')}
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">{t('nameLabel')}</Label>
          <Input id="name" autoComplete="name" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">{t('emailLabel')}</Label>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">{t('passwordLabel')}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting || reg.isPending}>
          {(isSubmitting || reg.isPending) && <Loader2 className="size-4 animate-spin" />}
          {t('submitRegister')}
        </Button>
      </form>
    </AuthShell>
  );
}
