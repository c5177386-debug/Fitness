import Image from 'next/image';
import {
  unstable_setRequestLocale as setRequestLocale,
  getTranslations,
} from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'home' });
  const tRoot = await getTranslations({ locale });

  const toolSlugs = [
    'one-rep-max-calculator',
    'tdee-calculator',
    'water-intake-calculator',
  ] as const;

  const toolMeta = tRoot.raw('toolsMeta') as Record<
    string,
    { title: string; desc: string }
  >;

  return (
    <div>
      {/* ── Hero banner with overlay ──────────────────────────────── */}
      <div className="relative h-80 sm:h-[28rem] w-full overflow-hidden">
        <Image
          src="/images/heroes/hero-home.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
        <div className="absolute inset-0 flex flex-col justify-end items-center text-center px-4 pb-10 sm:pb-16">
          <h1 className="text-4xl sm:text-6xl font-bold text-white max-w-3xl drop-shadow">
            {t('heroTitle')}
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-white/85 max-w-2xl">
            {t('heroSubtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tools Grid */}
        <section className="py-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">{t('popular')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {toolSlugs.map((slug) => (
              <Link
                key={slug}
                href={`/tools/${slug}`}
                className="card hover:shadow-xl transition-shadow"
              >
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {toolMeta[slug].title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {toolMeta[slug].desc}
                </p>
                <div className="mt-4 text-primary-600 font-semibold text-sm">
                  {t('useCalculator')} →
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Tool family visual */}
        <Image
          src="/images/content/home-tool-family.webp"
          alt=""
          width={1200}
          height={800}
          loading="lazy"
          className="mt-10 w-full rounded-2xl shadow-md"
        />

        {/* Features */}
        <section className="py-12 bg-white rounded-2xl border border-slate-100 mt-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-6">
            {t
              .raw('features')
              .map((feature: { icon: string; title: string; desc: string }) => (
                <div key={feature.title} className="text-center">
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <h3 className="font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600">{feature.desc}</p>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
