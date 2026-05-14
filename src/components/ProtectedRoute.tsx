import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export default function ProtectedRoute({
  children,
  requireHousehold,
}: {
  children: ReactNode;
  requireHousehold?: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const householdId = useAuthStore((s) => s.householdId);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requireHousehold && !householdId) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
