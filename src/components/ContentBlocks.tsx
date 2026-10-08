'use client';

import Image from 'next/image';
import type { ImageSlot } from '@/lib/tool-images';

/**
 * ContentBlocks — renders structured long-form content from message files.
 * Block types: h2, h3, p, formula, list, table.
 * Image slots are injected after a given block index; slots whose index is
 * beyond the content length are appended at the end (images never vanish).
 */

export type ContentBlock =
  | { type: 'h2' | 'h3'; text: string }
  | { type: 'p' | 'formula' | 'note'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] };

interface ContentBlocksProps {
  blocks: ContentBlock[];
  slots?: ImageSlot[];
  /** Alt text for slot images (locale-resolved by the caller) */
  imageAlt?: string;
}

function SlotImage({ slot, alt }: { slot: ImageSlot; alt: string }) {
  if (slot.object) {
    return (
      <div className="my-6 rounded-2xl bg-gradient-to-br from-slate-50 to-primary-50 border border-slate-100 p-6 flex justify-center">
        <Image
          src={slot.src}
          alt={alt}
          width={slot.width}
          height={slot.height}
          loading="lazy"
          className="max-h-[420px] w-auto"
        />
      </div>
    );
  }
  return (
    <Image
      src={slot.src}
      alt={alt}
      width={slot.width}
      height={slot.height}
      loading="lazy"
      className="my-6 w-full rounded-2xl shadow-md"
    />
  );
}

export default function ContentBlocks({ blocks, slots = [], imageAlt = '' }: ContentBlocksProps) {
  const renderedSlots = new Set<number>();

  return (
    <section className="mt-12">
      {blocks.map((block, i) => {
        const node = renderBlock(block, i);
        const dueSlots = slots.filter((s) => s.after === i);
        dueSlots.forEach((s) => renderedSlots.add(s.after));
        return (
          <div key={i}>
            {node}
            {dueSlots.map((s) => (
              <SlotImage key={s.src} slot={s} alt={imageAlt} />
            ))}
          </div>
        );
      })}

      {/* Append any slots whose target index wasn't reached */}
      {slots
        .filter((s) => !renderedSlots.has(s.after))
        .map((s) => (
          <SlotImage key={s.src} slot={s} alt={imageAlt} />
        ))}
    </section>
  );
}

function renderBlock(block: ContentBlock, i: number) {
  switch (block.type) {
    case 'h2':
      return (
        <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4 first:mt-0">
          {block.text}
        </h2>
      );
    case 'h3':
      return (
        <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">{block.text}</h3>
      );
    case 'p':
      return <p className="text-slate-700 leading-relaxed mb-4">{block.text}</p>;
    case 'formula':
      return (
        <div className="bg-slate-100 rounded-xl p-4 font-mono text-center text-sm mb-4 overflow-x-auto">
          {block.text}
        </div>
      );
    case 'note':
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-4">
          {block.text}
        </div>
      );
    case 'list':
      return (
        <ul className="list-disc pl-6 space-y-3 text-slate-700 mb-4">
          {block.items.map((item, j) => (
            <li key={j}>{item}</li>
          ))}
        </ul>
      );
    case 'table':
      return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden text-sm mb-4 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100">
              <tr>
                {block.headers.map((h, j) => (
                  <th key={j} className="px-4 py-2 text-left text-xs font-semibold text-slate-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {block.rows.map((row, j) => (
                <tr key={j}>
                  {row.map((cell, k) => (
                    <td key={k} className="px-4 py-2 text-slate-700 whitespace-nowrap">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}
