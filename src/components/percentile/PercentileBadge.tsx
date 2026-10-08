/** Percentile pill shown above the distribution chart. */
export default function PercentileBadge({ text }: { text: string }) {
  return (
    <div
      aria-live="polite"
      className="inline-flex items-center min-h-[44px] px-4 rounded-full bg-primary-600 text-white text-sm font-bold shadow-sm"
    >
      {text}
    </div>
  );
}
