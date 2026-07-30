import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { BrandMark } from '@/components/shared/brand-mark';
import { IslamicDivider } from '@/components/shared/islamic-divider';
import { Reveal } from '@/components/shared/reveal';
import { StaggerReveal } from '@/components/landing/stagger-reveal';

export function Footer() {
  const t = useTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-8 border-t border-border/50">
      <div className="container mx-auto px-4 py-14 md:py-16">
        <StaggerReveal className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]" stagger={80}>
          <div className="flex flex-col items-start gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <BrandMark size={36} />
              <div className="flex flex-col leading-none">
                <span className="text-base font-semibold tracking-tight">{t('Brand.name')}</span>
                <span className="mt-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {t('Brand.tagline')}
                </span>
              </div>
            </Link>
            <p className="mt-2 max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground">
              {t('Landing.footer_madeWith')}
            </p>
          </div>

          <FooterColumn title={t('Nav.features')}>
            <FooterLink href="/#pillars">{t('Nav.pillars')}</FooterLink>
            <FooterLink href="/#how">{t('Nav.tracking')}</FooterLink>
            <FooterLink href="/features">{t('Landing.footer_features')}</FooterLink>
            <FooterLink href="/ai">{t('Nav.ai')}</FooterLink>
          </FooterColumn>

          <FooterColumn title={t('Landing.footer_resources')}>
            <FooterLink href="/features">{t('Landing.footer_features')}</FooterLink>
            <FooterLink href="/releases">{t('Nav.releases')}</FooterLink>
            <FooterLink href="/about">{t('Landing.footer_about')}</FooterLink>
            <FooterLink href="/faq">{t('Landing.footer_faq')}</FooterLink>
            <FooterLink href="/privacy">{t('Landing.footer_privacy')}</FooterLink>
            <FooterLink href="/terms">{t('Landing.footer_terms')}</FooterLink>
          </FooterColumn>

          <FooterColumn title={t('Nav.account')}>
            <FooterLink href="/login">{t('Landing.footer_signin')}</FooterLink>
            <FooterLink href="/register">{t('Nav.register')}</FooterLink>
          </FooterColumn>
        </StaggerReveal>

        <Reveal variant="blur-up" delay={200}>
          <IslamicDivider className="mx-auto mt-12 max-w-sm" />
        </Reveal>

        <Reveal variant="fade-in" delay={300}>
          <p className="mt-8 text-center text-xs text-muted-foreground/80">
            © {year} {t('Brand.name')}. {t('Landing.footer_rights')}.
          </p>
        </Reveal>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-2.5 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  if (href.startsWith('/#') || href.startsWith('#')) {
    return (
      <li>
        <a href={href} className="text-foreground/70 transition-colors hover:text-foreground">
          {children}
        </a>
      </li>
    );
  }
  return (
    <li>
      <Link href={href} className="text-foreground/70 transition-colors hover:text-foreground">
        {children}
      </Link>
    </li>
  );
}
