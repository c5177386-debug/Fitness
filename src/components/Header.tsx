import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import LanguageSwitcher from './LanguageSwitcher';

const navLinks = [
  { href: '/tools/one-rep-max-calculator', labelKey: 'nav.oneRM' },
  { href: '/tools/tdee-calculator', labelKey: 'nav.tdee' },
  { href: '/tools/water-intake-calculator', labelKey: 'nav.water' },
] as const;

export default async function Header() {
  const t = await getTranslations('common');

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-slate-900 shrink-0">
            <span className="text-primary-600">💪</span>
            <span>{t('brand')}</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/tools"
              className="text-slate-600 hover:text-primary-600 font-semibold text-sm sm:text-base transition-colors"
            >
              {t('nav.allTools')}
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-slate-600 hover:text-primary-600 font-medium transition-colors"
                >
                  {t(link.labelKey)}
                </Link>
              ))}
            </nav>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}
