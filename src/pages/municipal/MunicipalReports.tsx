import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { mockIssues } from "@/data/mock-issues";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileDown,
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  CheckCircle,
  Clock,
  AlertTriangle,
  Printer,
  Filter,
} from "lucide-react";
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
  Legend,
} from "recharts";

const MunicipalReports = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState("30");
  const [reportType, setReportType] = useState("overview");
  const cityIssues = mockIssues.filter((i) => i.city === user?.city);

  const summary = {
    total: cityIssues.length,
    pending: cityIssues.filter((i) => i.status === "Pending").length,
    ongoing: cityIssues.filter((i) => i.status === "Ongoing").length,
    resolved: cityIssues.filter((i) => i.status === "Resolved").length,
    escalated: cityIssues.filter((i) => i.status === "Escalated").length,
  };

  const departments = [...new Set(cityIssues.map((i) => i.department))];

  const deptTableData = departments.map((dept) => {
    const di = cityIssues.filter((i) => i.department === dept);
    const res = di.filter((i) => i.status === "Resolved").length;
    const esc = di.filter((i) => i.status === "Escalated").length;
    return {
      name: dept,
      total: di.length,
      resolved: res,
      escalated: esc,
      pending: di.filter((i) => i.status === "Pending").length,
      rate: di.length > 0 ? Math.round((res / di.length) * 100) : 0,
      avgDays: (Math.random() * 4 + 1.5).toFixed(1),
    };
  });

  const deptChartData = deptTableData.map((d) => ({
    name: d.name.length > 12 ? d.name.slice(0, 12) + "…" : d.name,
    resolved: d.resolved,
    pending: d.pending,
    escalated: d.escalated,
  }));

  const statusPieData = [
    { name: "Pending", value: summary.pending, color: "hsl(38 92% 50%)" },
    { name: "Ongoing", value: summary.ongoing, color: "hsl(210 80% 55%)" },
    { name: "Resolved", value: summary.resolved, color: "hsl(142 72% 29%)" },
    { name: "Escalated", value: summary.escalated, color: "hsl(0 72% 51%)" },
  ];

  const monthlyTrend = [
    { month: "Jan", issues: 45, resolved: 30 },
    { month: "Feb", issues: 52, resolved: 38 },
    { month: "Mar", issues: 48, resolved: 42 },
    { month: "Apr", issues: 61, resolved: 45 },
    { month: "May", issues: 55, resolved: 50 },
    { month: "Jun", issues: 58, resolved: 52 },
  ];

  const handleExportCSV = () => {
    const headers = ["ID", "Title", "Category", "Location", "Department", "Status", "Reporters", "Created"];
    const rows = cityIssues.map((i) => [
      i.id, i.title, i.category, i.location, i.department, i.status, String(i.reporters),
      new Date(i.createdAt).toLocaleDateString("en-IN"),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `civictrack_${user?.city?.toLowerCase()}_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statCards = [
    { label: "Total Reported", value: summary.total, icon: FileText, trend: "+12%", up: true },
    { label: "Resolved", value: summary.resolved, icon: CheckCircle, trend: "+8%", up: true },
    { label: "Pending", value: summary.pending, icon: Clock, trend: "-3%", up: false },
    { label: "Escalated", value: summary.escalated, icon: AlertTriangle, trend: "+2", up: true, alert: true },
  ];

  return (
    <div className="civic-container civic-section">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h2 font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-body text-muted-foreground">{user?.city} · City-restricted data</p>
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
              <SelectItem value="90">Last Quarter</SelectItem>
              <SelectItem value="365">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-10 gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button onClick={handleExportCSV} className="h-10 gap-2">
            <FileDown className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <s.icon className="h-5 w-5 text-accent-foreground" />
              </div>
              <span className={`flex items-center gap-1 text-label font-medium ${s.alert ? "text-destructive" : s.up ? "text-primary" : "text-primary"}`}>
                {s.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {s.trend}
              </span>
            </div>
            <p className="text-h2 text-foreground">{s.value}</p>
            <p className="text-caption text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="mb-8 grid gap-6 lg:grid-cols-5">
        {/* Monthly trend */}
        <div className="lg:col-span-3 rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-body font-semibold text-foreground">Monthly Reporting Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="issues" name="Reported" fill="hsl(215 16% 47%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" name="Resolved" fill="hsl(142 72% 29%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status distribution pie */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-body font-semibold text-foreground">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusPieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {statusPieData.map((s, idx) => (
                  <Cell key={idx} fill={s.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {statusPieData.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                <span className="text-label text-muted-foreground">{s.name}: {s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department by department chart */}
      <div className="mb-8 rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-body font-semibold text-foreground">Department-wise Breakdown</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={deptChartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="resolved" name="Resolved" stackId="a" fill="hsl(142 72% 29%)" />
            <Bar dataKey="pending" name="Pending" stackId="a" fill="hsl(38 92% 50%)" />
            <Bar dataKey="escalated" name="Escalated" stackId="a" fill="hsl(0 72% 51%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Department table */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b p-5">
          <h3 className="text-body-lg font-semibold text-foreground">Department Performance Table</h3>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-label uppercase tracking-wider">Department</TableHead>
              <TableHead className="text-label uppercase tracking-wider">Total</TableHead>
              <TableHead className="text-label uppercase tracking-wider">Resolved</TableHead>
              <TableHead className="text-label uppercase tracking-wider">Pending</TableHead>
              <TableHead className="text-label uppercase tracking-wider">Escalated</TableHead>
              <TableHead className="text-label uppercase tracking-wider">Resolution Rate</TableHead>
              <TableHead className="text-label uppercase tracking-wider">Avg. Days</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deptTableData.map((dept) => (
              <TableRow key={dept.name}>
                <TableCell className="text-caption font-medium text-foreground">{dept.name}</TableCell>
                <TableCell className="text-caption text-foreground">{dept.total}</TableCell>
                <TableCell className="text-caption text-primary font-medium">{dept.resolved}</TableCell>
                <TableCell className="text-caption text-foreground">{dept.pending}</TableCell>
                <TableCell>
                  <span className={`text-caption font-medium ${dept.escalated > 0 ? "text-destructive" : "text-foreground"}`}>
                    {dept.escalated}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-16 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${dept.rate}%` }} />
                    </div>
                    <span className="text-caption font-medium text-foreground">{dept.rate}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-caption text-foreground">{dept.avgDays}d</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MunicipalReports;
