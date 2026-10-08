/** Hint shown beneath an interactive distribution chart. */
export default function DragHint({ text }: { text: string }) {
  return (
    <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
      <span aria-hidden="true">👆</span>
      {text}
    </p>
  );
}
