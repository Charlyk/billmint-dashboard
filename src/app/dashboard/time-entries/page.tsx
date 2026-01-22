"use client";

import { useState } from "react";
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
  DialogTrigger,
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
  DollarSign,
  Minus,
  Pencil,
  Copy,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data
const timeEntries = [
  {
    date: "Mon, Jan 20",
    totalTime: "6h 30m",
    entries: [
      {
        id: "1",
        description: "API integration",
        project: "ProjectX",
        projectColor: "bg-emerald-500",
        duration: "2h 15m",
        amount: "$168.75",
        isBillable: true,
      },
      {
        id: "2",
        description: "Bug fixes",
        project: "ProjectX",
        projectColor: "bg-emerald-500",
        duration: "1h 30m",
        amount: "$112.50",
        isBillable: true,
      },
      {
        id: "3",
        description: "Client call",
        project: "ClientY",
        projectColor: "bg-blue-500",
        duration: "0h 45m",
        amount: null,
        isBillable: false,
      },
      {
        id: "4",
        description: "Code review",
        project: "ProjectX",
        projectColor: "bg-emerald-500",
        duration: "2h 00m",
        amount: "$150.00",
        isBillable: true,
      },
    ],
  },
  {
    date: "Sun, Jan 19",
    totalTime: "4h 00m",
    entries: [
      {
        id: "5",
        description: "Planning session",
        project: "ProjectZ",
        projectColor: "bg-purple-500",
        duration: "2h 00m",
        amount: "$150.00",
        isBillable: true,
      },
      {
        id: "6",
        description: "Documentation",
        project: "ProjectZ",
        projectColor: "bg-purple-500",
        duration: "2h 00m",
        amount: "$150.00",
        isBillable: true,
      },
    ],
  },
];

const summary = {
  count: 24,
  totalTime: "32h 15m",
  totalBillable: "$2,418.75",
};

type EntryModalMode = "add" | "edit";

interface EntryFormData {
  description: string;
  project: string;
  date: string;
  duration: string;
  isBillable: boolean;
}

const defaultFormData: EntryFormData = {
  description: "",
  project: "",
  date: new Date().toISOString().split("T")[0],
  duration: "",
  isBillable: true,
};

