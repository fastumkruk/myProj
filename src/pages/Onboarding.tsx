import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import AppShell from "@/components/AppShell";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Surface from "@/components/ui/Surface";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

type Mode = "create" | "join";

export default function Onboarding() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const householdId = useAuthStore((s) => s.householdId);
  const refreshHouseholdId = useAuthStore((s) => s.refreshHouseholdId);

  const [mode, setMode] = useState<Mode>("create");
  const [householdName, setHouseholdName] = useState("Дом");
  const [inviteCode, setInviteCode] = useState("");
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const canCreate = useMemo(() => householdName.trim().length >= 2, [householdName]);
  const canJoin = useMemo(() => inviteCode.trim().length >= 4, [inviteCode]);

  if (!user) return <Navigate to="/login" replace />;
  if (householdId && !createdInviteCode) return <Navigate to="/lists" replace />;
  if (!supabase) return <Navigate to="/not-configured" replace />;

  const onCreate = async () => {
    if (!canCreate || isBusy) return;
    setIsBusy(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc("create_household", { p_name: householdName.trim() });
      if (error) {
        setError(error.message);
        return;
      }

      const row = Array.isArray(data) ? data[0] : data;
      const code = row?.invite_code ?? null;
      setCreatedInviteCode(code);
      await refreshHouseholdId();
    } finally {
      setIsBusy(false);
    }
  };

  const onJoin = async () => {
    if (!canJoin || isBusy) return;
    setIsBusy(true);
    setError(null);
    try {
      const { error } = await supabase.rpc("join_household", { p_invite_code: inviteCode.trim() });
      if (error) {
        setError(error.message);
        return;
      }
      await refreshHouseholdId();
    } finally {
      setIsBusy(false);
    }
  };

  const onCopy = async () => {
    if (!createdInviteCode) return;
    try {
      await navigator.clipboard.writeText(createdInviteCode);
    } catch {
      setError("Не получилось скопировать. Скопируйте вручную.");
    }
  };

  return (
    <AppShell title="Семья">
      <Surface className="p-5">
        <div className="flex rounded-2xl bg-black/5 p-1 dark:bg-white/10">
          <button
            type="button"
            onClick={() => setMode("create")}
            className={[
              "h-10 flex-1 rounded-[14px] text-[13px] font-semibold tracking-tight transition",
              mode === "create" ? "bg-white shadow-sm dark:bg-white/20" : "text-zinc-600 dark:text-white/60",
            ].join(" ")}
          >
            Создать
          </button>
          <button
            type="button"
            onClick={() => setMode("join")}
            className={[
              "h-10 flex-1 rounded-[14px] text-[13px] font-semibold tracking-tight transition",
              mode === "join" ? "bg-white shadow-sm dark:bg-white/20" : "text-zinc-600 dark:text-white/60",
            ].join(" ")}
          >
            Вступить
          </button>
        </div>

        {mode === "create" ? (
          <div className="mt-5 space-y-4">
            <Input
              label="Название"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder="Например: Дом"
            />
            <Button className="w-full" size="lg" isLoading={isBusy} onClick={onCreate} disabled={!canCreate}>
              Создать семью
            </Button>

            {createdInviteCode ? (
              <div className="rounded-2xl bg-black/5 p-4 dark:bg-white/10">
                <div className="text-[12px] font-medium text-zinc-600 dark:text-white/60">Код приглашения</div>
                <div className="mt-1 select-all text-[20px] font-semibold tracking-[0.18em]">
                  {createdInviteCode}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="secondary" className="flex-1" onClick={onCopy}>
                    Скопировать
                  </Button>
                  <Button className="flex-1" onClick={() => navigate("/lists")}>
                    Дальше
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <Input
              label="Код приглашения"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Например: 7A3F9B1C"
            />
            <Button className="w-full" size="lg" isLoading={isBusy} onClick={onJoin} disabled={!canJoin}>
              Вступить
            </Button>
          </div>
        )}

        {error ? (
          <div className="mt-4 rounded-2xl bg-rose-500/10 px-4 py-3 text-[13px] text-rose-700 dark:bg-rose-500/15 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="mt-4 text-[12px] leading-relaxed text-zinc-500 dark:text-white/55">
          Один «дом» = общий доступ к спискам. В v1 предполагается один активный дом на аккаунт.
        </div>
      </Surface>
    </AppShell>
  );
}
