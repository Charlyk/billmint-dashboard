"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
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
import { cn } from "@/lib/utils";

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

// Mock data
const initialProjects = [
  {
    id: "1",
    name: "Website Redesign",
    client: "ClientName Inc.",
    color: "emerald",
    rate: 80,
    currency: "EUR",
    isDefault: false,
    hoursTracked: 45,
    totalAmount: 3600,
    isBillable: true,
    isArchived: false,
  },
  {
    id: "2",
    name: "Mobile App MVP",
    client: "StartupXYZ",
    color: "blue",
    rate: 100,
    currency: "USD",
    isDefault: false,
    hoursTracked: 120,
    totalAmount: 12000,
    isBillable: true,
    isArchived: false,
  },
  {
    id: "3",
    name: "Maintenance Contract",
    client: "ClientName Inc.",
    color: "purple",
    rate: 75,
    currency: "USD",
    isDefault: true,
    hoursTracked: 20,
    totalAmount: 1500,
    isBillable: true,
    isArchived: false,
  },
  {
    id: "4",
    name: "Old Website",
    client: "Legacy Corp",
    color: "slate",
    rate: 60,
    currency: "USD",
    isDefault: false,
    hoursTracked: 100,
    totalAmount: 6000,
    isBillable: true,
    isArchived: true,
  },
];

// Profile defaults (mock)
const profileDefaults = {
  rate: 75,
  currency: "USD",
};

type ModalMode = "add" | "edit";

interface ProjectFormData {
  name: string;
  client: string;
  rate: string;
  currency: string;
  color: string;
  isBillable: boolean;
}

const defaultFormData: ProjectFormData = {
  name: "",
  client: "",
  rate: "",
  currency: "",
  color: "emerald",
  isBillable: true,
};

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [showArchived, setShowArchived] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>(defaultFormData);

  const filteredProjects = projects.filter(
    (p) => showArchived || !p.isArchived
  );

  const getColorClass = (colorValue: string) => {
    return colorOptions.find((c) => c.value === colorValue)?.class || "bg-slate-500";
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === "EUR" ? "€" : "$";
    return `${symbol}${amount.toLocaleString()}`;
  };

  const formatRate = (rate: number, currency: string, isDefault: boolean) => {
    const symbol = currency === "EUR" ? "€" : "$";
    const rateStr = `${symbol}${rate}/hr`;
    return isDefault ? `${rateStr} (default)` : rateStr;
  };

  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditingId(null);
    setFormData(defaultFormData);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (project: typeof initialProjects[0]) => {
    setModalMode("edit");
    setEditingId(project.id);
    setFormData({
      name: project.name,
      client: project.client,
      rate: project.isDefault ? "" : project.rate.toString(),
      currency: project.isDefault ? "" : project.currency,
      color: project.color,
      isBillable: project.isBillable,
    });
    setIsModalOpen(true);
  };

  const handleSaveProject = () => {
    // TODO: Save project to API
    setIsModalOpen(false);
    setFormData(defaultFormData);
  };

  const handleViewEntries = (projectId: string) => {
    router.push(`/dashboard/time-entries?project=${projectId}`);
  };

  const handleArchive = (projectId: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, isArchived: !p.isArchived } : p
      )
    );
  };

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
              No projects found. Create your first project to get started.
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div
                key={project.id}
                className={cn(
                  "flex items-start gap-4 p-4 hover:bg-accent/30",
                  project.isArchived && "opacity-60"
                )}
              >
                {/* Color dot */}
                <span
                  className={cn(
                    "mt-1.5 size-3 shrink-0 rounded-full",
                    getColorClass(project.color)
                  )}
                />

                {/* Project info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{project.name}</h3>
                    {project.isArchived && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        Archived
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {project.client}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatRate(project.rate, project.currency, project.isDefault)} •{" "}
                    {project.hoursTracked}h tracked •{" "}
                    {formatCurrency(project.totalAmount, project.currency)} total
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
                    <MenuItem onClick={() => handleArchive(project.id)}>
                      <Archive className="size-4" />
                      {project.isArchived ? "Unarchive" : "Archive"}
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
                    <SelectValue placeholder="Select client (optional)" />
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="ClientName Inc.">ClientName Inc.</SelectItem>
                    <SelectItem value="StartupXYZ">StartupXYZ</SelectItem>
                    <SelectItem value="Legacy Corp">Legacy Corp</SelectItem>
                  </SelectPopup>
                </Select>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Hourly Rate</FieldLabel>
                  <Input
                    type="number"
                    placeholder={profileDefaults.rate.toString()}
                    value={formData.rate}
                    onChange={(e) =>
                      setFormData({ ...formData, rate: e.target.value })
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel>Currency</FieldLabel>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) =>
                      setFormData({ ...formData, currency: value || "" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={profileDefaults.currency} />
                    </SelectTrigger>
                    <SelectPopup>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="AUD">AUD</SelectItem>
                    </SelectPopup>
                  </Select>
                </Field>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to use profile default (currently: ${profileDefaults.rate}/hr {profileDefaults.currency})
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
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              onClick={handleSaveProject}
              className="bg-teal-500 hover:!bg-teal-600 border-teal-500"
              disabled={!formData.name}
            >
              {modalMode === "add" ? "Create Project" : "Update Project"}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
