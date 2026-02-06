"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPanel,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { LogoUpload } from "@/components/ui/logo-upload";
import { Crown, FileText } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useUserSettings } from "@/contexts/user-settings-context";
import { userApi, authApi, billingApi } from "@/lib/api";
import { toastManager } from "@/components/ui/toast";
import {
  Empty,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import type { SubscriptionResponse } from "@/types/api";

const currencies = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "CHF", label: "CHF - Swiss Franc" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "BRL", label: "BRL - Brazilian Real" },
  { value: "MXN", label: "MXN - Mexican Peso" },
  { value: "PLN", label: "PLN - Polish Zloty" },
  { value: "RON", label: "RON - Romanian Leu" },
  { value: "SEK", label: "SEK - Swedish Krona" },
  { value: "NOK", label: "NOK - Norwegian Krone" },
  { value: "DKK", label: "DKK - Danish Krone" },
  { value: "NZD", label: "NZD - New Zealand Dollar" },
  { value: "SGD", label: "SGD - Singapore Dollar" },
  { value: "HKD", label: "HKD - Hong Kong Dollar" },
  { value: "ZAR", label: "ZAR - South African Rand" },
  { value: "AED", label: "AED - UAE Dirham" },
];

const timeFormats = [
  { value: "12h", label: "12-hour (AM/PM)" },
  { value: "24h", label: "24-hour" },
];

const timezones = [
  { value: "Pacific/Honolulu", label: "(UTC-10:00) Hawaii" },
  { value: "America/Anchorage", label: "(UTC-09:00) Alaska" },
  { value: "America/Los_Angeles", label: "(UTC-08:00) Pacific Time" },
  { value: "America/Denver", label: "(UTC-07:00) Mountain Time" },
  { value: "America/Chicago", label: "(UTC-06:00) Central Time" },
  { value: "America/New_York", label: "(UTC-05:00) Eastern Time" },
  { value: "America/Halifax", label: "(UTC-04:00) Atlantic Time" },
  { value: "America/Sao_Paulo", label: "(UTC-03:00) São Paulo" },
  { value: "Atlantic/South_Georgia", label: "(UTC-02:00) Mid-Atlantic" },
  { value: "Atlantic/Azores", label: "(UTC-01:00) Azores" },
  { value: "UTC", label: "(UTC+00:00) UTC" },
  { value: "Europe/London", label: "(UTC+00:00) London" },
  { value: "Europe/Paris", label: "(UTC+01:00) Paris, Berlin" },
  { value: "Europe/Bucharest", label: "(UTC+02:00) Bucharest, Athens" },
  { value: "Europe/Moscow", label: "(UTC+03:00) Moscow" },
  { value: "Asia/Dubai", label: "(UTC+04:00) Dubai" },
  { value: "Asia/Karachi", label: "(UTC+05:00) Karachi" },
  { value: "Asia/Kolkata", label: "(UTC+05:30) Mumbai, Delhi" },
  { value: "Asia/Dhaka", label: "(UTC+06:00) Dhaka" },
  { value: "Asia/Bangkok", label: "(UTC+07:00) Bangkok" },
  { value: "Asia/Singapore", label: "(UTC+08:00) Singapore, Hong Kong" },
  { value: "Asia/Tokyo", label: "(UTC+09:00) Tokyo" },
  { value: "Australia/Sydney", label: "(UTC+10:00) Sydney" },
  { value: "Pacific/Auckland", label: "(UTC+12:00) Auckland" },
];

const tierNames = {
  free: "Free",
  pro: "Pro",
  business: "Business",
};

