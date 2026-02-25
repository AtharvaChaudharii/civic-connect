import { useAuth } from "@/contexts/AuthContext";
import { mockIssues } from "@/data/mock-issues";
import {
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Calendar,
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { useState } from "react";

const DeptPerformance = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState("30");
  const issues = mockIssues.filter(
    (i) => i.city === user?.city && i.department === user?.department
  );
  const resolved = issues.filter((i) => i.status === "Resolved");
  const escalated = issues.filter((i) => i.status === "Escalated");
  const pending = issues.filter((i) => i.status === "Pending");
  const ongoing = issues.filter((i) => i.status === "Ongoing");
  const avgDays = resolved.length > 0 ? 3.2 : 0;

  const stats = [
    {
      label: "Avg. Resolution Time",
      value: `${avgDays} days`,
      icon: Clock,
      trend: "-0.5 days",
      trendUp: false,
      color: "text-primary",
    },
    {
      label: "Resolution Rate",
      value: issues.length > 0 ? `${Math.round((resolved.length / issues.length) * 100)}%` : "0%",
      icon: CheckCircle,
      trend: "+8%",
      trendUp: true,
      color: "text-primary",
    },
    {
      label: "Escalation Rate",
      value: issues.length > 0 ? `${Math.round((escalated.length / issues.length) * 100)}%` : "0%",
      icon: AlertTriangle,
      trend: "-3%",
      trendUp: false,
      color: "text-destructive",
    },
    {
      label: "SLA Compliance",
      value: "87%",
      icon: Target,
      trend: "+5%",
      trendUp: true,
      color: "text-primary",
    },
  ];

  // Chart data
  const weeklyData = [
    { name: "Week 1", reported: 12, resolved: 8 },
    { name: "Week 2", reported: 15, resolved: 11 },
    { name: "Week 3", reported: 9, resolved: 13 },
    { name: "Week 4", reported: 18, resolved: 14 },
  ];

  const categoryData = issues.reduce((acc, issue) => {
    const existing = acc.find((a) => a.name === issue.category);
    if (existing) existing.value++;
    else acc.push({ name: issue.category, value: 1 });
    return acc;
  }, [] as { name: string; value: number }[]);

  const pieColors = [
    "hsl(142 72% 29%)",
    "hsl(215 16% 47%)",
    "hsl(38 92% 50%)",
    "hsl(0 72% 51%)",
    "hsl(210 40% 60%)",
    "hsl(280 60% 50%)",
  ];

  const resolutionTrend = [
    { day: "Mon", time: 4.1 },
    { day: "Tue", time: 3.8 },
    { day: "Wed", time: 3.5 },
    { day: "Thu", time: 3.2 },
    { day: "Fri", time: 2.9 },
    { day: "Sat", time: 3.0 },
    { day: "Sun", time: 3.2 },
  ];

  const statusBreakdown = [
    { name: "Pending", value: pending.length, color: "hsl(38 92% 50%)" },
    { name: "Ongoing", value: ongoing.length, color: "hsl(210 80% 55%)" },
    { name: "Resolved", value: resolved.length, color: "hsl(142 72% 29%)" },
    { name: "Escalated", value: escalated.length, color: "hsl(0 72% 51%)" },
  ];

  return (
    <div className="civic-container civic-section">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h2 font-bold text-foreground">Performance Analytics</h1>
          <p className="text-body text-muted-foreground">
            {user?.department} · {user?.city}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-10 w-40 gap-2">
              <Calendar className="h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-10 gap-2">
            <FileDown className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <s.icon className="h-5 w-5 text-accent-foreground" />
              </div>
              <span className={`flex items-center gap-1 text-label font-medium ${s.trendUp ? "text-primary" : s.color}`}>
                {s.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {s.trend}
              </span>
            </div>
            <p className="text-h2 text-foreground">{s.value}</p>
            <p className="text-caption text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* Issues Reported vs Resolved */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-body font-semibold text-foreground">Issues Reported vs Resolved</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="reported" name="Reported" fill="hsl(215 16% 47%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" name="Resolved" fill="hsl(142 72% 29%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-body font-semibold text-foreground">Issue Categories</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={240}>
              <PieChart>
                <Pie
                  data={categoryData.length > 0 ? categoryData : [{ name: "No Data", value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(categoryData.length > 0 ? categoryData : [{ name: "No Data", value: 1 }]).map((_, idx) => (
                    <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {categoryData.map((c, idx) => (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ background: pieColors[idx % pieColors.length] }} />
                    <span className="text-caption text-foreground">{c.name}</span>
                  </div>
                  <span className="text-caption font-medium text-foreground">{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resolution Time Trend */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-body font-semibold text-foreground">Resolution Time Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={resolutionTrend}>
              <defs>
                <linearGradient id="resTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142 72% 29%)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(142 72% 29%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit=" d" />
              <Tooltip />
              <Area type="monotone" dataKey="time" name="Avg Days" stroke="hsl(142 72% 29%)" fill="url(#resTrend)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Breakdown */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-body font-semibold text-foreground">Status Breakdown</h3>
          <div className="space-y-4">
            {statusBreakdown.map((s) => {
              const pct = issues.length > 0 ? Math.round((s.value / issues.length) * 100) : 0;
              return (
                <div key={s.name}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-caption font-medium text-foreground">{s.name}</span>
                    <span className="text-caption text-muted-foreground">{s.value} ({pct}%)</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted">
                    <div
                      className="h-2.5 rounded-full transition-all"
                      style={{ width: `${pct}%`, background: s.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Team stats */}
          <div className="mt-6 grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-caption text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> Team Size
              </div>
              <p className="text-h3 text-foreground">12</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-caption text-muted-foreground">
                <BarChart3 className="h-3.5 w-3.5" /> Per Member
              </div>
              <p className="text-h3 text-foreground">{issues.length > 0 ? (issues.length / 12).toFixed(1) : 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeptPerformance;
