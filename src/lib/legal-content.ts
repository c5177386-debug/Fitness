/**
 * Helpers for message-driven legal pages (about / privacy-policy).
 * Blocks live in the i18n message files and may contain {{token}}
 * placeholders (e.g. {{email}}) resolved at render time.
 */

export type LegalBlock =
  | { type: 'h2' | 'h3'; text: string }
  | { type: 'p' | 'note'; text: string }
  | { type: 'list'; items: string[] };

export function hydrateBlocks(
  blocks: LegalBlock[],
  tokens: Record<string, string>
): LegalBlock[] {
  const substitute = (s: string) =>
    s.replace(/\{\{(\w+)\}\}/g, (match, key: string) => tokens[key] ?? match);

  return blocks.map((block) =>
    block.type === 'list'
      ? { ...block, items: block.items.map(substitute) }
      : { ...block, text: substitute(block.text) }
  );
}
