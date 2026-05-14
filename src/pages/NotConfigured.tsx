import AppShell from "@/components/AppShell";
import Surface from "@/components/ui/Surface";

export default function NotConfigured() {
  return (
    <AppShell title="Настройка">
      <Surface className="p-5">
        <div className="text-[15px] font-semibold tracking-tight">Нужно подключить Supabase</div>
        <div className="mt-2 text-[13px] leading-relaxed text-zinc-600 dark:text-white/60">
          Создайте файл <span className="font-medium">.env</span> на основе <span className="font-medium">.env.example</span> и
          заполните переменные <span className="font-medium">VITE_SUPABASE_URL</span> и{" "}
          <span className="font-medium">VITE_SUPABASE_ANON_KEY</span>.
        </div>
        <div className="mt-4 rounded-2xl bg-black/5 px-4 py-3 text-[12px] text-zinc-700 dark:bg-white/10 dark:text-white/70">
          После этого перезапустите dev-сервер.
        </div>
      </Surface>
      <Surface className="mt-4 p-5">
        <div className="text-[14px] font-semibold tracking-tight">SQL для базы</div>
        <div className="mt-2 text-[13px] leading-relaxed text-zinc-600 dark:text-white/60">
          Стартовый SQL лежит в <span className="font-medium">migrations/20260514_init.sql</span>. Его можно выполнить в Supabase
          SQL Editor.
        </div>
      </Surface>
    </AppShell>
  );
}

