import { getActiveTimer } from "@/lib/services/timer.service";
import { requireAuth } from "@/lib/services/auth.service";
import { DashboardShell } from "./dashboard-shell";
import { TimerProvider } from "@/contexts/timer-context";
import type { User } from "@/types";

// Dashboard requires authentication, so always render dynamically
export const dynamic = "force-dynamic";

async function getServerData() {
  // This runs on the server - user is guaranteed to exist due to middleware
  const user = await requireAuth();

  // Fetch active timer
  let timerData = null;
  try {
    timerData = await getActiveTimer();
  } catch (error) {
    // Timer fetch failed, continue with null
    console.error("Failed to fetch timer:", error);
  }

  return { user, timerData };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, timerData } = await getServerData();

  return (
    <TimerProvider initialData={timerData}>
      <DashboardShell user={user as User}>{children}</DashboardShell>
    </TimerProvider>
  );
}
