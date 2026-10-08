import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

const toolSlugs = [
  'one-rep-max-calculator',
  'tdee-calculator',
  'water-intake-calculator',
  'macro-calculator',
  'body-fat-calculator',
  'running-pace-calculator',
  'intermittent-fasting-calculator',
  'target-heart-rate-calculator',
] as const;

export default async function Footer() {
  const t = await getTranslations('common');
  const tRoot = await getTranslations();

  const toolMeta = tRoot.raw('toolsMeta') as Record<
    string,
    { title: string; desc: string }
  >;

  return (
    <footer className="bg-slate-900 text-slate-300 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">{t('brand')}</h3>
            <p className="text-sm leading-relaxed">{t('footer.tagline')}</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.allTools')}</h4>
            <ul className="space-y-2 text-sm">
              {toolSlugs.map((slug) => (
                <li key={slug}>
                  <Link href={`/tools/${slug}`} className="hover:text-primary-400 transition-colors">
                    {toolMeta[slug].title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-primary-400 transition-colors">
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-primary-400 transition-colors">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link href="/tools" className="hover:text-primary-400 transition-colors">
                  {t('footer.allTools')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-8 pt-6 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {t('brand')}.</p>
        </div>
      </div>
    </footer>
  );
}
