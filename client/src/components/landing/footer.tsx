import { useTranslations } from 'next-intl';
import { BrandMark } from '@/components/shared/brand-mark';
import { IslamicDivider } from '@/components/shared/islamic-divider';

export function Footer() {
  const t = useTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border/40 bg-card/30">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandMark size={36} />
          <div>
            <p className="text-base font-semibold tracking-tight">{t('Brand.name')}</p>
            <p className="mt-0.5 text-xs uppercase tracking-[0.22em] text-muted-foreground">
              {t('Brand.tagline')}
            </p>
          </div>
        </div>

        <IslamicDivider className="mx-auto mt-10 max-w-sm" />

        <p className="mt-8 text-center text-xs text-muted-foreground/80">
          © {year} {t('Brand.name')}. {t('Landing.footer_rights')}.
        </p>
      </div>
    </footer>
  );
}
