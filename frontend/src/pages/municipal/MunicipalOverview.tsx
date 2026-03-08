import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  municipal as municipalApi,
  issues as issuesApi,
  type ApiDeptStat,
  type ApiOverviewStats,
  type ApiIssue,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import IssueMap from "@/components/IssueMap";
import { Link } from "react-router-dom";
import {
  FileText, CheckCircle, Clock, AlertTriangle, FileDown,
  TrendingUp, Loader2, Activity, BarChart3, MapPin,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

/** Department → color mapping for map markers & charts */
const DEPT_COLORS: Record<string, string> = {
  Sanitation: "#f59e0b",
  "Roads & Infrastructure": "#ef4444",
  "Water Supply": "#3b82f6",
  Electrical: "#a855f7",
  Drainage: "#06b6d4",
  General: "#6b7280",
};
const DEPT_COLOR_LIST = Object.values(DEPT_COLORS);

const STATUS_COLORS: Record<string, string> = {
  Pending: "#f59e0b",
  Ongoing: "#3b82f6",
  Resolved: "#16a34a",
  Escalated: "#ef4444",
};

const CATEGORY_TO_DEPT: Record<string, string> = {
  Garbage: "Sanitation",
  Pothole: "Roads & Infrastructure",
  WaterOverflow: "Water Supply",
  StreetLight: "Electrical",
  Drainage: "Drainage",
  Footpath: "Roads & Infrastructure",
  Other: "General",
};

const deptIcons: Record<string, string> = {
  Sanitation: "🗑️",
  "Roads & Infrastructure": "🏗️",
  "Water Supply": "💧",
  Electrical: "💡",
  Drainage: "🌊",
};

const MunicipalOverview = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<ApiOverviewStats | null>(null);
  const [departments, setDepartments] = useState<ApiDeptStat[]>([]);
  const [cityName, setCityName] = useState("");
  const [cityIssues, setCityIssues] = useState<ApiIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      municipalApi.overview(),
      issuesApi.list({ cityId: user.cityId, limit: "200" }),
    ])
      .then(([ovRes, issRes]) => {
        setOverview(ovRes.overview);
        setDepartments(ovRes.departments);
        setCityName(ovRes.city);
        setCityIssues(issRes.issues);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading || !overview) {
    return (
      <div className="civic-container civic-section flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const resolutionRate = overview.total > 0 ? Math.round((overview.resolved / overview.total) * 100) : 0;

  // Map issues with department color
  const mapIssues = cityIssues.map((i) => ({
    ...i,
    title: i.title,
    location: i.location,
    status: i.status,
    lat: i.lat,
    lng: i.lng,
  }));

  const colorByDept = (issue: { category?: string }) => {
    const dept = CATEGORY_TO_DEPT[issue.category || "Other"] || "General";
    return DEPT_COLORS[dept] || "#6b7280";
  };

  // Chart data
  const statusData = [
    { name: "Pending", value: overview.pending, color: STATUS_COLORS.Pending },
    { name: "Ongoing", value: overview.ongoing, color: STATUS_COLORS.Ongoing },
    { name: "Resolved", value: overview.resolved, color: STATUS_COLORS.Resolved },
    { name: "Escalated", value: overview.escalated, color: STATUS_COLORS.Escalated },
  ].filter((d) => d.value > 0);

  const deptChartData = departments.map((d) => ({
    name: d.department.length > 12 ? d.department.slice(0, 12) + "…" : d.department,
    fullName: d.department,
    total: d.total,
    resolved: d.resolved,
    escalated: d.escalated,
    fill: DEPT_COLORS[d.department] || "#6b7280",
  }));

  const statCards = [
    { label: "Total Issues", value: overview.total, icon: FileText, sub: "Live data", color: "text-primary" },
    { label: "Resolved", value: overview.resolved, icon: CheckCircle, sub: `${resolutionRate}% rate`, color: "text-success" },
    { label: "Pending Review", value: overview.pending, icon: Clock, sub: `${overview.pending} waiting`, color: "text-warning" },
    { label: "Escalated", value: overview.escalated, icon: AlertTriangle, sub: `${departments.filter((d) => d.escalated > 0).length} dept(s)`, color: "text-destructive" },
  ];

  return (
    <div className="civic-container civic-section space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            City Overview: {cityName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time city-wide issue monitoring & analytics
          </p>
        </div>
        <Link to="/municipal/reports">
          <Button variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" /> Export CSV
          </Button>
        </Link>
      </div>

      {/* === MAP — Full width at top === */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">City Issue Map</h3>
            <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              {cityIssues.length} issues
            </span>
          </div>
          {/* Legend */}
          <div className="hidden flex-wrap gap-3 md:flex">
            {Object.entries(DEPT_COLORS).map(([dept, color]) => (
              <div key={dept} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: color }}
                />
                <span className="text-xs text-muted-foreground">{dept}</span>
              </div>
            ))}
          </div>
        </div>
        <IssueMap
          issues={mapIssues as any}
          height="h-80"
          colorFn={colorByDept as any}
        />
      </div>

      {/* === Stat Cards === */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="group rounded-xl border bg-card p-5 transition-all hover:shadow-md"
          >
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent transition-transform group-hover:scale-110">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold text-foreground">{s.value.toLocaleString()}</p>
              </div>
            </div>
            <p className="flex items-center gap-1 text-xs font-medium text-primary">
              <TrendingUp className="h-3 w-3" /> {s.sub}
            </p>
          </div>
        ))}
      </div>

      {/* === Charts Row === */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Distribution Donut */}
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Status Distribution</h3>
          </div>
          <div className="flex items-center justify-center gap-8">
            <div className="h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v, "Issues"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {statusData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-sm"
                    style={{ background: d.color }}
                  />
                  <span className="text-xs text-muted-foreground">{d.name}</span>
                  <span className="ml-auto text-sm font-semibold text-foreground">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Resolution gauge */}
          <div className="mt-4 rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Overall Resolution Rate</p>
            <p className="text-3xl font-bold text-primary">{resolutionRate}%</p>
            <div className="mx-auto mt-1.5 h-2 w-full max-w-[200px] overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${resolutionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Department Bar Chart */}
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Department Breakdown</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 11, fill: "hsl(215 16% 47%)" }}
                />
                <Tooltip
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.fullName || ""
                  }
                />
                <Bar dataKey="resolved" name="Resolved" stackId="a" fill="hsl(142 71% 45%)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="escalated" name="Escalated" stackId="a" fill="hsl(0 72% 51%)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="total" name="Total" fill="hsl(142 72% 29%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* === Department Performance Table === */}
      <div className="rounded-xl border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Department Performance</h3>
          <Link
            to="/municipal/departments"
            className="text-xs font-medium text-primary hover:underline"
          >
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wider">Department</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Total</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Resolved</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Pending</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Escalated</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Resolution</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => {
                const rate = dept.total > 0 ? Math.round((dept.resolved / dept.total) * 100) : 0;
                const escRate = dept.total > 0 ? Math.round((dept.escalated / dept.total) * 100) : 0;
                const healthy = escRate <= 10;
                const deptColor = DEPT_COLORS[dept.department] || "#6b7280";
                return (
                  <TableRow key={dept.departmentId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ background: deptColor }}
                        />
                        <span className="text-xs">{deptIcons[dept.department] || "📋"}</span>
                        <span className="text-sm font-medium text-foreground">{dept.department}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-foreground font-medium">{dept.total}</TableCell>
                    <TableCell className="text-sm text-foreground">{dept.resolved}</TableCell>
                    <TableCell className="text-sm text-foreground">{dept.pending}</TableCell>
                    <TableCell className={`text-sm font-medium ${dept.escalated > 0 ? "text-destructive" : "text-foreground"}`}>
                      {dept.escalated}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{rate}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          healthy
                            ? "bg-accent text-accent-foreground"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {healthy ? "Healthy" : "Warning"}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default MunicipalOverview;
