import type { Metadata } from 'next';
import {
  getTranslations,
  unstable_setRequestLocale as setRequestLocale,
} from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { absoluteUrl, CONTACT_EMAIL } from '@/lib/site';
import LegalPageLayout from '@/components/LegalPageLayout';
import { hydrateBlocks, type LegalBlock } from '@/lib/legal-content';

const LAST_UPDATED = '2026-09-30';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'about' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
    alternates: {
      canonical: `/${locale}/about`,
      languages: {
        en: '/en/about',
        'zh-CN': '/zh-CN/about',
        'zh-TW': '/zh-TW/about',
        'x-default': '/en/about',
      },
    },
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
      type: 'website',
      url: absoluteUrl(`${locale}/about`),
    },
  };
}

export default async function AboutPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'about' });
  const blocks = hydrateBlocks(t.raw('blocks') as LegalBlock[], {
    email: CONTACT_EMAIL,
  });

  return (
    <LegalPageLayout
      title={t('pageTitle')}
      lastUpdated={t('lastUpdated', { date: LAST_UPDATED })}
      blocks={blocks}
    />
  );
}
