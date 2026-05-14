import { supabase } from "@/lib/supabase";
import { setOfflineIdMap } from "@/lib/offlineQueue";

type ExecResult =
  | { kind: "items.add"; listId: string; tempId: string; serverId: string }
  | { kind: string };

export function createOfflineExecutor() {
  return async (
    op: { kind: string; payload: any },
    helpers: { resolveId: (id: string) => string | null },
  ): Promise<ExecResult> => {
    if (!supabase) throw new Error("Supabase is not configured");

    const p = op.payload ?? {};
    if (op.kind === "items.add") {
      const listId = helpers.resolveId(p.listId);
      if (!listId) throw new Error("Missing listId mapping");
      const { data, error } = await supabase
        .from("items")
        .insert({
          list_id: listId,
          title: String(p.title ?? "").trim(),
          position: Number(p.position ?? 0),
          updated_at: p.updatedAt ?? new Date().toISOString(),
          updated_by: p.updatedBy ?? null,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      const serverId = String((data as any)?.id ?? "");
      if (!serverId) throw new Error("Server id missing");
      const tempId = String(p.tempId ?? "");
      if (tempId) setOfflineIdMap(tempId, serverId);
      return { kind: "items.add", listId, tempId, serverId };
    }

    if (op.kind === "items.toggle") {
      const itemId = helpers.resolveId(p.itemId);
      if (!itemId) throw new Error("Missing itemId mapping");
      const { error } = await supabase
        .from("items")
        .update({
          is_checked: Boolean(p.isChecked),
          updated_at: p.updatedAt ?? new Date().toISOString(),
          updated_by: p.updatedBy ?? null,
        })
        .eq("id", itemId);
      if (error) throw new Error(error.message);
      return { kind: "items.toggle" };
    }

    if (op.kind === "items.rename") {
      const itemId = helpers.resolveId(p.itemId);
      if (!itemId) throw new Error("Missing itemId mapping");
      const { error } = await supabase
        .from("items")
        .update({
          title: String(p.title ?? "").trim(),
          updated_at: p.updatedAt ?? new Date().toISOString(),
          updated_by: p.updatedBy ?? null,
        })
        .eq("id", itemId);
      if (error) throw new Error(error.message);
      return { kind: "items.rename" };
    }

    if (op.kind === "items.delete") {
      const itemId = helpers.resolveId(p.itemId);
      if (!itemId) throw new Error("Missing itemId mapping");
      const { error } = await supabase.from("items").delete().eq("id", itemId);
      if (error) throw new Error(error.message);
      return { kind: "items.delete" };
    }

    if (op.kind === "items.clearChecked") {
      const listId = helpers.resolveId(p.listId);
      if (!listId) throw new Error("Missing listId mapping");
      const { error } = await supabase.from("items").delete().eq("list_id", listId).eq("is_checked", true);
      if (error) throw new Error(error.message);
      return { kind: "items.clearChecked" };
    }

    if (op.kind === "lists.rename") {
      const { error } = await supabase
        .from("lists")
        .update({ title: String(p.title ?? "").trim(), updated_at: p.updatedAt ?? new Date().toISOString() })
        .eq("id", String(p.listId));
      if (error) throw new Error(error.message);
      return { kind: "lists.rename" };
    }

    if (op.kind === "lists.delete") {
      const { error } = await supabase.from("lists").delete().eq("id", String(p.listId));
      if (error) throw new Error(error.message);
      return { kind: "lists.delete" };
    }

    throw new Error(`Unknown offline op: ${op.kind}`);
  };
}

