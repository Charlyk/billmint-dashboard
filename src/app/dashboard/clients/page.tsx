"use client";

import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data
const initialClients = [
  {
    id: "1",
    name: "ClientName Inc.",
    contactName: "John Smith",
    email: "john@clientname.com",
    address: "123 Business St\nNew York, NY 10001",
    projectCount: 3,
    totalInvoiced: 15200,
    outstanding: 2400,
    isArchived: false,
  },
  {
    id: "2",
    name: "StartupXYZ",
    contactName: "Jane Founder",
    email: "founder@startupxyz.com",
    address: "456 Startup Ave\nSan Francisco, CA 94102",
    projectCount: 1,
    totalInvoiced: 6000,
    outstanding: 0,
    isArchived: false,
  },
  {
    id: "3",
    name: "Freelance Client",
    contactName: "",
    email: "",
    address: "",
    projectCount: 2,
    totalInvoiced: 0,
    outstanding: 0,
    isArchived: false,
  },
  {
    id: "4",
    name: "Old Corp",
    contactName: "Bob Old",
    email: "bob@oldcorp.com",
    address: "789 Legacy Blvd\nChicago, IL 60601",
    projectCount: 1,
    totalInvoiced: 3500,
    outstanding: 0,
    isArchived: true,
  },
];

type ModalMode = "add" | "edit";

interface ClientFormData {
  name: string;
  contactName: string;
  email: string;
  address: string;
}

const defaultFormData: ClientFormData = {
  name: "",
  contactName: "",
  email: "",
  address: "",
};

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState(initialClients);
  const [showArchived, setShowArchived] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(defaultFormData);

  const filteredClients = clients.filter(
    (c) => showArchived || !c.isArchived
  );

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditingId(null);
    setFormData(defaultFormData);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (client: typeof initialClients[0]) => {
    setModalMode("edit");
    setEditingId(client.id);
    setFormData({
      name: client.name,
      contactName: client.contactName,
      email: client.email,
      address: client.address,
    });
    setIsModalOpen(true);
  };

  const handleSaveClient = () => {
    // TODO: Save client to API
    setIsModalOpen(false);
    setFormData(defaultFormData);
  };

  const handleViewProjects = (clientId: string) => {
    router.push(`/dashboard/projects?client=${clientId}`);
  };

  const handleViewInvoices = (clientId: string) => {
    router.push(`/dashboard/invoices?client=${clientId}`);
  };

  const handleArchive = (clientId: string) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId ? { ...c, isArchived: !c.isArchived } : c
      )
    );
  };

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
              No clients found. Add your first client to get started.
            </div>
          ) : (
            filteredClients.map((client) => (
              <div
                key={client.id}
                className={cn(
                  "flex items-start justify-between gap-4 p-4 hover:bg-accent/30",
                  client.isArchived && "opacity-60"
                )}
              >
                {/* Client info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{client.name}</h3>
                    {client.isArchived && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        Archived
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {client.email || "No email"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {client.projectCount} {client.projectCount === 1 ? "project" : "projects"} •{" "}
                    {formatCurrency(client.totalInvoiced)} invoiced •{" "}
                    {formatCurrency(client.outstanding)} outstanding
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
                    <MenuItem onClick={() => handleArchive(client.id)}>
                      <Archive className="size-4" />
                      {client.isArchived ? "Unarchive" : "Archive"}
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
        <DialogPopup>
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
            </div>
          </DialogPanel>
          <DialogFooter variant="bare">
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              onClick={handleSaveClient}
              className="bg-teal-500 hover:!bg-teal-600 border-teal-500"
              disabled={!formData.name}
            >
              {modalMode === "add" ? "Create Client" : "Update Client"}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
