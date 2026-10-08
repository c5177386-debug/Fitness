import type { LegalBlock } from '@/lib/legal-content';

/**
 * Shared visual shell for the About and Privacy Policy pages.
 * Plain article typography inside a card; bare URLs render as links.
 */
export default function LegalPageLayout({
  title,
  lastUpdated,
  blocks,
}: {
  title: string;
  lastUpdated: string;
  blocks: LegalBlock[];
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">{title}</h1>
      <p className="text-sm text-slate-500 mb-8">{lastUpdated}</p>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10">
        {blocks.map((block, i) => (
          <BlockNode key={i} block={block} />
        ))}
      </div>
    </div>
  );
}

function BlockNode({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case 'h2':
      return (
        <h2 className="text-xl font-bold text-slate-900 mt-9 mb-3 first:mt-0">
          {block.text}
        </h2>
      );
    case 'h3':
      return <h3 className="text-base font-bold text-slate-900 mt-6 mb-2">{block.text}</h3>;
    case 'p':
      return <p className="text-slate-700 leading-relaxed mb-4">{linkify(block.text)}</p>;
    case 'note':
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-4">
          {linkify(block.text)}
        </div>
      );
    case 'list':
      return (
        <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
          {block.items.map((item, i) => (
            <li key={i}>{linkify(item)}</li>
          ))}
        </ul>
      );
    default:
      return null;
  }
}

/** Render http(s) URLs inside text as real anchors. */
function linkify(text: string): React.ReactNode {
  const parts = text.split(/(https:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    part.startsWith('https://') ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary-600 underline underline-offset-2 hover:text-primary-700"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}
