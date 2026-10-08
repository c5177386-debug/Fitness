import { getActiveTools } from '@/lib/tools-registry';
import type { MetadataRoute } from 'next';
import { SITE_URL as BASE } from '@/lib/site';

const LOCALES = ['en', 'zh-CN', 'zh-TW'] as const;

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

interface PageSpec {
  /** Path after the locale segment; '' for the locale home. */
  path: string;
  priority: number;
  changeFrequency: ChangeFrequency;
}

/** Every indexable page, once (per-locale entries are generated below). */
const PAGES: PageSpec[] = [
  { path: '', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/tools', priority: 0.9, changeFrequency: 'weekly' },
  ...getActiveTools().map((tool) => ({
    path: `/tools/${tool.slug}`,
    priority: 0.8,
    changeFrequency: 'weekly' as ChangeFrequency,
  })),
  { path: '/about', priority: 0.4, changeFrequency: 'monthly' },
  { path: '/privacy-policy', priority: 0.3, changeFrequency: 'monthly' },
];

function absoluteLoc(locale: string, path: string): string {
  return `${BASE}/${locale}${path}`;
}

/**
 * Required with `output: 'export'`: the metadata route is compiled as an
 * optional catch-all ([[...__metadata_id__]]), so static export needs the
 * param set explicitly. A single empty param renders the root sitemap.
 */
export function generateStaticParams() {
  return [{ __metadata_id__: [] }];
}

/**
 * Sitemap: every (locale × page) combination as its own <loc>, each carrying
 * the full hreflang cluster (and x-default → English). All clustered URLs
 * are themselves listed, as required by the hreflang sitemap convention.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  return PAGES.flatMap((page) =>
    LOCALES.map((locale) => ({
      url: absoluteLoc(locale, page.path),
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: {
          ...Object.fromEntries(
            LOCALES.map((l) => [l, absoluteLoc(l, page.path)])
          ),
          'x-default': absoluteLoc('en', page.path),
        },
      },
    }))
  );
}
