import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import {
  getTranslations,
  unstable_setRequestLocale as setRequestLocale,
} from 'next-intl/server';
import { getToolBySlug, getActiveTools } from '@/lib/tools-registry';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { FAQSchema, ToolSchema, BreadcrumbSchema } from '@/components/Schema';
import ContentBlocks, { type ContentBlock } from '@/components/ContentBlocks';
import { toolImagery, type ImageSpec } from '@/lib/tool-images';
import OneRepMaxPage from './tool-pages/OneRepMax';
import TDEEPage from './tool-pages/TDEE';
import WaterIntakePage from './tool-pages/WaterIntake';
import MacroPage from './tool-pages/Macro';
import BodyFatPage from './tool-pages/BodyFat';
import RunningPacePage from './tool-pages/RunningPace';
import FastingPage from './tool-pages/Fasting';
import HeartRatePage from './tool-pages/HeartRate';
import { SITE_URL } from '@/lib/site';

const toolDefinitions: Record<
  string,
  { namespace: string; component: React.ComponentType }
> = {
  'one-rep-max-calculator': { namespace: 'oneRM', component: OneRepMaxPage },
  'tdee-calculator': { namespace: 'tdee', component: TDEEPage },
  'water-intake-calculator': { namespace: 'water', component: WaterIntakePage },
  'macro-calculator': { namespace: 'macro', component: MacroPage },
  'body-fat-calculator': { namespace: 'bodyFat', component: BodyFatPage },
  'running-pace-calculator': { namespace: 'running', component: RunningPacePage },
  'intermittent-fasting-calculator': { namespace: 'fasting', component: FastingPage },
  'target-heart-rate-calculator': { namespace: 'heartRate', component: HeartRatePage },
};

export function generateStaticParams() {
  const activeSlugs = getActiveTools().map((t) => t.slug);
  return routing.locales.flatMap((locale) =>
    activeSlugs.map((slug) => ({ locale, slug }))
  );
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const def = toolDefinitions[slug];
  const imagery = toolImagery[slug];
  if (!def) return { title: 'Tool Not Found' };

  const t = await getTranslations({ locale, namespace: def.namespace });
  const ogImage = `${SITE_URL}${imagery.og}`;

  return {
    title: t('meta.title'),
    description: t('meta.description'),
    alternates: {
      canonical: `/${locale}/tools/${slug}`,
      languages: {
        en: `/en/tools/${slug}`,
        'zh-CN': `/zh-CN/tools/${slug}`,
        'zh-TW': `/zh-TW/tools/${slug}`,
        'x-default': `/en/tools/${slug}`,
      },
    },
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
      type: 'article',
      url: `${SITE_URL}/${locale}/tools/${slug}`,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('meta.title'),
      description: t('meta.description'),
      images: [ogImage],
    },
  };
}

/** Inline (non-slot) image: centered panel for transparent objects, full-width otherwise */
function InlineImage({ image, alt }: { image: ImageSpec; alt: string }) {
  if (image.object) {
    return (
      <div className="mt-10 rounded-2xl bg-gradient-to-br from-slate-50 to-primary-50 border border-slate-100 p-8 flex justify-center">
        <Image
          src={image.src}
          alt={alt}
          width={image.width}
          height={image.height}
          loading="lazy"
          className="max-h-[440px] w-auto"
        />
      </div>
    );
  }
  return (
    <Image
      src={image.src}
      alt={alt}
      width={image.width}
      height={image.height}
      loading="lazy"
      className="mt-10 w-full rounded-2xl shadow-md"
    />
  );
}

export default async function ToolPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  setRequestLocale(locale);

  const tool = getToolBySlug(slug);
  const def = toolDefinitions[slug];
  const imagery = toolImagery[slug];
  if (!tool || !def || !imagery) notFound();

  const t = await getTranslations({ locale, namespace: def.namespace });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const tRoot = await getTranslations({ locale });

  const faqs = t.raw('faq') as Array<{ q: string; a: string }>;
  const blocks = (t.raw('content.blocks') ?? []) as ContentBlock[];
  const ToolComponent = def.component;
  const toolMeta = tRoot.raw('toolsMeta') as Record<
    string,
    { title: string; desc: string }
  >;
  const imageAlt = toolMeta[slug].title;
  const url = `${SITE_URL}/${locale}/tools/${slug}`;

  const activeSlugs = new Set(getActiveTools().map((x) => x.slug));
  const related = tool.relatedTools.filter((s) => activeSlugs.has(s));

  return (
    <div>
      {/* ── Hero banner with title overlay ─────────────────────────── */}
      <div className="relative h-72 sm:h-96 w-full overflow-hidden">
        <Image
          src={imagery.hero}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />
        <div className="absolute inset-0 flex flex-col justify-end items-center text-center px-4 pb-8 sm:pb-12">
          <h1 className="text-3xl sm:text-5xl font-bold text-white max-w-3xl drop-shadow">
            {t('pageTitle')}
          </h1>
          <p className="mt-3 text-base sm:text-lg text-white/85 max-w-2xl">
            {t('pageIntro')}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Structured data */}
        <BreadcrumbSchema
          items={[
            { name: tCommon('brand'), url: `${SITE_URL}/${locale}` },
            { name: imageAlt, url },
          ]}
        />
        <ToolSchema name={imageAlt} description={t('meta.description')} url={url} />

        {/* Calculator */}
        <ToolComponent />

        {/* Core result visualization */}
        {imagery.visual && <InlineImage image={imagery.visual} alt={imageAlt} />}

        {/* Long-form article with image slots */}
        <ContentBlocks blocks={blocks} slots={imagery.slots} imageAlt={imageAlt} />

        {/* Closing scene */}
        {imagery.scene && <InlineImage image={imagery.scene} alt={imageAlt} />}

        {/* FAQ */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            {tCommon('faqTitle')}
          </h2>
          <FAQSchema faqs={faqs.map((f) => ({ question: f.q, answer: f.a }))} />
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-200">
            {faqs.map((faq, i) => (
              <details key={i} className="group p-6">
                <summary className="flex items-center justify-between gap-4 cursor-pointer font-semibold text-slate-900">
                  <span>{faq.q}</span>
                  <span className="text-primary-600 text-xl group-open:rotate-45 transition-transform shrink-0">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-slate-600 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Internal links */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {tCommon('relatedTitle')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((relatedSlug) => (
                <Link key={relatedSlug} href={`/tools/${relatedSlug}`} className="link-card">
                  <h3 className="font-bold text-slate-900">
                    {toolMeta[relatedSlug].title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {toolMeta[relatedSlug].desc}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <p className="mt-16 text-center text-xs text-slate-400">
          {tCommon('disclaimer')}
        </p>
      </div>
    </div>
  );
}
