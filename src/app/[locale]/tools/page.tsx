import type { Metadata } from 'next';
import { getTranslations, unstable_setRequestLocale as setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { tools } from '@/lib/tools-registry';
import { routing } from '@/i18n/routing';
import { SITE_URL } from '@/lib/site';

const toolEmoji: Record<string, string> = {
  'one-rep-max-calculator': '🏋️',
  'tdee-calculator': '🔥',
  'water-intake-calculator': '💧',
  'macro-calculator': '🥗',
  'body-fat-calculator': '📏',
  'running-pace-calculator': '🏃',
  'intermittent-fasting-calculator': '⏰',
  'target-heart-rate-calculator': '❤️',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'toolsIndex' });
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    alternates: {
      canonical: `/${locale}/tools`,
      languages: {
        en: '/en/tools',
        'zh-CN': '/zh-CN/tools',
        'zh-TW': '/zh-TW/tools',
        'x-default': '/en/tools',
      },
    },
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
      type: 'website',
      url: `${SITE_URL}/${locale}/tools`,
    },
  };
}

export default async function ToolsIndexPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'toolsIndex' });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <header className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
          {t('heroTitle')}
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          {t('heroSubtitle')}
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {tools.map((tool) => (
          <Link
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            className="group bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
              {toolEmoji[tool.slug] ?? '🧮'}
            </div>
            <h2 className="font-bold text-slate-900 mb-1.5">
              {t(`tools.${tool.slug}.title`)}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t(`tools.${tool.slug}.desc`)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