export default function TimeEntriesPage() {
  const [dateRange, setDateRange] = useState("this-week");
  const [projectFilter, setProjectFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<EntryModalMode>("add");
  const [formData, setFormData] = useState<EntryFormData>(defaultFormData);
  const [entries, setEntries] = useState(timeEntries);

  const handleOpenAddModal = () => {
    setModalMode("add");
    setFormData(defaultFormData);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (entry: typeof timeEntries[0]["entries"][0]) => {
    setModalMode("edit");
    setFormData({
      description: entry.description,
      project: entry.project,
      date: new Date().toISOString().split("T")[0],
      duration: entry.duration,
      isBillable: entry.isBillable,
    });
    setIsModalOpen(true);
  };

  const handleSaveEntry = () => {
    // TODO: Save entry to API
    setIsModalOpen(false);
    setFormData(defaultFormData);
  };

  const handleToggleBillable = (groupIndex: number, entryIndex: number) => {
    setEntries((prev) => {
      const newEntries = [...prev];
      const entry = newEntries[groupIndex].entries[entryIndex];
      entry.isBillable = !entry.isBillable;
      if (!entry.isBillable) {
        entry.amount = null;
      }
      return newEntries;
    });
  };

  const handleDuplicate = (entry: typeof timeEntries[0]["entries"][0]) => {
    // TODO: Duplicate entry
    console.log("Duplicate:", entry);
  };

  const handleDelete = (entryId: string) => {
    // TODO: Delete entry
    console.log("Delete:", entryId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Time Entries</h1>
        <Button
          onClick={handleOpenAddModal}
          className="bg-teal-500 hover:!bg-teal-600 border-teal-500"
        >
          <Plus className="mr-1 size-4" />
          Add Entry
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          <span className="text-sm text-muted-foreground">Filters:</span>
          <Select value={dateRange} onValueChange={(value) => setDateRange(value || "this-week")}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="last-week">Last Week</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
            </SelectPopup>
          </Select>

          <Select value={projectFilter} onValueChange={(value) => setProjectFilter(value || "all")}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="projectx">ProjectX</SelectItem>
              <SelectItem value="projectz">ProjectZ</SelectItem>
              <SelectItem value="clienty">ClientY</SelectItem>
            </SelectPopup>
          </Select>

          <Select value={clientFilter} onValueChange={(value) => setClientFilter(value || "all")}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="all">All Clients</SelectItem>
              <SelectItem value="client1">ClientName Inc.</SelectItem>
              <SelectItem value="client2">StartupXYZ</SelectItem>
            </SelectPopup>
          </Select>
        </CardContent>
      </Card>

      {/* Entries List */}
      <Card>
        <CardContent className="p-0">
          {entries.map((group, groupIndex) => (
            <div key={group.date}>
              {groupIndex > 0 && <div className="border-t" />}
              {/* Date Header */}
              <div className="flex items-center justify-between bg-muted/30 px-4 py-3">
                <span className="font-medium">{group.date}</span>
                <span className="text-sm text-muted-foreground">
                  Total: {group.totalTime}
                </span>
              </div>

              {/* Entries */}
              <div className="divide-y">
                {group.entries.map((entry, entryIndex) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-accent/30"
                  >
                    {/* Color dot */}
                    <span
                      className={`size-2.5 rounded-full ${entry.projectColor}`}
                    />

                    {/* Description */}
                    <span className="flex-1 truncate text-sm">
                      {entry.description}
                    </span>

                    {/* Billable toggle */}
                    <button
                      onClick={() => handleToggleBillable(groupIndex, entryIndex)}
                      className={cn(
                        "flex size-6 items-center justify-center rounded",
                        entry.isBillable
                          ? "bg-teal-500/10 text-teal-600"
                          : "bg-muted text-muted-foreground"
                      )}
                      title={entry.isBillable ? "Billable" : "Non-billable"}
                    >
                      {entry.isBillable ? (
                        <DollarSign className="size-3.5" />
                      ) : (
                        <Minus className="size-3.5" />
                      )}
                    </button>

                    {/* Project */}
                    <span className="hidden w-24 truncate text-sm text-muted-foreground sm:block">
                      {entry.project}
                    </span>

                    {/* Duration */}
                    <span className="w-16 text-right text-sm tabular-nums">
                      {entry.duration}
                    </span>

                    {/* Amount */}
                    <span className="w-20 text-right text-sm font-medium tabular-nums">
                      {entry.amount ?? "–"}
                    </span>

                    {/* Actions Menu */}
                    <Menu>
                      <MenuTrigger
                        className="flex size-8 items-center justify-center rounded-md hover:bg-accent"
                      >
                        <MoreVertical className="size-4 text-muted-foreground" />
                      </MenuTrigger>
                      <MenuPopup align="end">
                        <MenuItem onClick={() => handleOpenEditModal(entry)}>
                          <Pencil className="size-4" />
                          Edit
                        </MenuItem>
                        <MenuItem onClick={() => handleDuplicate(entry)}>
                          <Copy className="size-4" />
                          Duplicate
                        </MenuItem>
                        <MenuSeparator />
                        <MenuItem
                          variant="destructive"
                          onClick={() => handleDelete(entry.id)}
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </MenuItem>
                      </MenuPopup>
                    </Menu>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Summary Footer */}
      <div className="text-center text-sm text-muted-foreground">
        Showing {summary.count} entries • {summary.totalTime} total •{" "}
        {summary.totalBillable} billable
      </div>

      {/* Add/Edit Entry Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>
              {modalMode === "add" ? "Add Time Entry" : "Edit Time Entry"}
            </DialogTitle>
          </DialogHeader>
          <DialogPanel>
            <div className="space-y-4">
              <Field>
                <FieldLabel>Description</FieldLabel>
                <Input
                  placeholder="What did you work on?"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </Field>

              <Field>
                <FieldLabel>Project</FieldLabel>
                <Select
                  value={formData.project}
                  onValueChange={(value) =>
                    setFormData({ ...formData, project: value || "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project (optional)" />
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="projectx">ProjectX</SelectItem>
                    <SelectItem value="projectz">ProjectZ</SelectItem>
                    <SelectItem value="clienty">ClientY</SelectItem>
                  </SelectPopup>
                </Select>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Date</FieldLabel>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel>Duration</FieldLabel>
                  <Input
                    placeholder="2h 30m"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                  />
                </Field>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.isBillable}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isBillable: checked as boolean })
                  }
                />
                <label className="text-sm">Billable</label>
              </div>
            </div>
          </DialogPanel>
          <DialogFooter variant="bare">
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              onClick={handleSaveEntry}
              className="bg-teal-500 hover:!bg-teal-600 border-teal-500"
            >
              {modalMode === "add" ? "Save Entry" : "Update Entry"}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
