export default function Autocomplete({
  items,
  onPick,
}: {
  items: string[];
  onPick: (value: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-black/5 bg-white/80 shadow-[0_18px_40px_rgba(0,0,0,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
      {items.map((x) => (
        <button
          key={x}
          type="button"
          className="block w-full px-4 py-2 text-left text-[13px] font-medium tracking-tight text-zinc-900 hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
          onClick={() => onPick(x)}
        >
          {x}
        </button>
      ))}
    </div>
  );
}

