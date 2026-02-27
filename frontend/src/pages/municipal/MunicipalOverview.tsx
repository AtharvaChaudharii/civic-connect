import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { municipal as municipalApi, issues as issuesApi, type ApiDeptStat, type ApiOverviewStats, type ApiIssue } from "@/lib/api";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import IssueMap from "@/components/IssueMap";
import { Link } from "react-router-dom";
import {
  FileText, CheckCircle, Clock, AlertTriangle, FileDown, Plus,
  TrendingUp, TrendingDown, Timer, Loader2,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

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
      issuesApi.list({ cityId: user.cityId, limit: "50" }),
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
    return <div className="civic-container civic-section flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const escalatedDepts = departments.filter((d) => d.escalated > 0);
  // Convert to IssueMap format
  const mapIssues = cityIssues.map((i) => ({
    ...i,
    title: i.title,
    location: i.location,
    status: i.status,
    lat: i.lat,
    lng: i.lng,
  }));

  const deptIcons: Record<string, string> = {
    Sanitation: "🗑️", "Roads & Infrastructure": "🏗️", "Water Supply": "💧", Electrical: "💡", Drainage: "🌊",
  };

  return (
    <div className="civic-container civic-section">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h2 font-bold text-foreground">City Overview: {cityName} Municipal Corporation</h1>
          <p className="text-caption text-muted-foreground">Last updated: Just now</p>
        </div>
        <div className="flex gap-2">
          <Link to="/municipal/reports"><Button variant="outline" className="gap-2"><FileDown className="h-4 w-4" /> Export CSV</Button></Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Issues", value: overview.total, icon: FileText, trend: "Live data" },
          { label: "Resolved", value: overview.resolved, icon: CheckCircle, trend: `${overview.total > 0 ? Math.round((overview.resolved / overview.total) * 100) : 0}% rate` },
          { label: "Pending Review", value: overview.pending, icon: Clock, trend: `${overview.pending} waiting` },
          { label: "Escalated", value: overview.escalated, icon: AlertTriangle, trend: escalatedDepts.length > 0 ? `${escalatedDepts.length} dept(s)` : "None" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent"><s.icon className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-caption text-muted-foreground">{s.label}</p>
                <p className="text-h2 text-foreground">{s.value.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-label text-primary flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {s.trend}</p>
          </div>
        ))}
      </div>

      {/* Department Performance Table */}
      <div className="mb-8 rounded-xl border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-body-lg font-semibold text-foreground">Department Performance</h3>
          <Link to="/municipal/departments" className="text-caption font-medium text-primary hover:underline">View All</Link>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-label uppercase tracking-wider">Department</TableHead>
              <TableHead className="text-label uppercase tracking-wider">Total</TableHead>
              <TableHead className="text-label uppercase tracking-wider">Resolved</TableHead>
              <TableHead className="text-label uppercase tracking-wider">Escalated</TableHead>
              <TableHead className="text-label uppercase tracking-wider">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((dept) => {
              const escRate = dept.total > 0 ? Math.round((dept.escalated / dept.total) * 100) : 0;
              const status = escRate > 10 ? "Warning" : "Healthy";
              return (
                <TableRow key={dept.departmentId}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-body-lg">{deptIcons[dept.department] || "📋"}</span>
                      <span className="text-caption font-medium text-foreground">{dept.department}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-caption text-foreground">{dept.total}</TableCell>
                  <TableCell className="text-caption text-foreground">{dept.resolved}</TableCell>
                  <TableCell className={`text-caption font-medium ${dept.escalated > 0 ? "text-destructive" : "text-foreground"}`}>{dept.escalated}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2.5 py-0.5 text-label font-medium ${status === "Healthy" ? "bg-accent text-primary" : "bg-amber-50 text-amber-800"}`}>{status}</span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Ward Heatmap */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="mb-3 text-body font-semibold text-foreground">Issue Locations — Ward Map</h3>
        <IssueMap issues={mapIssues as any} height="h-72" />
      </div>
    </div>
  );
};

export default MunicipalOverview;
