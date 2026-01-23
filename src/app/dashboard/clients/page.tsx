"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
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
  FolderOpen,
  FileText,
  Archive,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clientsApi, projectsApi } from "@/lib/api";
import { useUserSettings } from "@/contexts/user-settings-context";
import { toastManager } from "@/components/ui/toast";
import type { ClientWithStats, ProjectWithStats } from "@/types";

// Currency to locale mapping for proper symbol placement
const currencyLocales: Record<string, string> = {
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  CAD: "en-CA",
  AUD: "en-AU",
  CHF: "de-CH",
  JPY: "ja-JP",
  INR: "en-IN",
  BRL: "pt-BR",
  MXN: "es-MX",
  PLN: "pl-PL",
  RON: "ro-RO",
  SEK: "sv-SE",
  NOK: "nb-NO",
  DKK: "da-DK",
  NZD: "en-NZ",
  SGD: "en-SG",
  HKD: "zh-HK",
  ZAR: "en-ZA",
  AED: "ar-AE",
};

type ModalMode = "add" | "edit";

interface ClientFormData {
  name: string;
  contactName: string;
  email: string;
  address: string;
  projectIds: string[];
}

const defaultFormData: ClientFormData = {
  name: "",
  contactName: "",
  email: "",
  address: "",
  projectIds: [],
};

