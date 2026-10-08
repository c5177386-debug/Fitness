'use client';

import { useState, useTransition } from 'react';
import { useParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, localeNames, type Locale } from '@/i18n/routing';

/**
 * LanguageSwitcher — switches locale while preserving the current page path.
 * Implemented per next-intl docs for setups without middleware.
 */
export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const currentLocale = (params.locale as Locale) ?? routing.defaultLocale;

  const switchTo = (locale: Locale) => {
    setOpen(false);
    if (locale === currentLocale) return;
    startTransition(() => {
      router.replace(pathname, { locale });
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={isPending}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-primary-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
      >
        <span aria-hidden="true">🌐</span>
        <span className="hidden sm:inline">{localeNames[currentLocale]}</span>
        <span className="text-xs">▾</span>
      </button>

      {open && (
        <>
          {/* Click-away backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <ul
            role="listbox"
            className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 overflow-hidden"
          >
            {routing.locales.map((locale) => (
              <li key={locale}>
                <button
                  role="option"
                  aria-selected={locale === currentLocale}
                  onClick={() => switchTo(locale)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    locale === currentLocale
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {localeNames[locale]}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
