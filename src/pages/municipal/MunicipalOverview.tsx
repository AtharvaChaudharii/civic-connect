import { useAuth } from "@/contexts/AuthContext";
import { mockIssues } from "@/data/mock-issues";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { Link } from "react-router-dom";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileDown,
  Plus,
  TrendingUp,
  TrendingDown,
  Timer,
  MapPin,
  Eye,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

const chartData = [
  { name: "Mon", newIssues: 65, resolved: 45 },
  { name: "Tue", newIssues: 59, resolved: 48 },
  { name: "Wed", newIssues: 80, resolved: 55 },
  { name: "Thu", newIssues: 81, resolved: 60 },
  { name: "Fri", newIssues: 56, resolved: 52 },
  { name: "Sat", newIssues: 55, resolved: 58 },
  { name: "Sun", newIssues: 40, resolved: 42 },
];

const MunicipalOverview = () => {
  const { user } = useAuth();
  const cityIssues = mockIssues.filter((i) => i.city === user?.city);

  const resolved = cityIssues.filter((i) => i.status === "Resolved").length;
  const pending = cityIssues.filter((i) => i.status === "Pending").length;
  const escalated = cityIssues.filter((i) => i.status === "Escalated");

  const departments = [...new Set(cityIssues.map((i) => i.department))];
  const deptData = departments.map((dept) => {
    const di = cityIssues.filter((i) => i.department === dept);
    const res = di.filter((i) => i.status === "Resolved").length;
    const esc = di.filter((i) => i.status === "Escalated").length;
    const escRate = di.length > 0 ? ((esc / di.length) * 100).toFixed(1) : "0";
    return {
      name: dept,
      active: di.filter((i) => i.status !== "Resolved").length,
      avgResolution: (Math.random() * 5 + 1).toFixed(1),
      escalationRate: escRate,
      status: parseFloat(escRate) > 10 ? "Warning" : "Healthy",
    };
  });

  const deptIcons: Record<string, string> = {
    "Water Supply": "💧",
    "Roads & Infrastructure": "🏗️",
    Sanitation: "🗑️",
    Electrical: "💡",
    Drainage: "🌊",
  };

  return (
    <div className="civic-container civic-section">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h2 font-bold text-foreground">
            City Overview: Pune Municipal Corporation
          </h1>
          <p className="text-caption text-muted-foreground">Last updated: Just now</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" /> Export CSV
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Create Broadcast
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-caption text-muted-foreground">Total Issues</p>
              <p className="text-h2 text-foreground">{cityIssues.length.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-label text-primary flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> 12% from last month
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-caption text-muted-foreground">Resolved</p>
              <p className="text-h2 text-foreground">{resolved.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-label text-primary flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> 5% resolution rate
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-caption text-muted-foreground">Pending Review</p>
              <p className="text-h2 text-foreground">{pending.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-label text-primary flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> 2% backlog increase
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <Timer className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-caption text-muted-foreground">Avg. Resolution Time</p>
              <p className="text-h2 text-foreground">4.2 Days</p>
            </div>
          </div>
          <p className="text-label text-primary flex items-center gap-1">
            <TrendingDown className="h-3 w-3" /> 0.5 Days faster than avg
          </p>
        </div>
      </div>

      {/* Chart + Escalations */}
      <div className="mb-8 grid gap-6 lg:grid-cols-5">
        {/* Chart */}
        <div className="lg:col-span-3 rounded-xl border bg-card p-5">
          <h3 className="mb-4 text-body font-semibold text-foreground">Issues Reported vs. Resolved</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142 72% 29%)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(142 72% 29%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="newIssues" name="New Issues" stroke="hsl(142 72% 29%)" fill="url(#colorNew)" strokeWidth={2} />
              <Line type="monotone" dataKey="resolved" name="Resolved" stroke="hsl(215 16% 47%)" strokeDasharray="5 5" strokeWidth={2} dot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Escalations */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-body font-semibold text-foreground">Recent Escalations</h3>
            <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-label font-medium text-destructive">Action Needed</span>
          </div>
          <p className="mb-4 text-caption text-muted-foreground">
            Issues unresolved for 7+ days require manual assignment.
          </p>

          <div className="space-y-3">
            {escalated.length > 0 ? escalated.slice(0, 3).map((issue) => (
              <div key={issue.id} className="rounded-lg border border-l-4 border-l-destructive bg-destructive/5 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
                  <div className="flex-1">
                    <p className="text-caption font-medium text-foreground">{issue.title}</p>
                    <p className="text-label text-muted-foreground">
                      {issue.department} • <span className="text-destructive">12 days overdue</span>
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button variant="outline" size="sm" className="h-7 text-label">View</Button>
                      <Button size="sm" className="h-7 text-label">Assign</Button>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-caption text-muted-foreground">No escalated issues.</p>
            )}
          </div>

          <Link to="/municipal/escalations">
            <Button variant="outline" className="mt-4 w-full">View All Escalations</Button>
          </Link>
        </div>
      </div>

      {/* Department Performance */}
      <div className="mb-8 rounded-xl border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-body-lg font-semibold text-foreground">Department Performance</h3>
          <Link to="/municipal/departments" className="text-caption font-medium text-primary hover:underline">View All</Link>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-label uppercase tracking-wider">Department</TableHead>
              <TableHead className="text-label uppercase tracking-wider">Active Issues</TableHead>
              <TableHead className="text-label uppercase tracking-wider">Avg Resolution</TableHead>
              <TableHead className="text-label uppercase tracking-wider">Escalation Rate</TableHead>
              <TableHead className="text-label uppercase tracking-wider">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deptData.map((dept) => (
              <TableRow key={dept.name}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-body-lg">{deptIcons[dept.name] || "📋"}</span>
                    <span className="text-caption font-medium text-foreground">{dept.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-caption text-foreground">{dept.active}</TableCell>
                <TableCell className="text-caption text-foreground">{dept.avgResolution} Days</TableCell>
                <TableCell className={`text-caption font-medium ${parseFloat(dept.escalationRate) > 10 ? "text-destructive" : "text-foreground"}`}>
                  {dept.escalationRate}%
                </TableCell>
                <TableCell>
                  <span className={`rounded-full px-2.5 py-0.5 text-label font-medium ${dept.status === "Healthy" ? "bg-accent text-primary" : "bg-amber-50 text-amber-800"}`}>
                    {dept.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Ward Heatmap placeholder */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="mb-3 text-body font-semibold text-foreground">Ward Heatmap Overview</h3>
        <div className="flex h-48 items-center justify-center rounded-lg bg-muted">
          <div className="text-center text-caption text-muted-foreground">
            <MapPin className="mx-auto mb-2 h-8 w-8" />
            Interactive Map Preview
          </div>
        </div>
        <p className="mt-3 text-caption text-muted-foreground">
          Most Active Ward: <span className="font-semibold text-foreground">Kothrud (124 issues)</span>
        </p>
      </div>
    </div>
  );
};

export default MunicipalOverview;
