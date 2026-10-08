import { defineRouting } from 'next-intl/routing';

/**
 * Locale routing configuration.
 * No middleware (static export) — links must use the locale-aware Link
 * from '@/i18n/navigation', and generateStaticParams emits all locales at build.
 */
export const routing = defineRouting({
  locales: ['en', 'zh-CN', 'zh-TW'],
  defaultLocale: 'en',
  // Always show prefix: /en/..., /zh-CN/..., /zh-TW/...
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
};
