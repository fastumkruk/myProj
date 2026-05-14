import type { ShoppingItem, ShoppingList } from "@/types/models";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function keyLists(householdId: string) {
  return `cache_lists_v1_${householdId}`;
}

function keyItems(listId: string) {
  return `cache_items_v1_${listId}`;
}

export function getCachedLists(householdId: string): ShoppingList[] {
  const raw = safeParse<ShoppingList[]>(localStorage.getItem(keyLists(householdId)));
  return Array.isArray(raw) ? raw : [];
}

export function setCachedLists(householdId: string, lists: ShoppingList[]) {
  localStorage.setItem(keyLists(householdId), JSON.stringify(lists));
}

export function getCachedItems(listId: string): ShoppingItem[] {
  const raw = safeParse<ShoppingItem[]>(localStorage.getItem(keyItems(listId)));
  return Array.isArray(raw) ? raw : [];
}

export function setCachedItems(listId: string, items: ShoppingItem[]) {
  localStorage.setItem(keyItems(listId), JSON.stringify(items));
}

export function migrateItemsCache(fromListId: string, toListId: string) {
  if (!fromListId || !toListId || fromListId === toListId) return;
  const existing = localStorage.getItem(keyItems(fromListId));
  if (existing == null) return;
  localStorage.setItem(keyItems(toListId), existing);
  localStorage.removeItem(keyItems(fromListId));
}

