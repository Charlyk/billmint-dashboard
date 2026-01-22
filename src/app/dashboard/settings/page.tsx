"use client";

import { useState } from "react";
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

// Mock user data
const mockUser = {
  name: "Your Name",
  email: "your@email.com",
  defaultHourlyRate: "75.00",
  defaultCurrency: "USD",
  timezone: "America/New_York",
  plan: "free",
};

const currencies = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
];

const timezones = [
  { value: "America/New_York", label: "America/New_York (EST)" },
  { value: "America/Chicago", label: "America/Chicago (CST)" },
  { value: "America/Denver", label: "America/Denver (MST)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST)" },
  { value: "Europe/London", label: "Europe/London (GMT)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET)" },
  { value: "Europe/Bucharest", label: "Europe/Bucharest (EET)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEDT)" },
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
  const [name, setName] = useState(mockUser.name);
  const [defaultHourlyRate, setDefaultHourlyRate] = useState(
    mockUser.defaultHourlyRate
  );
  const [defaultCurrency, setDefaultCurrency] = useState(
    mockUser.defaultCurrency
  );
  const [timezone, setTimezone] = useState(mockUser.timezone);
  const [currentPlan] = useState(mockUser.plan);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handleSaveProfile = () => {
    // TODO: Save profile to API
    console.log("Save profile:", {
      name,
      defaultHourlyRate,
      defaultCurrency,
      timezone,
    });
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
              <Input value={mockUser.email} disabled className="opacity-60" />
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

          <div className="max-w-md">
            <Field>
              <FieldLabel>Timezone</FieldLabel>
              <Select value={timezone} onValueChange={(value) => setTimezone(value || "America/New_York")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </Field>
          </div>

          <div>
            <Button
              onClick={handleSaveProfile}
              className="bg-teal-500 hover:!bg-teal-600 border-teal-500"
            >
              Save Changes
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
