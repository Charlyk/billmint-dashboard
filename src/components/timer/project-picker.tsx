"use client";

import { useState, useRef, useEffect } from "react";
import { FolderOpen, Plus, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogPanel,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipPopup,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useProjectMutations } from "@/lib/hooks";
import { projectsApi } from "@/lib/api";
import type { ProjectWithStats } from "@/types";

// Color options for projects (matches validation schema)
const colorOptions = [
  { name: "Emerald", value: "emerald", hex: "#10b981" },
  { name: "Blue", value: "blue", hex: "#3b82f6" },
  { name: "Purple", value: "purple", hex: "#8b5cf6" },
  { name: "Pink", value: "pink", hex: "#ec4899" },
  { name: "Orange", value: "orange", hex: "#f97316" },
  { name: "Yellow", value: "yellow", hex: "#eab308" },
  { name: "Slate", value: "slate", hex: "#64748b" },
  { name: "Red", value: "red", hex: "#ef4444" },
] as const;

type ProjectColor = typeof colorOptions[number]["value"];

// Convert color name to hex value
function getColorHex(colorName: string): string {
  const color = colorOptions.find((c) => c.value === colorName);
  return color?.hex ?? "#64748b"; // default to slate
}

interface ProjectPickerProps {
  value: string | null;
  onChange: (projectId: string | null) => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
  variant?: "desktop" | "mobile";
  /** Pre-loaded project data (e.g., from timer context) to show color dot without fetching */
  selectedProject?: { id: string; name: string; color: string } | null;
}

export function ProjectPicker({
  value,
  onChange,
  triggerRef,
  variant = "desktop",
  selectedProject: initialSelectedProject,
}: ProjectPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [mode, setMode] = useState<"browse" | "create">("browse");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectColor, setNewProjectColor] = useState<ProjectColor>("blue");
  const [isCreating, setIsCreating] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const { createProject } = useProjectMutations();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch projects with debounced search - only when dialog is open
  useEffect(() => {
    if (!open) return;

    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const result = await projectsApi.listProjects({
          limit: 100,
          search: debouncedSearch || undefined,
        });
        setProjects(result.data);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [open, debouncedSearch]);

  const refreshProjects = async () => {
    setIsLoading(true);
    try {
      const result = await projectsApi.listProjects({
        limit: 100,
        search: debouncedSearch || undefined,
      });
      setProjects(result.data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Use pre-loaded project if available, otherwise find from fetched list
  const selectedProject = initialSelectedProject || projects.find((p) => p.id === value);

  // Focus appropriate input when dialog opens or mode changes
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        if (mode === "browse") {
          searchInputRef.current?.focus();
        } else {
          nameInputRef.current?.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open, mode]);

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearch("");
      setMode("browse");
      setNewProjectName("");
      setNewProjectColor("blue");
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const newProject = await createProject({
        name: newProjectName.trim(),
        color: newProjectColor,
        currency: "USD",
        is_billable: true,
        is_default: false,
      });
      onChange(newProject.id);
      refreshProjects();
      handleOpenChange(false);
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Expose open method via ref for keyboard shortcuts
  useEffect(() => {
    if (triggerRef?.current) {
      const button = triggerRef.current;
      const originalClick = button.click.bind(button);
      button.click = () => {
        setOpen(true);
      };
      return () => {
        button.click = originalClick;
      };
    }
  }, [triggerRef]);

  const handleSelect = (projectId: string | null) => {
    onChange(projectId);
    handleOpenChange(false);
  };

  const trigger = (
    <Button
      ref={triggerRef}
      variant="outline"
      size={variant === "mobile" ? "icon-sm" : "icon"}
      className={cn(
        "relative",
        variant === "desktop" && "rounded-xl"
      )}
    >
      <FolderOpen className="size-4" />
      {selectedProject && (
        <span
          className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background"
          style={{ backgroundColor: getColorHex(selectedProject.color) }}
        />
      )}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {variant === "desktop" ? (
        <Tooltip>
          <TooltipTrigger render={<DialogTrigger render={trigger} />} />
          <TooltipPopup className="flex items-center gap-2">
            <span>{selectedProject?.name || "Select project"}</span>
            <kbd className="inline-flex size-5 items-center justify-center rounded border bg-background text-[10px] font-semibold">
              P
            </kbd>
          </TooltipPopup>
        </Tooltip>
      ) : (
        <DialogTrigger render={trigger} />
      )}

      <DialogPopup className="max-w-sm">
        {mode === "browse" ? (
          <>
            <DialogHeader>
              <DialogTitle>Select Project</DialogTitle>
            </DialogHeader>
            <DialogPanel className="flex flex-col gap-3">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <div className="flex flex-col gap-1 -mx-2">
                {/* Create new project option */}
                <button
                  type="button"
                  onClick={() => setMode("create")}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-accent text-teal-600 dark:text-teal-400"
                >
                  <Plus className="size-4" />
                  <span className="font-medium">Create new project</span>
                </button>

                {/* No project option */}
                <button
                  type="button"
                  onClick={() => handleSelect(null)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                    "hover:bg-accent",
                    !value && "bg-accent"
                  )}
                >
                  <span className="size-3 rounded-full bg-muted-foreground/20" />
                  <span className="text-muted-foreground">No project</span>
                </button>

                {/* Projects list */}
                {isLoading && projects.length === 0 ? (
                  <div className="px-3 py-4 flex items-center justify-center text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                  </div>
                ) : projects.length > 0 ? (
                  projects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => handleSelect(project.id)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                        "hover:bg-accent",
                        value === project.id && "bg-accent"
                      )}
                    >
                      <span
                        className="size-3 rounded-full shrink-0"
                        style={{ backgroundColor: getColorHex(project.color) }}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate font-medium">{project.name}</span>
                        {project.client && (
                          <span className="text-xs text-muted-foreground truncate">
                            {project.client.name}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                ) : search ? (
                  <div className="px-3 py-4 text-center text-muted-foreground text-sm">
                    No projects matching &ldquo;{search}&rdquo;
                  </div>
                ) : (
                  <div className="px-3 py-4 text-center text-muted-foreground text-sm">
                    No projects yet. Create your first project above.
                  </div>
                )}
              </div>
            </DialogPanel>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setMode("browse")}
                  disabled={isCreating}
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <DialogTitle>New Project</DialogTitle>
              </div>
            </DialogHeader>
            <DialogPanel className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Project Name
                </label>
                <Input
                  ref={nameInputRef}
                  type="text"
                  placeholder="Enter project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newProjectName.trim()) {
                      handleCreateProject();
                    }
                  }}
                  disabled={isCreating}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Color
                </label>
                <div className="flex gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setNewProjectColor(color.value)}
                      disabled={isCreating}
                      className={cn(
                        "size-7 rounded-full transition-all",
                        newProjectColor === color.value
                          ? "ring-2 ring-offset-2 ring-foreground"
                          : "hover:scale-110"
                      )}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </DialogPanel>
            <DialogFooter variant="bare">
              <Button
                variant="outline"
                onClick={() => setMode("browse")}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim() || isCreating}
                className="bg-teal-500 hover:bg-teal-600 border-teal-500"
              >
                {isCreating ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogPopup>
    </Dialog>
  );
}
