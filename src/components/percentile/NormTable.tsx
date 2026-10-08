interface NormTableProps {
  /** First column header (row dimension: age, body weight…) */
  firstHeader: string;
  /** Remaining column headers (categories) */
  categoryHeaders: string[];
  rows: Array<{
    firstCell: string;
    cells: string[];
    highlight?: boolean;
  }>;
  /** Table caption — describes the table for screen readers and search. */
  caption: string;
}

/**
 * Accessible reference table shared by every percentile module.
 * Plain HTML text — this is the search-indexable content, never an image.
 */
export default function NormTable({
  firstHeader,
  categoryHeaders,
  rows,
  caption,
}: NormTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm" aria-label={caption}>
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-slate-100">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">
              {firstHeader}
            </th>
            {categoryHeaders.map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-left text-xs font-semibold text-slate-600 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, i) => (
            <tr key={i} className={row.highlight ? 'bg-primary-50' : undefined}>
              <td className="px-3 py-2 font-semibold text-slate-900 whitespace-nowrap">
                {row.firstCell}
              </td>
              {row.cells.map((cell, j) => (
                <td
                  key={j}
                  className="px-3 py-2 text-slate-700 whitespace-nowrap"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