export default function ClientsPage() {
  const router = useRouter();
  const { settings } = useUserSettings();
  const defaultCurrency = settings?.default_currency ?? "USD";

  // Data state
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [showArchived, setShowArchived] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch clients
  const fetchClients = useCallback(async () => {
    try {
      const response = await clientsApi.listClients({ includeArchived: true });
      setClients(response.data);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      toastManager.add({ type: "error", title: "Failed to load clients" });
    }
  }, []);

  // Fetch all projects (for assignment dropdown)
  const fetchProjects = useCallback(async () => {
    try {
      const response = await projectsApi.listProjects({ includeArchived: false, limit: 100 });
      setProjects(response.data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchClients(), fetchProjects()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchClients, fetchProjects]);

  const filteredClients = clients.filter(
    (c) => showArchived || !c.is_archived
  );

  const formatCurrency = (amount: number, currency: string = defaultCurrency) => {
    const locale = currencyLocales[currency] || "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);
  };

  // Format multi-currency amounts
  const formatAmounts = (amounts: { currency: string; amount: number }[]) => {
    if (amounts.length === 0) return formatCurrency(0);
    return amounts.map(a => formatCurrency(a.amount, a.currency)).join(", ");
  };

  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditingId(null);
    setFormData(defaultFormData);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (client: ClientWithStats) => {
    setModalMode("edit");
    setEditingId(client.id);
    // Get projects currently assigned to this client
    const clientProjectIds = projects
      .filter(p => p.client_id === client.id)
      .map(p => p.id);
    setFormData({
      name: client.name,
      contactName: client.contact_name || "",
      email: client.email || "",
      address: client.address || "",
      projectIds: clientProjectIds,
    });
    setIsModalOpen(true);
  };

  const handleSaveClient = async () => {
    if (!formData.name.trim()) return;

    setIsSaving(true);
    try {
      const clientData = {
        name: formData.name.trim(),
        contact_name: formData.contactName || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
      };

      let clientId: string;

      if (modalMode === "add") {
        const newClient = await clientsApi.createClient(clientData);
        clientId = newClient.id;
        toastManager.add({ type: "success", title: "Client created" });
      } else if (editingId) {
        await clientsApi.updateClient(editingId, clientData);
        clientId = editingId;
        toastManager.add({ type: "success", title: "Client updated" });
      } else {
        return;
      }

      // Update project assignments
      // Find projects that need to be assigned to this client
      const projectsToAssign = formData.projectIds;
      // Find projects that were previously assigned but now need to be unassigned
      const previouslyAssigned = projects
        .filter(p => p.client_id === clientId)
        .map(p => p.id);
      const projectsToUnassign = previouslyAssigned.filter(
        id => !projectsToAssign.includes(id)
      );

      // Assign new projects to client
      await Promise.all([
        ...projectsToAssign.map(projectId =>
          projectsApi.updateProject(projectId, { client_id: clientId })
        ),
        ...projectsToUnassign.map(projectId =>
          projectsApi.updateProject(projectId, { client_id: null })
        ),
      ]);

      await Promise.all([fetchClients(), fetchProjects()]);
      setIsModalOpen(false);
      setFormData(defaultFormData);
    } catch (error) {
      console.error("Failed to save client:", error);
      toastManager.add({
        type: "error",
        title: modalMode === "add" ? "Failed to create client" : "Failed to update client",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewProjects = (clientId: string) => {
    router.push(`/dashboard/projects?client=${clientId}`);
  };

  const handleViewInvoices = (clientId: string) => {
    router.push(`/dashboard/invoices?client=${clientId}`);
  };

  const handleArchive = async (client: ClientWithStats) => {
    try {
      await clientsApi.updateClient(client.id, {
        is_archived: !client.is_archived,
      });
      toastManager.add({
        type: "success",
        title: client.is_archived ? "Client unarchived" : "Client archived",
      });
      await fetchClients();
    } catch (error) {
      console.error("Failed to archive client:", error);
      toastManager.add({ type: "error", title: "Failed to update client" });
    }
  };

  const toggleProjectSelection = (projectId: string) => {
    setFormData(prev => ({
      ...prev,
      projectIds: prev.projectIds.includes(projectId)
        ? prev.projectIds.filter(id => id !== projectId)
        : [...prev.projectIds, projectId],
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Clients</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <Button
          onClick={handleOpenAddModal}
          className="bg-teal-500 hover:!bg-teal-600 border-teal-500"
        >
          <Plus className="mr-1 size-4" />
          New Client
        </Button>
      </div>

      {/* Clients List */}
      <Card>
        <CardContent className="divide-y p-0">
          {filteredClients.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {showArchived
                ? "No clients found. Add your first client to get started."
                : "No active clients found. Create a new client or show archived clients."}
            </div>
          ) : (
            filteredClients.map((client) => (
              <div
                key={client.id}
                className={cn(
                  "flex items-start justify-between gap-4 p-4 hover:bg-accent/30",
                  client.is_archived && "opacity-60"
                )}
              >
                {/* Client info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{client.name}</h3>
                    {client.is_archived && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        Archived
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {client.email || "No email"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {client.project_count} {client.project_count === 1 ? "project" : "projects"}
                    {client.total_invoiced.length > 0 && (
                      <> • {formatAmounts(client.total_invoiced)} invoiced</>
                    )}
                    {client.unbilled_amount.length > 0 && (
                      <> • {formatAmounts(client.unbilled_amount)} unbilled</>
                    )}
                    {client.outstanding_amount.length > 0 && (
                      <> • {formatAmounts(client.outstanding_amount)} outstanding</>
                    )}
                  </p>
                </div>

                {/* Actions Menu */}
                <Menu>
                  <MenuTrigger className="flex size-8 items-center justify-center rounded-md hover:bg-accent">
                    <MoreVertical className="size-4 text-muted-foreground" />
                  </MenuTrigger>
                  <MenuPopup align="end">
                    <MenuItem onClick={() => handleOpenEditModal(client)}>
                      <Pencil className="size-4" />
                      Edit
                    </MenuItem>
                    <MenuItem onClick={() => handleViewProjects(client.id)}>
                      <FolderOpen className="size-4" />
                      View projects
                    </MenuItem>
                    <MenuItem onClick={() => handleViewInvoices(client.id)}>
                      <FileText className="size-4" />
                      View invoices
                    </MenuItem>
                    <MenuSeparator />
                    <MenuItem onClick={() => handleArchive(client)}>
                      <Archive className="size-4" />
                      {client.is_archived ? "Unarchive" : "Archive"}
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
          Show archived clients
        </label>
      </div>

      {/* Add/Edit Client Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogPopup className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {modalMode === "add" ? "New Client" : "Edit Client"}
            </DialogTitle>
          </DialogHeader>
          <DialogPanel>
            <div className="space-y-4">
              <Field>
                <FieldLabel>Client/Company Name *</FieldLabel>
                <Input
                  placeholder="Enter client or company name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </Field>

              <Field>
                <FieldLabel>Contact Name</FieldLabel>
                <Input
                  placeholder="Primary contact person"
                  value={formData.contactName}
                  onChange={(e) =>
                    setFormData({ ...formData, contactName: e.target.value })
                  }
                />
              </Field>

              <Field>
                <FieldLabel>Contact Email</FieldLabel>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </Field>

              <Field>
                <FieldLabel>Address (for invoices)</FieldLabel>
                <Textarea
                  placeholder="Street address&#10;City, State ZIP&#10;Country"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows={3}
                />
              </Field>

              <Field>
                <FieldLabel>Projects</FieldLabel>
                <div className="space-y-2">
                  {/* Selected projects */}
                  {formData.projectIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.projectIds.map((projectId) => {
                        const project = projects.find((p) => p.id === projectId);
                        if (!project) return null;
                        return (
                          <span
                            key={projectId}
                            className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2.5 py-1 text-sm text-teal-600"
                          >
                            {project.name}
                            <button
                              type="button"
                              onClick={() => toggleProjectSelection(projectId)}
                              className="hover:text-teal-800"
                            >
                              <X className="size-3.5" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Available projects to add */}
                  {(() => {
                    const availableProjects = projects.filter(
                      (p) => !formData.projectIds.includes(p.id) &&
                             (p.client_id === null || p.client_id === editingId)
                    );
                    if (availableProjects.length === 0 && formData.projectIds.length === 0) {
                      return (
                        <p className="text-sm text-muted-foreground">
                          No projects available. Create projects first.
                        </p>
                      );
                    }
                    if (availableProjects.length === 0) {
                      return null;
                    }
                    return (
                      <div className="rounded-lg border bg-muted/30 p-2">
                        <p className="mb-2 text-xs text-muted-foreground">
                          Click to assign projects:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {availableProjects.map((project) => (
                            <button
                              key={project.id}
                              type="button"
                              onClick={() => toggleProjectSelection(project.id)}
                              className="rounded-full border bg-background px-2.5 py-1 text-sm hover:border-teal-500 hover:bg-teal-500/5"
                            >
                              {project.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Assign existing projects to this client
                </p>
              </Field>
            </div>
          </DialogPanel>
          <DialogFooter variant="bare">
            <DialogClose render={<Button variant="outline" />} disabled={isSaving}>
              Cancel
            </DialogClose>
            <Button
              onClick={handleSaveClient}
              className="bg-teal-500 hover:!bg-teal-600 border-teal-500"
              disabled={!formData.name || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {modalMode === "add" ? "Creating..." : "Updating..."}
                </>
              ) : (
                modalMode === "add" ? "Create Client" : "Update Client"
              )}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
