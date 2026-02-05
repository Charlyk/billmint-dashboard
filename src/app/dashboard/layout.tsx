import { getActiveTimer } from "@/lib/services/timer.service";
import { requireAuth } from "@/lib/services/auth.service";
import { getSettings } from "@/lib/services/user.service";
import { DashboardShell } from "./dashboard-shell";
import { TimerProvider } from "@/contexts/timer-context";
import { UserSettingsProvider } from "@/contexts/user-settings-context";
import { EmailVerificationBanner } from "@/components/email-verification-banner";
import type { User } from "@/types";

// Dashboard requires authentication, so always render dynamically
export const dynamic = "force-dynamic";

async function getServerData() {
  // This runs on the server - user is guaranteed to exist due to middleware
  const user = await requireAuth();

  // Fetch active timer and settings in parallel
  const [timerData, settings] = await Promise.all([
    getActiveTimer().catch((error) => {
      console.error("Failed to fetch timer:", error);
      return null;
    }),
    getSettings().catch((error) => {
      console.error("Failed to fetch settings:", error);
      return null;
    }),
  ]);

  return { user, timerData, settings };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, timerData, settings } = await getServerData();

  // Check if user needs email verification (only for email/password signups, not OAuth)
  const needsEmailVerification = !user.email_verified_at;

  return (
    <UserSettingsProvider initialSettings={settings}>
      <TimerProvider initialData={timerData}>
        {needsEmailVerification && <EmailVerificationBanner />}
        <DashboardShell user={user as User}>{children}</DashboardShell>
      </TimerProvider>
    </UserSettingsProvider>
  );
}
