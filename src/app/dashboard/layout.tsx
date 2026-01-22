"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  FolderOpen,
  Users,
  FileText,
  Settings,
  Menu,
  Play,
  Pause,
  Square,
  DollarSign,
  Sun,
  Moon,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipTrigger,
  TooltipPopup,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTimerContext, useAuthContext } from "@/contexts";
import { useProjects } from "@/lib/hooks";
import { formatDuration } from "@/lib/utils/date";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/time-entries", icon: Clock, label: "Time Entries" },
  { href: "/dashboard/projects", icon: FolderOpen, label: "Projects" },
  { href: "/dashboard/clients", icon: Users, label: "Clients" },
  { href: "/dashboard/invoices", icon: FileText, label: "Invoices" },
];

const bottomNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/dashboard/time-entries", icon: Clock, label: "Time" },
  { href: "/dashboard/projects", icon: FolderOpen, label: "Projects" },
  { href: "/dashboard/clients", icon: Users, label: "Clients" },
  { href: "/dashboard/invoices", icon: FileText, label: "Invoices" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = stored === "dark" || (!stored && prefersDark);
    setIsDarkMode(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  const toggleDarkMode = () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    document.documentElement.classList.toggle("dark", newValue);
    localStorage.setItem("theme", newValue ? "dark" : "light");
  };

  const {
    isRunning,
    isPaused,
    displayTime,
    description,
    projectId,
    isBillable,
    isSubmitting,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    setDescription,
    setProjectId,
    setIsBillable,
  } = useTimerContext();

  const { projects } = useProjects({ limit: 100 });
  const { user } = useAuthContext();

  const userInitials = user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const timerState = isRunning ? (isPaused ? "paused" : "running") : "idle";

  const handleStart = async () => {
    await startTimer();
  };

  const handlePause = async () => {
    await pauseTimer();
  };

  const handleResume = async () => {
    await resumeTimer();
  };

  const handleStop = async () => {
    await stopTimer();
  };

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
                <Menu className="size-5" />
              </button>
              <Link
                href="/dashboard"
                className="text-xl font-bold text-teal-500"
              >
                BillMint
              </Link>
            </div>

            {/* Center: Timer Controls */}
            <div className="flex flex-1 items-center justify-center gap-3">
              <Input
                type="text"
                placeholder="What are you working on?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-64 rounded-xl"
              />

              <Select
                value={projectId || ""}
                onValueChange={(value) => setProjectId(value || null)}
              >
                <SelectTrigger className="w-40 rounded-xl">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectPopup>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>

              <Button
                variant={isBillable ? "default" : "outline"}
                size="icon"
                onClick={() => setIsBillable(!isBillable)}
                className={cn(
                  "rounded-xl",
                  isBillable && "bg-teal-500 hover:!bg-teal-600 border-teal-500"
                )}
              >
                <DollarSign className="size-4" />
              </Button>

              <div className="min-w-24 text-center font-mono text-lg font-semibold tabular-nums">
                {formatDuration(displayTime)}
              </div>

              {timerState === "idle" && (
                <Button
                  onClick={handleStart}
                  disabled={isSubmitting}
                  className="rounded-xl bg-teal-500 hover:!bg-teal-600 border-teal-500"
                >
                  <Play className="mr-1 size-4" />
                  Start
                </Button>
              )}

              {timerState === "running" && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePause}
                    disabled={isSubmitting}
                    className="rounded-xl"
                  >
                    <Pause className="size-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleStop}
                    disabled={isSubmitting}
                    className="rounded-xl"
                  >
                    <Square className="mr-1 size-4" />
                    Stop
                  </Button>
                </div>
              )}

              {timerState === "paused" && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleResume}
                    disabled={isSubmitting}
                    className="rounded-xl bg-teal-500 hover:!bg-teal-600 border-teal-500"
                  >
                    <Play className="mr-1 size-4" />
                    Resume
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleStop}
                    disabled={isSubmitting}
                    className="rounded-xl"
                  >
                    <Square className="mr-1 size-4" />
                    Stop
                  </Button>
                </div>
              )}
            </div>

            {/* Right: Dark Mode + Settings + User Avatar */}
            <div className="flex items-center gap-2 w-56 shrink-0 justify-end">
              <button
                onClick={toggleDarkMode}
                className="flex items-center justify-center rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {isDarkMode ? <Sun className="size-5" /> : <Moon className="size-5" />}
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
              <Link href="/dashboard/settings">
                <Avatar className="size-9">
                  <AvatarImage src={user?.avatar_url || undefined} alt={user?.full_name || "User"} />
                  <AvatarFallback className="bg-teal-500 text-white text-sm font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Link>
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
                className="text-xl font-bold text-teal-500"
              >
                BillMint
              </Link>

              {/* Mobile: Dark Mode + Settings + Avatar */}
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleDarkMode}
                  className="flex items-center justify-center rounded-xl p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {isDarkMode ? <Sun className="size-5" /> : <Moon className="size-5" />}
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
                <Link href="/dashboard/settings">
                  <Avatar>
                    <AvatarImage src={user?.avatar_url || undefined} alt={user?.full_name || "User"} />
                    <AvatarFallback className="bg-teal-500 text-white text-sm font-medium">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </div>
            </div>

            {/* Mobile Timer Row */}
            <div className="flex flex-col gap-2 border-t px-4 py-3">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="What are you working on?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex-1"
                />
                <Select
                  value={projectId || ""}
                  onValueChange={(value) => setProjectId(value || null)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Project" />
                  </SelectTrigger>
                  <SelectPopup>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant={isBillable ? "default" : "outline"}
                    size="icon-sm"
                    onClick={() => setIsBillable(!isBillable)}
                    className={cn(
                      isBillable && "bg-teal-500 hover:!bg-teal-600 border-teal-500"
                    )}
                  >
                    <DollarSign className="size-4" />
                  </Button>
                  <span className="font-mono text-lg font-semibold tabular-nums">
                    {formatDuration(displayTime)}
                  </span>
                </div>

                <div className="flex gap-2">
                  {timerState === "idle" && (
                    <Button
                      onClick={handleStart}
                      size="sm"
                      disabled={isSubmitting}
                      className="bg-teal-500 hover:!bg-teal-600 border-teal-500"
                    >
                      <Play className="mr-1 size-4" />
                      Start
                    </Button>
                  )}

                  {timerState === "running" && (
                    <>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={handlePause}
                        disabled={isSubmitting}
                      >
                        <Pause className="size-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleStop}
                        disabled={isSubmitting}
                      >
                        <Square className="size-4" />
                      </Button>
                    </>
                  )}

                  {timerState === "paused" && (
                    <>
                      <Button
                        onClick={handleResume}
                        size="sm"
                        disabled={isSubmitting}
                        className="bg-teal-500 hover:!bg-teal-600 border-teal-500"
                      >
                        <Play className="size-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleStop}
                        disabled={isSubmitting}
                      >
                        <Square className="size-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
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
      </div>
    </TooltipProvider>
  );
}
