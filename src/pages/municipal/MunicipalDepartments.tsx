import { useAuth } from "@/contexts/AuthContext";
import { mockIssues } from "@/data/mock-issues";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Users,
  TrendingUp,
  TrendingDown,
  Target,
  FileDown,
  Mail,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Legend,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MunicipalDepartments = () => {
  const { user } = useAuth();
  const cityIssues = mockIssues.filter((i) => i.city === user?.city);
  const departments = [...new Set(cityIssues.map((i) => i.department))];

  return (
    <div className="civic-container civic-section">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h2 font-bold text-foreground">Department Performance</h1>
          <p className="text-body text-muted-foreground">
            Compare department metrics across {user?.city}
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <FileDown className="h-4 w-4" /> Export Report
        </Button>
      </div>

      {/* Comparison overview */}
      <div className="mb-8 rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-body font-semibold text-foreground">Department Comparison</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={departments.map((dept) => {
              const di = cityIssues.filter((i) => i.department === dept);
              return {
                name: dept.length > 10 ? dept.slice(0, 10) + "…" : dept,
                total: di.length,
                resolved: di.filter((i) => i.status === "Resolved").length,
                escalated: di.filter((i) => i.status === "Escalated").length,
              };
            })}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" name="Total" fill="hsl(215 16% 47%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="resolved" name="Resolved" fill="hsl(142 72% 29%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="escalated" name="Escalated" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <Tabs defaultValue={departments[0] || "none"}>
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          {departments.map((d) => (
            <TabsTrigger key={d} value={d} className="text-caption">
              {d}
            </TabsTrigger>
          ))}
        </TabsList>

        {departments.map((dept) => {
          const deptIssues = cityIssues.filter((i) => i.department === dept);
          const resolved = deptIssues.filter((i) => i.status === "Resolved");
          const escalated = deptIssues.filter((i) => i.status === "Escalated");
          const pending = deptIssues.filter((i) => i.status === "Pending");
          const ongoing = deptIssues.filter((i) => i.status === "Ongoing");
          const resRate = deptIssues.length > 0 ? Math.round((resolved.length / deptIssues.length) * 100) : 0;
          const escRate = deptIssues.length > 0 ? Math.round((escalated.length / deptIssues.length) * 100) : 0;

          const stats = [
            { label: "Total Issues", value: deptIssues.length, icon: BarChart3, trend: "+5" },
            { label: "Resolution Rate", value: `${resRate}%`, icon: CheckCircle, trend: "+8%" },
            { label: "Avg. Resolution", value: "3.2 days", icon: Clock, trend: "-0.3d" },
            { label: "Escalation Rate", value: `${escRate}%`, icon: AlertTriangle, trend: escRate > 10 ? "⚠ High" : "Normal" },
          ];

          const weeklyMock = [
            { week: "W1", resolved: 3, new: 5 },
            { week: "W2", resolved: 4, new: 3 },
            { week: "W3", resolved: 5, new: 6 },
            { week: "W4", resolved: 6, new: 4 },
          ];

          const recentIssues = deptIssues.slice(0, 5);

          return (
            <TabsContent key={dept} value={dept} className="space-y-6">
              {/* Stats */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                        <s.icon className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <span className="text-label font-medium text-primary">{s.trend}</span>
                    </div>
                    <p className="text-h2 text-foreground">{s.value}</p>
                    <p className="text-caption text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Weekly activity chart */}
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                  <h4 className="mb-4 text-body font-semibold text-foreground">Weekly Activity</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={weeklyMock}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
                      <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="new" name="New" fill="hsl(215 16% 47%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="resolved" name="Resolved" fill="hsl(142 72% 29%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Status breakdown */}
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                  <h4 className="mb-4 text-body font-semibold text-foreground">Current Status</h4>
                  <div className="space-y-4">
                    {[
                      { name: "Pending", count: pending.length, color: "hsl(38 92% 50%)" },
                      { name: "Ongoing", count: ongoing.length, color: "hsl(210 80% 55%)" },
                      { name: "Resolved", count: resolved.length, color: "hsl(142 72% 29%)" },
                      { name: "Escalated", count: escalated.length, color: "hsl(0 72% 51%)" },
                    ].map((s) => {
                      const pct = deptIssues.length > 0 ? Math.round((s.count / deptIssues.length) * 100) : 0;
                      return (
                        <div key={s.name}>
                          <div className="mb-1 flex justify-between">
                            <span className="text-caption text-foreground">{s.name}</span>
                            <span className="text-caption text-muted-foreground">{s.count} ({pct}%)</span>
                          </div>
                          <div className="h-2.5 rounded-full bg-muted">
                            <div className="h-2.5 rounded-full" style={{ width: `${pct}%`, background: s.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1">
                      <Mail className="h-3.5 w-3.5" /> Contact Dept.
                    </Button>
                    <Button size="sm" className="flex-1 gap-1">
                      <Target className="h-3.5 w-3.5" /> Set SLA Target
                    </Button>
                  </div>
                </div>
              </div>

              {/* Recent issues table */}
              <div className="rounded-xl border bg-card shadow-sm">
                <div className="border-b p-5">
                  <h4 className="text-body font-semibold text-foreground">Recent Issues</h4>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-label uppercase">Issue</TableHead>
                      <TableHead className="text-label uppercase">Location</TableHead>
                      <TableHead className="text-label uppercase">Status</TableHead>
                      <TableHead className="text-label uppercase">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentIssues.map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell>
                          <p className="text-caption font-medium text-foreground">{issue.title}</p>
                          <p className="text-label text-muted-foreground">#{issue.id}</p>
                        </TableCell>
                        <TableCell className="text-caption text-muted-foreground">{issue.location}</TableCell>
                        <TableCell>
                          <span className={`rounded-full px-2.5 py-0.5 text-label font-medium ${
                            issue.status === "Resolved" ? "bg-accent text-primary" :
                            issue.status === "Escalated" ? "bg-destructive/10 text-destructive" :
                            issue.status === "Ongoing" ? "bg-blue-50 text-blue-700" :
                            "bg-amber-50 text-amber-800"
                          }`}>
                            {issue.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-caption text-muted-foreground">
                          {new Date(issue.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default MunicipalDepartments;
