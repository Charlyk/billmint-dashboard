"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogPanel,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";
import {
  Menu,
  MenuTrigger,
  MenuPopup,
  MenuItem,
  MenuSeparator,
} from "@/components/ui/menu";
import {
  Plus,
  MoreVertical,
  Pencil,
  Clock,
  Archive,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { projectsApi, clientsApi } from "@/lib/api";
import { useUserSettings } from "@/contexts/user-settings-context";
import { toastManager } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils/currency";
import type { ProjectWithStats, ClientWithStats } from "@/types";
import type { CreateProjectInput } from "@/lib/utils/validation";

// Color options for projects
const colorOptions = [
  { name: "Emerald", value: "emerald", class: "bg-emerald-500" },
  { name: "Blue", value: "blue", class: "bg-blue-500" },
  { name: "Purple", value: "purple", class: "bg-purple-500" },
  { name: "Pink", value: "pink", class: "bg-pink-500" },
  { name: "Orange", value: "orange", class: "bg-orange-500" },
  { name: "Yellow", value: "yellow", class: "bg-yellow-500" },
  { name: "Slate", value: "slate", class: "bg-slate-500" },
  { name: "Red", value: "red", class: "bg-red-500" },
];

type ModalMode = "add" | "edit";

interface ProjectFormData {
  name: string;
  client: string;
  rate: string;
  color: string;
  isBillable: boolean;
}

const defaultFormData: ProjectFormData = {
  name: "",
  client: "",
  rate: "",
  color: "emerald",
  isBillable: true,
};

export default function ProjectsPage() {
  const router = useRouter();
  const { settings } = useUserSettings();

  // Data state
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [clientsFetched, setClientsFetched] = useState(false);

  // Filter state
  const [showArchived, setShowArchived] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);

  // Archive warning dialog state
  const [archiveWarningOpen, setArchiveWarningOpen] = useState(false);
  const [projectToArchive, setProjectToArchive] = useState<ProjectWithStats | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  // Profile defaults from user settings
  const profileDefaults = {
    rate: settings?.default_hourly_rate ?? 75,
    currency: settings?.default_currency ?? "USD",
  };

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      const response = await projectsApi.listProjects({ includeArchived: true });
      setProjects(response.data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toastManager.add({ type: "error", title: "Failed to load projects" });
    }
  }, []);

  // Fetch clients for dropdown (lazy loaded when modal opens)
  const fetchClients = useCallback(async () => {
    if (clientsFetched) return;
    setIsLoadingClients(true);
    try {
      const response = await clientsApi.listClients({ includeArchived: false });
      setClients(response.data);
      setClientsFetched(true);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    } finally {
      setIsLoadingClients(false);
    }
  }, [clientsFetched]);

  // Initial data fetch (only projects, clients are lazy loaded)
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchProjects();
      setIsLoading(false);
    };
    loadData();
  }, [fetchProjects]);

  // Fetch clients when modal opens
  useEffect(() => {
    if (isModalOpen && !clientsFetched) {
      fetchClients();
    }
  }, [isModalOpen, clientsFetched, fetchClients]);

  const filteredProjects = projects.filter(
    (p) => showArchived || !p.is_archived
  );

  const getColorClass = (colorValue: string) => {
    return colorOptions.find((c) => c.value === colorValue)?.class || "bg-slate-500";
  };

  const formatRate = (project: ProjectWithStats) => {
    const rate = project.hourly_rate ?? profileDefaults.rate;
    const currency = project.client?.currency ?? profileDefaults.currency;
    const rateStr = `${formatCurrency(rate ?? 0, currency, profileDefaults.currency)}/hr`;
    return project.hourly_rate === null ? `${rateStr} (default)` : rateStr;
  };

  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditingId(null);
    setFormData(defaultFormData);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (project: ProjectWithStats) => {
    setModalMode("edit");
    setEditingId(project.id);
    setFormData({
      name: project.name,
      client: project.client_id || "",
      rate: project.hourly_rate?.toString() ?? "",
      color: project.color ?? "blue",
      isBillable: project.is_billable ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSaveProject = async () => {
    if (!formData.name.trim()) return;

    setIsSaving(true);
    try {
      const projectData: CreateProjectInput = {
        name: formData.name.trim(),
        client_id: formData.client || null,
        color: formData.color as CreateProjectInput["color"],
        hourly_rate: formData.rate ? parseFloat(formData.rate) : null,
        is_billable: formData.isBillable,
        is_default: false,
      };

      if (modalMode === "add") {
        await projectsApi.createProject(projectData);
        toastManager.add({ type: "success", title: "Project created" });
      } else if (editingId) {
        await projectsApi.updateProject(editingId, projectData);
        toastManager.add({ type: "success", title: "Project updated" });
      }

      await fetchProjects();
      setIsModalOpen(false);
      setFormData(defaultFormData);
    } catch (error) {
      console.error("Failed to save project:", error);
      toastManager.add({
        type: "error",
        title: modalMode === "add" ? "Failed to create project" : "Failed to update project",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewEntries = (projectId: string) => {
    router.push(`/dashboard/time-entries?project=${projectId}`);
  };

  const handleArchiveClick = (project: ProjectWithStats) => {
    // If unarchiving or no unbilled entries, proceed directly
    if (project.is_archived || project.unbilled_hours === 0) {
      handleArchive(project);
    } else {
      // Show warning dialog for projects with unbilled entries
      setProjectToArchive(project);
      setArchiveWarningOpen(true);
    }
  };

  const handleArchive = async (project: ProjectWithStats) => {
    setIsArchiving(true);
    try {
      await projectsApi.updateProject(project.id, {
        is_archived: !project.is_archived,
      });
      toastManager.add({
        type: "success",
        title: project.is_archived ? "Project unarchived" : "Project archived",
      });
      await fetchProjects();
      setArchiveWarningOpen(false);
      setProjectToArchive(null);
    } catch (error) {
      console.error("Failed to archive project:", error);
      toastManager.add({ type: "error", title: "Failed to update project" });
    } finally {
      setIsArchiving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Projects</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Spinner className="size-6 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Button
          onClick={handleOpenAddModal}
          className="bg-teal-500 hover:!bg-teal-600 border-teal-500"
        >
          <Plus className="mr-1 size-4" />
          New Project
        </Button>
      </div>

      {/* Projects List */}
      <Card>
        <CardContent className="divide-y p-0">
          {filteredProjects.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {showArchived
                ? "No projects found. Create your first project to get started."
                : "No active projects found. Create a new project or show archived projects."}
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div
                key={project.id}
                className={cn(
                  "flex items-start gap-4 p-4 hover:bg-accent/30",
                  project.is_archived && "opacity-60"
                )}
              >
                {/* Color dot */}
                <span
                  className={cn(
                    "mt-1.5 size-3 shrink-0 rounded-full",
                    getColorClass(project.color ?? "blue")
                  )}
                />

                {/* Project info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{project.name}</h3>
                    {project.is_archived && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        Archived
                      </span>
                    )}
                  </div>
                  {project.client && (
                    <p className="text-sm text-muted-foreground">
                      {project.client.name}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatRate(project)} •{" "}
                    {project.total_hours}h tracked •{" "}
                    {formatCurrency(project.total_amount, project.client?.currency ?? profileDefaults.currency, profileDefaults.currency)} total
                  </p>
                </div>

                {/* Actions Menu */}
                <Menu>
                  <MenuTrigger className="flex size-8 items-center justify-center rounded-md hover:bg-accent">
                    <MoreVertical className="size-4 text-muted-foreground" />
                  </MenuTrigger>
                  <MenuPopup align="end">
                    <MenuItem onClick={() => handleOpenEditModal(project)}>
                      <Pencil className="size-4" />
                      Edit
                    </MenuItem>
                    <MenuItem onClick={() => handleViewEntries(project.id)}>
                      <Clock className="size-4" />
                      View entries
                    </MenuItem>
                    <MenuSeparator />
                    <MenuItem onClick={() => handleArchiveClick(project)}>
                      <Archive className="size-4" />
                      {project.is_archived ? "Unarchive" : "Archive"}
                    </MenuItem>
                  </MenuPopup>
                </Menu>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Show Archived Toggle */}
      <div className="flex items-center gap-2">
        <Checkbox
          checked={showArchived}
          onCheckedChange={(checked) => setShowArchived(checked as boolean)}
        />
        <label className="text-sm text-muted-foreground">
          Show archived projects
        </label>
      </div>

      {/* Add/Edit Project Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>
              {modalMode === "add" ? "New Project" : "Edit Project"}
            </DialogTitle>
          </DialogHeader>
          <DialogPanel>
            <div className="space-y-4">
              <Field>
                <FieldLabel>Project Name *</FieldLabel>
                <Input
                  placeholder="Enter project name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </Field>

              <Field>
                <FieldLabel>Client</FieldLabel>
                <Select
                  value={formData.client}
                  onValueChange={(value) =>
                    setFormData({ ...formData, client: value || "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client (optional)">
                      {formData.client
                        ? clients.find((c) => c.id === formData.client)?.name
                        : "Select client (optional)"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    {isLoadingClients ? (
                      <div className="px-3 py-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <Spinner className="size-4" />
                        Loading clients...
                      </div>
                    ) : clients.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No clients found
                      </div>
                    ) : (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectPopup>
                </Select>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Hourly Rate</FieldLabel>
                  <Input
                    type="number"
                    placeholder={profileDefaults.rate?.toString() ?? "75"}
                    value={formData.rate}
                    onChange={(e) =>
                      setFormData({ ...formData, rate: e.target.value })
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel>Currency</FieldLabel>
                  <div className="h-9 px-3 flex items-center rounded-md border bg-muted/30 text-sm">
                    {(() => {
                      const selectedClient = clients.find(c => c.id === formData.client);
                      if (selectedClient) {
                        return (
                          <span>
                            {selectedClient.currency || profileDefaults.currency}
                            <span className="ml-1 text-muted-foreground">(from client)</span>
                          </span>
                        );
                      }
                      return (
                        <span>
                          {profileDefaults.currency}
                          <span className="ml-1 text-muted-foreground">(from settings)</span>
                        </span>
                      );
                    })()}
                  </div>
                </Field>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave rate empty to use profile default ({formatCurrency(profileDefaults.rate ?? 0, profileDefaults.currency, profileDefaults.currency)}/hr). Currency is inherited from client.
              </p>

              <Field>
                <FieldLabel>Color</FieldLabel>
                <div className="flex gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, color: color.value })
                      }
                      className={cn(
                        "size-7 rounded-full transition-all",
                        color.class,
                        formData.color === color.value
                          ? "ring-2 ring-offset-2 ring-foreground"
                          : "hover:scale-110"
                      )}
                      title={color.name}
                    />
                  ))}
                </div>
              </Field>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.isBillable}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isBillable: checked as boolean })
                  }
                />
                <label className="text-sm">Billable by default</label>
              </div>
            </div>
          </DialogPanel>
          <DialogFooter variant="bare">
            <DialogClose render={<Button variant="outline" />} disabled={isSaving}>
              Cancel
            </DialogClose>
            <Button
              onClick={handleSaveProject}
              className="bg-teal-500 hover:!bg-teal-600 border-teal-500"
              disabled={!formData.name || isSaving}
            >
              {isSaving ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  {modalMode === "add" ? "Creating..." : "Updating..."}
                </>
              ) : (
                modalMode === "add" ? "Create Project" : "Update Project"
              )}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      {/* Archive Warning Dialog */}
      <AlertDialog open={archiveWarningOpen} onOpenChange={setArchiveWarningOpen}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive project with unbilled entries?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{projectToArchive?.name}</strong> has{" "}
              <strong>{projectToArchive?.unbilled_hours}h</strong> of unbilled time entries worth{" "}
              <strong>
                {formatCurrency(
                  projectToArchive?.unbilled_amount ?? 0,
                  projectToArchive?.client?.currency ?? profileDefaults.currency,
                  profileDefaults.currency
                )}
              </strong>
              . These entries will remain unbilled after archiving.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter variant="bare">
            <AlertDialogClose
              render={<Button variant="outline" />}
              disabled={isArchiving}
              onClick={() => setProjectToArchive(null)}
            >
              Cancel
            </AlertDialogClose>
            <Button
              variant="destructive"
              onClick={() => projectToArchive && handleArchive(projectToArchive)}
              disabled={isArchiving}
            >
              {isArchiving ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Archiving...
                </>
              ) : (
                "Archive anyway"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  );
}
