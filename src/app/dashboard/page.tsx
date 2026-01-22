import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

// Mock data - will be replaced with real data from API
const stats = {
  today: {
    time: "2h 34m",
    amount: "$187.50",
  },
  thisWeek: {
    time: "24h 15m",
    amount: "$1,890.00",
  },
  unbilled: {
    amount: "$2,450.00",
    hours: "32.5 hours",
  },
};

const recentEntries = [
  {
    date: "Today",
    entries: [
      {
        id: "1",
        description: "API integration work",
        project: "ProjectX",
        projectColor: "bg-emerald-500",
        duration: "2h 15m",
        amount: "$168.75",
      },
      {
        id: "2",
        description: "Bug fixes",
        project: "ProjectX",
        projectColor: "bg-emerald-500",
        duration: "1h 30m",
        amount: "$112.50",
      },
    ],
  },
  {
    date: "Yesterday",
    entries: [
      {
        id: "3",
        description: "Client meeting",
        project: "ClientY",
        projectColor: "bg-blue-500",
        duration: "0h 45m",
        amount: "$56.25",
      },
      {
        id: "4",
        description: "Design review",
        project: "ProjectX",
        projectColor: "bg-emerald-500",
        duration: "2h 00m",
        amount: "$150.00",
      },
    ],
  },
];

function StatCard({
  title,
  primary,
  secondary,
}: {
  title: string;
  primary: string;
  secondary: string;
}) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-semibold">{primary}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{secondary}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Today"
          primary={stats.today.time}
          secondary={stats.today.amount}
        />
        <StatCard
          title="This Week"
          primary={stats.thisWeek.time}
          secondary={stats.thisWeek.amount}
        />
        <StatCard
          title="Unbilled"
          primary={stats.unbilled.amount}
          secondary={stats.unbilled.hours}
        />
      </div>

      {/* Recent Entries */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Entries</h2>
          <Link
            href="/dashboard/time-entries"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            View all
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <Card className="mt-4">
          <CardContent className="p-0">
            {recentEntries.map((group, groupIndex) => (
              <div key={group.date}>
                {groupIndex > 0 && <div className="border-t" />}
                <div className="px-4 py-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    {group.date}
                  </p>
                </div>
                <div className="space-y-1 px-4 pb-4">
                  {group.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 rounded-lg py-2 hover:bg-accent/50"
                    >
                      <span
                        className={`size-2.5 rounded-full ${entry.projectColor}`}
                      />
                      <span className="flex-1 truncate text-sm">
                        {entry.description}
                      </span>
                      <span className="hidden text-sm text-muted-foreground sm:block">
                        {entry.project}
                      </span>
                      <span className="w-16 text-right text-sm tabular-nums">
                        {entry.duration}
                      </span>
                      <span className="w-20 text-right text-sm font-medium tabular-nums">
                        {entry.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
