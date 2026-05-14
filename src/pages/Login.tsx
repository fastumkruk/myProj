import { Eye, EyeOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import AppShell from "@/components/AppShell";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Surface from "@/components/ui/Surface";
import { createCaptcha } from "@/lib/captcha";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

type Mode = "signin" | "signup";

export default function Login() {
  const user = useAuthStore((s) => s.user);
  const householdId = useAuthStore((s) => s.householdId);
  const error = useAuthStore((s) => s.error);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [captcha, setCaptcha] = useState(() => createCaptcha());
  const [captchaValue, setCaptchaValue] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const canSubmit = useMemo(() => email.trim().length > 3 && password.length >= 6, [email, password]);

  useEffect(() => {
    setLocalError(null);
    setCaptcha(createCaptcha());
    setCaptchaValue("");
  }, [mode]);

  if (!isSupabaseConfigured) return <Navigate to="/not-configured" replace />;
  if (user && householdId) return <Navigate to="/lists" replace />;
  if (user && !householdId) return <Navigate to="/onboarding" replace />;

  const onSubmit = async () => {
    if (!canSubmit || isBusy) return;
    setLocalError(null);

    if (mode === "signup") {
      const value = Number(captchaValue.trim());
      if (!Number.isFinite(value) || value !== captcha.answer) {
        setLocalError("Капча неверна");
        setCaptcha(createCaptcha());
        setCaptchaValue("");
        return;
      }
    }

    setIsBusy(true);
    try {
      if (mode === "signin") {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
      }
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <AppShell title="Вход">
      <Surface className="p-5">
        <div className="flex rounded-2xl bg-black/5 p-1 dark:bg-white/10">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={[
              "h-10 flex-1 rounded-[14px] text-[13px] font-semibold tracking-tight transition",
              mode === "signin" ? "bg-white shadow-sm dark:bg-white/20" : "text-zinc-600 dark:text-white/60",
            ].join(" ")}
          >
            Войти
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={[
              "h-10 flex-1 rounded-[14px] text-[13px] font-semibold tracking-tight transition",
              mode === "signup" ? "bg-white shadow-sm dark:bg-white/20" : "text-zinc-600 dark:text-white/60",
            ].join(" ")}
          >
            Регистрация
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <Input
            label="Email"
            name="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Input
            label="Пароль"
            name="password"
            type={isPasswordVisible ? "text" : "password"}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Минимум 6 символов"
            right={
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => setIsPasswordVisible((v) => !v)}
                aria-label={isPasswordVisible ? "Скрыть пароль" : "Показать пароль"}
              >
                {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          {mode === "signup" ? (
            <Input
              label={`Капча: ${captcha.a} + ${captcha.b} = ?`}
              value={captchaValue}
              onChange={(e) => setCaptchaValue(e.target.value)}
              inputMode="numeric"
              placeholder="Ответ"
            />
          ) : null}

          {localError || error ? (
            <div className="rounded-2xl bg-rose-500/10 px-4 py-3 text-[12px] text-rose-700 dark:bg-rose-500/15 dark:text-rose-200">
              {localError ?? error}
            </div>
          ) : null}

          <Button className="w-full" size="lg" isLoading={isBusy} onClick={onSubmit} disabled={!canSubmit}>
            {mode === "signin" ? "Войти" : "Создать аккаунт"}
          </Button>

          <div className="text-center text-[11px] leading-relaxed text-zinc-500 dark:text-white/55">
            Для синхронизации нужен интернет. Офлайн-режим в v1 — просмотр кэша и индикатор статуса.
          </div>
        </div>
      </Surface>
    </AppShell>
  );
}
