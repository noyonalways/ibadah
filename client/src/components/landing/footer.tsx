import { useTranslations } from 'next-intl';
import { Moon } from 'lucide-react';

export function Footer() {
  const t = useTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 bg-card/30">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <Moon className="size-3.5" />
          </span>
          <span className="font-medium">{t('Brand.name')}</span>
          <span className="text-muted-foreground/70">— {t('Brand.tagline')}</span>
        </div>
        <p>
          © {year} {t('Brand.name')}. {t('Landing.footer_rights')}.
        </p>
      </div>
    </footer>
  );
}
