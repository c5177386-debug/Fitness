'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { HistoryEntry } from '@/lib/history/history-store';
import { formatEntryDate } from '@/lib/history/format';

interface HistoryPanelProps<I, R> {
  records: HistoryEntry<I, R>[];
  isHydrated: boolean;
  isStorageAvailable: boolean;
  /** Build the "inputs → result" line for one saved calculation */
  summarize: (entry: HistoryEntry<I, R>) => { input: string; output: string };
  onRestore: (entry: HistoryEntry<I, R>) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

type ConfirmState = { kind: 'item'; id: string } | { kind: 'clear' } | null;

/**
 * Collapsible local-history block shared by all calculators.
 * - Empty / storage disabled / not hydrated → renders nothing
 * - Default view: latest record only; "show all" reveals the rest
 * - Every destructive action requires a second confirmation
 */
function HistoryPanel<I, R>({
  records,
  isHydrated,
  isStorageAvailable,
  summarize,
  onRestore,
  onRemove,
  onClear,
}: HistoryPanelProps<I, R>) {
  const t = useTranslations('common.history');
  const locale = useLocale();

  const [collapsed, setCollapsed] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-cancel the confirmation state after 4 seconds
  const askConfirmation = (next: ConfirmState) => {
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    setConfirmState(next);
    if (next) {
      confirmTimer.current = setTimeout(() => setConfirmState(null), 4000);
    }
  };

  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  if (!isHydrated || !isStorageAvailable || records.length === 0) {
    return null;
  }

  const visibleRecords = collapsed ? [] : showAll ? records : records.slice(0, 1);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-8 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          className="flex items-center gap-2 min-h-[44px] font-bold text-slate-900 hover:text-primary-600 transition-colors"
        >
          <span
            className={`inline-block transition-transform ${collapsed ? '-rotate-90' : ''}`}
            aria-hidden="true"
          >
            ▾
          </span>
          {t('title')}
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
            {records.length}
          </span>
        </button>

        <div className="flex-1" />

        {confirmState?.kind === 'clear' ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 hidden sm:inline">
              {t('confirmClear')}
            </span>
            <button
              type="button"
              className="min-h-[44px] px-3 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                askConfirmation(null);
                onClear();
              }}
            >
              {t('yes')}
            </button>
            <button
              type="button"
              className="min-h-[44px] px-3 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100"
              onClick={() => askConfirmation(null)}
            >
              {t('no')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="min-h-[44px] px-3 rounded-lg text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            onClick={() => askConfirmation({ kind: 'clear' })}
          >
            {t('clear')}
          </button>
        )}
      </div>

      {/* Records */}
      {visibleRecords.length > 0 && (
        <ul className="border-t border-slate-100 divide-y divide-slate-100">
          {visibleRecords.map((entry) => {
            const { input, output } = summarize(entry);
            const isConfirming =
              confirmState?.kind === 'item' && confirmState.id === entry.id;

            return (
              <li key={entry.id} className="group px-5 py-3">
                <div className="flex items-center gap-3">
                  {/* Clickable summary → restore inputs */}
                  <button
                    type="button"
                    onClick={() => onRestore(entry)}
                    title={t('restore')}
                    className="flex-1 text-left min-h-[44px] py-1 rounded-lg hover:bg-primary-50 transition-colors"
                  >
                    <span className="block text-xs text-slate-500">
                      {formatEntryDate(locale, entry.timestamp)}
                    </span>
                    <span className="block text-sm text-slate-700 mt-0.5">
                      <span>{input}</span>
                      <span className="mx-2 text-slate-400">→</span>
                      <span className="font-semibold text-primary-700">
                        {output}
                      </span>
                    </span>
                  </button>

                  {/* Actions */}
                  {isConfirming ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-600 hidden sm:inline">
                        {t('confirmDelete')}
                      </span>
                      <button
                        type="button"
                        aria-label={t('yes')}
                        className="min-w-[44px] min-h-[44px] px-3 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700"
                        onClick={() => {
                          askConfirmation(null);
                          onRemove(entry.id);
                        }}
                      >
                        {t('yes')}
                      </button>
                      <button
                        type="button"
                        aria-label={t('no')}
                        className="min-w-[44px] min-h-[44px] px-3 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100"
                        onClick={() => askConfirmation(null)}
                      >
                        {t('no')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onRestore(entry)}
                        className="min-w-[44px] min-h-[44px] px-2 rounded-lg text-sm font-medium text-primary-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                      >
                        ↩ {t('restore')}
                      </button>
                      <button
                        type="button"
                        aria-label={t('delete')}
                        onClick={() => askConfirmation({ kind: 'item', id: entry.id })}
                        className="min-w-[44px] min-h-[44px] px-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        🗑
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Show all / collapse toggle */}
      {!collapsed && records.length > 1 && (
        <div className="border-t border-slate-100 px-5 py-2 text-center">
          {showAll ? (
            <button
              type="button"
              className="min-h-[44px] px-4 text-sm font-semibold text-slate-500 hover:text-primary-600"
              onClick={() => setShowAll(false)}
            >
              {t('showLess')}
            </button>
          ) : (
            <button
              type="button"
              className="min-h-[44px] px-4 text-sm font-semibold text-slate-500 hover:text-primary-600"
              onClick={() => setShowAll(true)}
            >
              {t('showAll', { count: records.length - 1 })}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default HistoryPanel;
