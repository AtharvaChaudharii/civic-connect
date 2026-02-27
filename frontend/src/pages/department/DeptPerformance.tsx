import { useAuth } from "@/contexts/AuthContext";
import { tickets as ticketsApi, type ApiTicketStats } from "@/lib/api";
import {
  BarChart3, Clock, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Target, Users,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

const DeptPerformance = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ApiTicketStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ticketsApi.stats()
      .then((res) => setStats(res.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return <div className="civic-container civic-section flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const resRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
  const escRate = stats.total > 0 ? Math.round((stats.escalated / stats.total) * 100) : 0;

  const statCards = [
    { label: "Avg. Resolution Time", value: `${stats.avgResolutionDays} days`, icon: Clock, trend: "-", trendUp: false, color: "text-primary" },
    { label: "Resolution Rate", value: `${resRate}%`, icon: CheckCircle, trend: `${resRate}%`, trendUp: resRate > 50, color: "text-primary" },
    { label: "Escalation Rate", value: `${escRate}%`, icon: AlertTriangle, trend: `${escRate}%`, trendUp: false, color: "text-destructive" },
    { label: "Total Tickets", value: String(stats.total), icon: Target, trend: String(stats.total), trendUp: true, color: "text-primary" },
  ];

  const statusBreakdown = [
    { name: "Pending", value: stats.pending, color: "hsl(38 92% 50%)" },
    { name: "Ongoing", value: stats.ongoing, color: "hsl(210 80% 55%)" },
    { name: "Resolved", value: stats.resolved, color: "hsl(142 72% 29%)" },
    { name: "Escalated", value: stats.escalated, color: "hsl(0 72% 51%)" },
  ];

  return (
    <div className="civic-container civic-section">
      <div className="mb-8">
        <h1 className="text-h2 font-bold text-foreground">Performance Analytics</h1>
        <p className="text-body text-muted-foreground">{user?.department} · {user?.city}</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <s.icon className="h-5 w-5 text-accent-foreground" />
              </div>
            </div>
            <p className="text-h2 text-foreground">{s.value}</p>
            <p className="text-caption text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Status Breakdown */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-body font-semibold text-foreground">Status Breakdown</h3>
        <div className="space-y-4">
          {statusBreakdown.map((s) => {
            const pct = stats.total > 0 ? Math.round((s.value / stats.total) * 100) : 0;
            return (
              <div key={s.name}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-caption font-medium text-foreground">{s.name}</span>
                  <span className="text-caption text-muted-foreground">{s.value} ({pct}%)</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted">
                  <div className="h-2.5 rounded-full transition-all" style={{ width: `${pct}%`, background: s.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DeptPerformance;