export default function SettingsPage() {
  const { settings, isLoading: isLoadingSettings } = useUserSettings();

  // Profile state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [userTier, setUserTier] = useState<"free" | "pro" | "business">("free");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Settings state
  const [defaultHourlyRate, setDefaultHourlyRate] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");
  const [weekStartsOn, setWeekStartsOn] = useState(0);
  const [maxTimerHours, setMaxTimerHours] = useState<string | null>("8");
  const [timezone, setTimezone] = useState("UTC");

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteStep, setDeleteStep] = useState<"confirm" | "otp">("confirm");
  const [otpCode, setOtpCode] = useState("");
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingAppSettings, setIsSavingAppSettings] = useState(false);

  // Billing state
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
  const [billingEmail, setBillingEmail] = useState("");
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Fetch user profile and subscription on mount
  useEffect(() => {
    async function fetchProfileAndSubscription() {
      try {
        const [profile, subscriptionData] = await Promise.all([
          userApi.getProfile(),
          billingApi.getSubscription(),
        ]);
        setName(profile.full_name || "");
        setEmail(profile.email || "");
        setUserTier(profile.tier || "free");
        setSubscription(subscriptionData);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    }
    fetchProfileAndSubscription();
  }, []);

  // Initialize form values from settings
  useEffect(() => {
    if (settings) {
      setDefaultHourlyRate(settings.default_hourly_rate?.toString() || "");
      setDefaultCurrency(settings.default_currency || "USD");
      setTimeFormat(settings.time_format || "12h");
      setWeekStartsOn(settings.week_starts_on ?? 0);
      setMaxTimerHours(settings.max_timer_hours?.toString() ?? null);
      setTimezone(settings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }, [settings]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const hourlyRate = parseFloat(defaultHourlyRate);
      await Promise.all([
        userApi.updateProfile({
          full_name: name || undefined,
        }),
        userApi.updateBillingDefaults({
          default_hourly_rate: !isNaN(hourlyRate) ? hourlyRate : undefined,
          default_currency: defaultCurrency || undefined,
        }),
      ]);
      toastManager.add({ type: "success", title: "Profile saved" });
    } catch (error) {
      console.error("Failed to save profile:", error);
      toastManager.add({ type: "error", title: "Failed to save profile" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveAppSettings = async () => {
    setIsSavingAppSettings(true);
    try {
      const timerHours = maxTimerHours ? parseFloat(maxTimerHours) : null;
      await userApi.updateAppSettings({
        time_format: timeFormat,
        week_starts_on: weekStartsOn,
        max_timer_hours: timerHours !== null && !isNaN(timerHours) ? timerHours : null,
        timezone,
      });
      toastManager.add({ type: "success", title: "Settings saved" });
    } catch (error) {
      console.error("Failed to save settings:", error);
      toastManager.add({ type: "error", title: "Failed to save settings" });
    } finally {
      setIsSavingAppSettings(false);
    }
  };

  const handleRequestDeletionOtp = async () => {
    if (deleteConfirmText !== "DELETE") return;

    setIsRequestingOtp(true);
    setDeleteError(null);

    try {
      await userApi.requestAccountDeletion();
      setDeleteStep("otp");
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to send verification code");
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleConfirmDeletion = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setDeleteError("Please enter a valid 6-digit code");
      return;
    }

    setIsDeletingAccount(true);
    setDeleteError(null);

    try {
      await userApi.confirmAccountDeletion(otpCode);
      // Sign out to clear client-side session/cookies
      try {
        await authApi.logout();
      } catch {
        // Ignore logout errors since account is already deleted
      }
      // Redirect to login after account deletion
      window.location.href = "/login";
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete account");
      setIsDeletingAccount(false);
    }
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    // Reset state after dialog closes
    setTimeout(() => {
      setDeleteStep("confirm");
      setDeleteConfirmText("");
      setOtpCode("");
      setDeleteError(null);
    }, 200);
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const response = await billingApi.createCheckoutSession("pro");
      window.location.href = response.url;
    } catch (error) {
      console.error("Failed to start checkout:", error);
      toastManager.add({ type: "error", title: "Failed to start checkout" });
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await billingApi.createPortalSession();
      window.location.href = response.url;
    } catch (error) {
      console.error("Failed to open billing portal:", error);
      toastManager.add({ type: "error", title: "Failed to open billing portal" });
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoadingSettings || isLoadingProfile) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTab value="profile">Profile</TabsTab>
          <TabsTab value="app">App</TabsTab>
          <TabsTab value="billing">Billing</TabsTab>
        </TabsList>

        {/* Profile Tab */}
        <TabsPanel value="profile" className="space-y-6 pt-6">
          <div>
            <h2 className="text-lg font-medium">Profile Settings</h2>
            <p className="text-sm text-muted-foreground">
              Manage your account information.
            </p>
          </div>

          <div className="max-w-md space-y-4">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </Field>

            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input value={email} disabled className="opacity-60" />
              <FieldDescription>
                Email is managed through your authentication provider.
              </FieldDescription>
            </Field>
          </div>

          <Separator />

          <div>
            <h3 className="text-base font-medium">Default Billing Settings</h3>
            <p className="text-sm text-muted-foreground">
              Used when a project doesn&apos;t specify its own rate/currency.
            </p>
          </div>

          <div className="grid max-w-md gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Default Hourly Rate</FieldLabel>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={defaultHourlyRate}
                  onChange={(e) => setDefaultHourlyRate(e.target.value)}
                  placeholder="75.00"
                />
              </div>
            </Field>

            <Field>
              <FieldLabel>Default Currency</FieldLabel>
              <Select value={defaultCurrency} onValueChange={(value) => setDefaultCurrency(value || "USD")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </Field>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleSaveProfile}
              className="bg-teal-500 hover:!bg-teal-600 border-teal-500"
              disabled={isSavingProfile}
            >
              {isSavingProfile ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>

          <Separator />

          <div>
            <h3 className="text-base font-medium">Invoice Logo</h3>
            <p className="text-sm text-muted-foreground">
              Upload a logo to appear on your invoices.
            </p>
          </div>

          <div className="max-w-md">
            <LogoUpload currentLogoUrl={settings?.logo_url} />
          </div>

          <Separator />

          {/* Danger Zone */}
          <div>
            <h3 className="text-base font-medium text-destructive">
              Danger Zone
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Permanently delete your account and all associated data.
            </p>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Delete Account
            </Button>
          </div>
        </TabsPanel>

        {/* App Tab */}
        <TabsPanel value="app" className="space-y-6 pt-6">
          <div>
            <h2 className="text-lg font-medium">App Settings</h2>
            <p className="text-sm text-muted-foreground">
              Customize display preferences and app behavior.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium">Display Preferences</h3>
            <p className="text-sm text-muted-foreground">
              Customize how dates and times are displayed.
            </p>
          </div>

          <Field className="max-w-md">
            <FieldLabel>Timezone</FieldLabel>
            <Select value={timezone} onValueChange={(value) => setTimezone(value || "UTC")}>
              <SelectTrigger>
                <SelectValue>
                  {timezones.find((tz) => tz.value === timezone)?.label || timezone}
                </SelectValue>
              </SelectTrigger>
              <SelectPopup>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
            <FieldDescription>
              All dates and times in the app will be displayed in this timezone.
            </FieldDescription>
          </Field>

          <div className="grid max-w-md gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Time Format</FieldLabel>
              <Select value={timeFormat} onValueChange={(value) => setTimeFormat((value || "12h") as "12h" | "24h")}>
                <SelectTrigger>
                  <SelectValue>
                    {timeFormats.find((f) => f.value === timeFormat)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectPopup>
                  {timeFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
              <FieldDescription>
                Choose whether to display times in 12-hour (AM/PM) or 24-hour format.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel>Week Starts On</FieldLabel>
              <Select value={weekStartsOn.toString()} onValueChange={(value) => setWeekStartsOn(parseInt(value || "0"))}>
                <SelectTrigger>
                  <SelectValue>
                    {weekStartsOn === 0 ? "Sunday" : weekStartsOn === 1 ? "Monday" : "Saturday"}
                  </SelectValue>
                </SelectTrigger>
                <SelectPopup>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                </SelectPopup>
              </Select>
            </Field>
          </div>

          <Separator />

          <div>
            <h3 className="text-base font-medium">Timer Settings</h3>
            <p className="text-sm text-muted-foreground">
              Prevent forgotten timers from running indefinitely.
            </p>
          </div>

          <Field className="max-w-md">
            <FieldLabel>Auto-Pause Timer After</FieldLabel>
            <Select
              value={maxTimerHours ?? "none"}
              onValueChange={(value) => setMaxTimerHours(value === "none" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue>
                  {maxTimerHours === null
                    ? "No limit"
                    : `${maxTimerHours} hours`}
                </SelectValue>
              </SelectTrigger>
              <SelectPopup>
                <SelectItem value="4">4 hours</SelectItem>
                <SelectItem value="8">8 hours</SelectItem>
                <SelectItem value="12">12 hours</SelectItem>
                <SelectItem value="24">24 hours</SelectItem>
                <SelectItem value="none">No limit</SelectItem>
              </SelectPopup>
            </Select>
            <FieldDescription>
              Timer will automatically pause when it reaches this duration.
              You&apos;ll see a warning and can review the time before saving.
            </FieldDescription>
          </Field>

          <div className="pt-2">
            <Button
              onClick={handleSaveAppSettings}
              className="bg-teal-500 hover:!bg-teal-600 border-teal-500"
              disabled={isSavingAppSettings}
            >
              {isSavingAppSettings ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </TabsPanel>

        {/* Billing Tab */}
        <TabsPanel value="billing" className="space-y-6 pt-6">
          {/* Subscription Card */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>
                {userTier === "free"
                  ? "You are not subscribed"
                  : `Subscribed to ${tierNames[userTier]}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Billing status</span>
                <span>
                  {userTier === "free" ? "You will not be billed." : "Active"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">
                  {userTier === "free" ? "Free tier" : "Renews"}
                </span>
                <span>
                  {userTier === "free"
                    ? "Upgrade to a paid plan to boost your productivity."
                    : formatDate(subscription?.subscription?.current_period_end)}
                </span>
              </div>
              {userTier === "free" ? (
                <Button
                  onClick={handleUpgrade}
                  className="bg-teal-500 hover:!bg-teal-600 border-teal-500"
                  disabled={isUpgrading}
                >
                  {isUpgrading ? (
                    <>
                      <Spinner className="mr-2 size-4" />
                      Redirecting...
                    </>
                  ) : (
                    <>
                      <Crown className="mr-2 size-4" />
                      Upgrade
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={handleManageSubscription} variant="outline">
                  Manage Subscription
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Billing Email Card */}
          <Card>
            <CardHeader>
              <CardTitle>Billing email</CardTitle>
              <CardDescription>
                {userTier === "free"
                  ? "Upgrade to a paid plan to receive billing emails."
                  : "Billing emails will be sent to this address."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 max-w-md">
                <Input
                  type="email"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={userTier === "free"}
                />
                <Button disabled={userTier === "free"}>Save</Button>
              </div>
            </CardContent>
          </Card>

          {/* Invoices Card */}
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <Empty>
                <EmptyMedia variant="icon">
                  <FileText className="size-5" />
                </EmptyMedia>
                <EmptyTitle>No invoices yet</EmptyTitle>
                <EmptyDescription>
                  Once a payment is made, you will see your invoices here.
                </EmptyDescription>
              </Empty>
            </CardContent>
          </Card>
        </TabsPanel>
      </Tabs>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={handleCloseDeleteDialog}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              {deleteStep === "confirm"
                ? "This action cannot be undone. This will permanently delete your account and remove all your data from our servers."
                : `We've sent a verification code to ${email}. Enter the code below to confirm deletion.`}
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>
            {deleteStep === "confirm" ? (
              <Field>
                <FieldLabel>
                  Type <span className="font-mono font-bold">DELETE</span> to
                  continue
                </FieldLabel>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  disabled={isRequestingOtp}
                />
              </Field>
            ) : (
              <Field>
                <FieldLabel>Verification Code</FieldLabel>
                <Input
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  disabled={isDeletingAccount}
                  maxLength={6}
                  className="font-mono text-center text-lg tracking-widest"
                />
                <FieldDescription>
                  Code expires in 10 minutes
                </FieldDescription>
              </Field>
            )}
            {deleteError && (
              <p className="text-sm text-destructive mt-2">{deleteError}</p>
            )}
          </DialogPanel>
          <DialogFooter variant="bare">
            <Button variant="outline" onClick={handleCloseDeleteDialog}>
              Cancel
            </Button>
            {deleteStep === "confirm" ? (
              <Button
                variant="destructive"
                onClick={handleRequestDeletionOtp}
                disabled={deleteConfirmText !== "DELETE" || isRequestingOtp}
              >
                {isRequestingOtp ? (
                  <>
                    <Spinner className="mr-2 size-4" />
                    Sending code...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleConfirmDeletion}
                disabled={otpCode.length !== 6 || isDeletingAccount}
              >
                {isDeletingAccount ? (
                  <>
                    <Spinner className="mr-2 size-4" />
                    Deleting...
                  </>
                ) : (
                  "Delete Account"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
