"use client";

import {
  Play,
  Pause,
  Square,
  DollarSign,
  Trash2,
} from "lucide-react";
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
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTimerContext } from "@/contexts";
import { useProjects, useTimerShortcuts } from "@/lib/hooks";
import { formatDuration } from "@/lib/utils/date";

interface TimerControlsProps {
  variant: "desktop" | "mobile";
}

export function TimerControls({ variant }: TimerControlsProps) {
  const {
    timerState,
    displayTime,
    description,
    projectId,
    isBillable,
    isSubmitting,
    descriptionInputRef,
    projectSelectRef,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    discardTimer,
    setDescription,
    setProjectId,
    setIsBillable,
  } = useTimerContext();

  // Only enable keyboard shortcuts on desktop
  useTimerShortcuts({ enabled: variant === "desktop" });

  const { projects } = useProjects({ limit: 100 });

  const handleStart = () => startTimer();
  const handlePause = () => pauseTimer();
  const handleResume = () => resumeTimer();
  const handleStop = () => stopTimer();
  const handleDiscard = () => {
    if (window.confirm("Discard this timer without saving?")) {
      discardTimer();
    }
  };

  if (variant === "mobile") {
    return (
      <div className={cn(
        "flex flex-col gap-2 border-t px-4 py-3 transition-opacity",
        timerState === "paused" && "opacity-70"
      )}>
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
            <span className={cn(
              "font-mono text-lg font-semibold tabular-nums",
              timerState === "running" && "text-teal-500 animate-pulse"
            )}>
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
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={handleDiscard}
                  disabled={isSubmitting}
                  className="text-muted-foreground"
                >
                  <Trash2 className="size-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Desktop variant
  return (
    <div className={cn(
      "flex flex-1 items-center justify-center gap-3 transition-opacity",
      timerState === "paused" && "opacity-70"
    )}>
      <Tooltip>
        <TooltipTrigger
          render={
            <Input
              ref={descriptionInputRef}
              type="text"
              placeholder="What are you working on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-64 rounded-xl"
            />
          }
        />
        <TooltipPopup className="flex items-center gap-2">
          <span>Focus</span>
          <kbd className="inline-flex size-5 items-center justify-center rounded border bg-background text-[10px] font-semibold">/</kbd>
        </TooltipPopup>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Select
              value={projectId || ""}
              onValueChange={(value) => setProjectId(value || null)}
            >
              <SelectTrigger ref={projectSelectRef} className="w-40 rounded-xl">
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
          }
        />
        <TooltipPopup className="flex items-center gap-2">
          <span>Select project</span>
          <kbd className="inline-flex size-5 items-center justify-center rounded border bg-background text-[10px] font-semibold">P</kbd>
        </TooltipPopup>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant={isBillable ? "default" : "outline"}
              size="icon"
              onClick={() => setIsBillable(!isBillable)}
              className={cn(
                "rounded-xl",
                isBillable && "bg-teal-500 hover:!bg-teal-600 border-teal-500"
              )}
            />
          }
        >
          <DollarSign className="size-4" />
        </TooltipTrigger>
        <TooltipPopup className="flex items-center gap-2">
          <span>{isBillable ? "Billable" : "Non-billable"}</span>
          <kbd className="inline-flex size-5 items-center justify-center rounded border bg-background text-[10px] font-semibold">B</kbd>
        </TooltipPopup>
      </Tooltip>

      <div className={cn(
        "min-w-24 text-center font-mono text-lg font-semibold tabular-nums",
        timerState === "running" && "text-teal-500 animate-pulse"
      )}>
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
          <kbd className="ml-2 inline-flex size-5 items-center justify-center rounded bg-white/20 text-xs font-semibold text-white">S</kbd>
        </Button>
      )}

      {timerState === "running" && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePause}
            disabled={isSubmitting}
            className="rounded-xl"
          >
            <Pause className="mr-1 size-4" />
            Pause
            <kbd className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 text-[10px] font-semibold text-foreground">Space</kbd>
          </Button>
          <Button
            variant="destructive"
            onClick={handleStop}
            disabled={isSubmitting}
            className="rounded-xl"
          >
            <Square className="mr-1 size-4" />
            Stop
            <kbd className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded bg-white/20 px-1 text-[10px] font-semibold text-white">Esc</kbd>
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
            <kbd className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded bg-white/20 px-1 text-[10px] font-semibold text-white">Space</kbd>
          </Button>
          <Button
            variant="destructive"
            onClick={handleStop}
            disabled={isSubmitting}
            className="rounded-xl"
          >
            <Square className="mr-1 size-4" />
            Stop
            <kbd className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded bg-white/20 px-1 text-[10px] font-semibold text-white">Esc</kbd>
          </Button>
          <Button
            variant="outline"
            onClick={handleDiscard}
            disabled={isSubmitting}
            className="rounded-xl text-muted-foreground hover:text-destructive hover:border-destructive"
          >
            <Trash2 className="mr-1 size-4" />
            Discard
            <kbd className="ml-2 inline-flex size-5 items-center justify-center rounded border bg-muted text-[10px] font-semibold text-foreground">D</kbd>
          </Button>
        </div>
      )}
    </div>
  );
}
