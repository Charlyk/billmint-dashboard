"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Check } from "lucide-react";
import { useUserSettings } from "@/contexts/user-settings-context";
import { userApi } from "@/lib/api";
import { toastManager } from "@/components/ui/toast";

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

const plans = {
  free: {
    name: "Free",
    price: "$0",
    features: ["1 user", "Time tracking only", "No invoices"],
  },
  pro: {
    name: "Pro",
    price: "$5/month",
    features: [
      "Up to 5 team members",
      "Unlimited invoices",
      "PDF generation",
      "Payment reminders",
    ],
  },
  team: {
    name: "Team",
    price: "$10/month",
    features: [
      "Up to 50 team members",
      "Everything in Pro",
      "Advanced reports",
      "Priority support",
    ],
  },
};

export default function SettingsPage() {
  const { settings, isLoading, refetchSettings } = useUserSettings();

  // Profile state
  const [name, setName] = useState("");
  const [email] = useState("your@email.com"); // Email is managed by auth provider

  // Settings state
  const [defaultHourlyRate, setDefaultHourlyRate] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");
  const [weekStartsOn, setWeekStartsOn] = useState(0);

  const [currentPlan] = useState("free");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form values from settings
  useEffect(() => {
    if (settings) {
      setDefaultHourlyRate(settings.default_hourly_rate?.toString() || "");
      setDefaultCurrency(settings.default_currency || "USD");
      setTimeFormat(settings.time_format || "12h");
      setWeekStartsOn(settings.week_starts_on ?? 0);
    }
  }, [settings]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await userApi.updateSettings({
        default_hourly_rate: defaultHourlyRate ? parseFloat(defaultHourlyRate) : undefined,
        default_currency: defaultCurrency || undefined,
        time_format: timeFormat,
        week_starts_on: weekStartsOn,
      });
      await refetchSettings();
      toastManager.add({ type: "success", title: "Settings saved" });
    } catch (error) {
      console.error("Failed to save settings:", error);
      toastManager.add({ type: "error", title: "Failed to save settings" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText === "DELETE") {
      // TODO: Delete account via API
      console.log("Delete account");
      setIsDeleteDialogOpen(false);
    }
  };

  const handleUpgrade = (plan: string) => {
    // TODO: Redirect to Stripe checkout
    console.log("Upgrade to:", plan);
  };

  if (isLoading) {
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
          <TabsTab value="billing">Billing</TabsTab>
        </TabsList>

        {/* Profile Tab */}
        <TabsPanel value="profile" className="space-y-6 pt-6">
          <div>
            <h2 className="text-lg font-medium">Profile Settings</h2>
            <p className="text-sm text-muted-foreground">
              Manage your account information and preferences.
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

          <Separator />

          <div>
            <h3 className="text-base font-medium">Display Preferences</h3>
            <p className="text-sm text-muted-foreground">
              Customize how dates and times are displayed.
            </p>
          </div>

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

          <div>
            <Button
              onClick={handleSaveProfile}
              className="bg-teal-500 hover:!bg-teal-600 border-teal-500"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
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

        {/* Billing Tab */}
        <TabsPanel value="billing" className="space-y-6 pt-6">
          <div>
            <h2 className="text-lg font-medium">Billing</h2>
            <p className="text-sm text-muted-foreground">
              Current Plan:{" "}
              <span className="font-medium text-foreground">
                {plans[currentPlan as keyof typeof plans].name}
              </span>
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Pro Plan */}
            <Card>
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Pro Plan</h3>
                  <p className="text-2xl font-bold">
                    $5<span className="text-base font-normal">/month</span>
                  </p>
                </div>
                <Separator className="mb-4" />
                <ul className="mb-6 space-y-2">
                  {plans.pro.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="size-4 text-teal-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleUpgrade("pro")}
                  className="w-full bg-teal-500 hover:!bg-teal-600 border-teal-500"
                  disabled={currentPlan === "pro" || currentPlan === "team"}
                >
                  {currentPlan === "pro" ? "Current Plan" : "Upgrade to Pro"}
                </Button>
              </CardContent>
            </Card>

            {/* Team Plan */}
            <Card>
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Team Plan</h3>
                  <p className="text-2xl font-bold">
                    $10<span className="text-base font-normal">/month</span>
                  </p>
                </div>
                <Separator className="mb-4" />
                <ul className="mb-6 space-y-2">
                  {plans.team.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="size-4 text-teal-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleUpgrade("team")}
                  className="w-full bg-teal-500 hover:!bg-teal-600 border-teal-500"
                  disabled={currentPlan === "team"}
                >
                  {currentPlan === "team" ? "Current Plan" : "Upgrade to Team"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsPanel>
      </Tabs>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove all your data from our servers.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <Field>
              <FieldLabel>
                Type <span className="font-mono font-bold">DELETE</span> to
                confirm
              </FieldLabel>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
              />
            </Field>
          </DialogPanel>
          <DialogFooter variant="bare">
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "DELETE"}
            >
              Delete Account
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
