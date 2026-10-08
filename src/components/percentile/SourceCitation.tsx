import type { NormSource } from '@/lib/norms/percentile';

/**
 * Data provenance line required beneath every norm table.
 * Renders source name + year; links out when a URL is available.
 */
export default function SourceCitation({
  sources,
  label,
}: {
  sources: NormSource[];
  label: string;
}) {
  return (
    <p className="mt-3 text-xs text-slate-500 leading-relaxed">
      {label}{' '}
      {sources.map((s, i) => (
        <span key={s.id}>
          {i > 0 && '; '}
          {s.url ? (
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-primary-600"
            >
              {s.name} ({s.year})
            </a>
          ) : (
            <span>
              {s.name} ({s.year})
            </span>
          )}
        </span>
      ))}
    </p>
  );
}
