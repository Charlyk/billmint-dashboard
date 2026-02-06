"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  FolderOpen,
  Users,
  FileText,
  BarChart3,
  Settings,
  Menu as MenuIcon,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import {
  Menu,
  MenuTrigger,
  MenuPopup,
  MenuItem,
  MenuSeparator,
} from "@/components/ui/menu";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  Tooltip,
  TooltipTrigger,
  TooltipPopup,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { TimerControls } from "@/components/timer";
import {
  AlertDialog,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/time-entries", icon: Clock, label: "Time Entries" },
  { href: "/dashboard/invoices", icon: FileText, label: "Invoices" },
  { href: "/dashboard/reports", icon: BarChart3, label: "Reports" },
  { href: "/dashboard/projects", icon: FolderOpen, label: "Projects" },
  { href: "/dashboard/clients", icon: Users, label: "Clients" },
];

const bottomNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/dashboard/time-entries", icon: Clock, label: "Time" },
  { href: "/dashboard/invoices", icon: FileText, label: "Invoices" },
  { href: "/dashboard/projects", icon: FolderOpen, label: "Projects" },
  { href: "/dashboard/clients", icon: Users, label: "Clients" },
];

interface DashboardShellProps {
  children: React.ReactNode;
  user: User;
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  const pathname = usePathname();
  const { logout, isSubmitting } = useAuth();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Initialize dark mode after hydration to avoid mismatch
  /* eslint-disable react-hooks/set-state-in-effect -- legitimate use for hydration safety */
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = stored === "dark" || (!stored && prefersDark);
    setIsDarkMode(shouldBeDark);
    setMounted(true);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggleDarkMode = () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    document.documentElement.classList.toggle("dark", newValue);
    localStorage.setItem("theme", newValue ? "dark" : "light");
  };

  const userInitials = user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <TooltipProvider>
      {/* Page background */}
      <div className="min-h-screen bg-muted/40">
        {/* Desktop Layout */}
        <div className="hidden md:flex md:flex-col md:h-screen">
          {/* Top Bar - Full Width */}
          <header className="flex h-16 items-center px-4 shrink-0">
            {/* Left: Menu + Logo */}
            <div className="flex items-center gap-2 w-56 shrink-0">
              <button
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
                className="flex items-center justify-center rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <MenuIcon className="size-5" />
              </button>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-xl font-bold text-teal-500"
              >
                <Image
                  src="/billmint_logo.webp"
                  alt="BillMint logo"
                  width={28}
                  height={28}
                  className="size-7"
                />
                BillMint
              </Link>
            </div>

            {/* Center: Timer Controls */}
            <TimerControls variant="desktop" />

            {/* Right: Dark Mode + Settings + User Avatar */}
            <div className="flex items-center gap-2 w-56 shrink-0 justify-end">
              <button
                onClick={toggleDarkMode}
                className="flex items-center justify-center rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {mounted && isDarkMode ? <Sun className="size-5" /> : <Moon className="size-5" />}
              </button>
              <Link
                href="/dashboard/settings"
                className={cn(
                  "flex items-center justify-center rounded-xl p-2.5 transition-colors",
                  pathname === "/dashboard/settings"
                    ? "bg-teal-500/10 text-teal-600"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Settings className="size-5" />
              </Link>
              <Menu>
                <MenuTrigger className="cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <Avatar className="size-9">
                    <AvatarImage src={user?.avatar_url || undefined} alt={user?.full_name || "User"} />
                    <AvatarFallback className="bg-teal-500 text-white text-sm font-medium">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </MenuTrigger>
                <MenuPopup align="end" sideOffset={8}>
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <MenuSeparator />
                  <MenuItem render={<Link href="/dashboard/settings" />}>
                    <Settings className="size-4" />
                    Settings
                  </MenuItem>
                  <MenuSeparator />
                  <MenuItem
                    onClick={() => setShowLogoutDialog(true)}
                    variant="destructive"
                  >
                    <LogOut className="size-4" />
                    Log out
                  </MenuItem>
                </MenuPopup>
              </Menu>
            </div>
          </header>

          {/* Main Area with Sidebar and Content */}
          <div className="flex flex-1 gap-3 px-3 pb-3 overflow-hidden">
            {/* Left Sidebar - Navigation Rail */}
            <aside
              className={cn(
                "flex flex-col transition-all duration-300 shrink-0",
                sidebarExpanded ? "w-52" : "w-16"
              )}
            >
              {/* Nav Items */}
              <nav className="flex-1 space-y-1 py-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  if (sidebarExpanded) {
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-teal-500/10 text-teal-600"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <Icon className="size-5 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  }

                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger
                        render={
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center justify-center rounded-xl p-3 transition-colors",
                              active
                                ? "bg-teal-500/10 text-teal-600"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                            )}
                          />
                        }
                      >
                        <Icon className="size-5" />
                      </TooltipTrigger>
                      <TooltipPopup side="right">{item.label}</TooltipPopup>
                    </Tooltip>
                  );
                })}
              </nav>

            </aside>

            {/* Main Content Island */}
            <div className="flex flex-1 flex-col rounded-2xl bg-card border shadow-sm overflow-hidden">
              {/* Page Content */}
              <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex flex-col md:hidden">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 bg-card border-b">
            {/* Logo row */}
            <div className="flex h-14 items-center justify-between px-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-xl font-bold text-teal-500"
              >
                <Image
                  src="/billmint_logo.webp"
                  alt="BillMint logo"
                  width={28}
                  height={28}
                  className="size-7"
                />
                BillMint
              </Link>

              {/* Mobile: Dark Mode + Settings + Avatar */}
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleDarkMode}
                  className="flex items-center justify-center rounded-xl p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {mounted && isDarkMode ? <Sun className="size-5" /> : <Moon className="size-5" />}
                </button>
                <Link
                  href="/dashboard/settings"
                  className={cn(
                    "flex items-center justify-center rounded-xl p-2 transition-colors",
                    pathname === "/dashboard/settings"
                      ? "bg-teal-500/10 text-teal-600"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Settings className="size-5" />
                </Link>
                <Menu>
                  <MenuTrigger className="cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <Avatar>
                      <AvatarImage src={user?.avatar_url || undefined} alt={user?.full_name || "User"} />
                      <AvatarFallback className="bg-teal-500 text-white text-sm font-medium">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </MenuTrigger>
                  <MenuPopup align="end" sideOffset={8}>
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium">{user?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <MenuSeparator />
                    <MenuItem render={<Link href="/dashboard/settings" />}>
                      <Settings className="size-4" />
                      Settings
                    </MenuItem>
                    <MenuSeparator />
                    <MenuItem
                      onClick={() => setShowLogoutDialog(true)}
                      variant="destructive"
                    >
                      <LogOut className="size-4" />
                      Log out
                    </MenuItem>
                  </MenuPopup>
                </Menu>
              </div>
            </div>

            {/* Mobile Timer Row */}
            <TimerControls variant="mobile" />
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 pb-20">{children}</main>

          {/* Bottom Navigation - Mobile */}
          <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card">
            <div className="flex items-center justify-around py-2">
              {bottomNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center gap-1 px-3 py-1",
                      active ? "text-teal-600" : "text-muted-foreground"
                    )}
                  >
                    <Icon className="size-5" />
                    <span className="text-xs">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Floating Onboarding Checklist */}
        <OnboardingChecklist />
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" />}>
              Cancel
            </AlertDialogClose>
            <Button
              variant="destructive"
              onClick={() => logout()}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Logging out...
                </>
              ) : (
                "Log out"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </TooltipProvider>
  );
}
