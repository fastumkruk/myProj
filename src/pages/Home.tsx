import { Navigate } from "react-router-dom";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const householdId = useAuthStore((s) => s.householdId);

  if (!isSupabaseConfigured) return <Navigate to="/not-configured" replace />;
  if (!user) return <Navigate to="/login" replace />;
  if (!householdId) return <Navigate to="/onboarding" replace />;
  return <Navigate to="/lists" replace />;
}
