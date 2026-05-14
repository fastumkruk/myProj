const KEY = "item_history_v1";

function normalizeTitle(input: string) {
  return input
    .replace(/\s*[x×]\s*\d+([.,]\d+)?\s*$/i, "")
    .trim();
}

export function addToItemHistory(title: string) {
  const value = normalizeTitle(title);
  if (!value) return;

  const raw = localStorage.getItem(KEY);
  const list = (raw ? (JSON.parse(raw) as string[]) : []).filter(Boolean);
  const next = [value, ...list.filter((x) => x.toLowerCase() !== value.toLowerCase())].slice(0, 200);
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function getItemSuggestions(prefix: string, limit = 6) {
  const q = normalizeTitle(prefix).toLowerCase();
  if (!q) return [];
  const raw = localStorage.getItem(KEY);
  const list = raw ? (JSON.parse(raw) as string[]) : [];
  return list.filter((x) => x.toLowerCase().startsWith(q)).slice(0, limit);
}

