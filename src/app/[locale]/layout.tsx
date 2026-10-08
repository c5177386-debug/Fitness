import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import {
  unstable_setRequestLocale as setRequestLocale,
  getTranslations,
  getMessages,
} from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { SITE_URL } from '@/lib/site';
import '@/app/globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const tr = await getTranslations({ locale, namespace: 'common' });
  const homeTr = await getTranslations({ locale, namespace: 'home' });

  const defaultOg = `${SITE_URL}/images/og/og-default.jpg`;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${tr('brand')} | ${homeTr('heroTitle')}`,
      template: `%s | ${tr('brand')}`,
    },
    description: homeTr('heroSubtitle'),
    openGraph: {
      type: 'website',
      locale: locale === 'en' ? 'en_US' : (locale as string),
      url: `${SITE_URL}/${locale}`,
      siteName: tr('brand'),
      title: tr('brand'),
      description: homeTr('heroSubtitle'),
      images: [{ url: defaultOg, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: tr('brand'),
      description: homeTr('heroSubtitle'),
      images: [defaultOg],
    },
    robots: { index: true, follow: true },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: '/en',
        'zh-CN': '/zh-CN',
        'zh-TW': '/zh-TW',
        'x-default': '/en',
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering for this locale
  setRequestLocale(locale);

  // Pass the resolved messages to client components via the provider
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="min-h-screen flex flex-col bg-slate-50">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
