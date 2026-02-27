import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { municipal as municipalApi, type ApiExportReport, type ApiDeptPerf } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown, FileText, Calendar, TrendingUp, CheckCircle, Clock, AlertTriangle, Loader2, Filter } from "lucide-react";

const MunicipalReports = () => {
  const { user } = useAuth();
  const [report, setReport] = useState<ApiExportReport | null>(null);
  const [departments, setDepartments] = useState<ApiDeptPerf[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      municipalApi.exportReport(),
      municipalApi.departments(),
    ])
      .then(([rptRes, deptRes]) => { setReport(rptRes); setDepartments(deptRes.departments); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleExportCSV = () => {
    // Trigger server-side CSV export
    const token = localStorage.getItem("civictrack_token");
    fetch("/api/municipal/reports/export?format=csv", {
      headers: { Authorization: `Bearer ${token || ""}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `civictrack_${user?.city?.toLowerCase()}_report.csv`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(console.error);
  };

  if (loading || !report) {
    return <div className="civic-container civic-section flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const statCards = [
    { label: "Total Reported", value: report.report.total, icon: FileText },
    { label: "Resolved", value: report.report.resolved, icon: CheckCircle },
    { label: "Pending", value: report.report.pending, icon: Clock },
    { label: "Escalated", value: report.report.escalated, icon: AlertTriangle },
  ];

  return (
    <div className="civic-container civic-section">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h2 font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-body text-muted-foreground">{report.city} · City data</p>
        </div>
        <Button onClick={handleExportCSV} className="h-10 gap-2"><FileDown className="h-4 w-4" /> Export CSV</Button>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent"><s.icon className="h-5 w-5 text-accent-foreground" /></div>
            </div>
            <p className="text-h2 text-foreground">{s.value}</p>
            <p className="text-caption text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Department Table */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b p-5">
          <h3 className="text-body-lg font-semibold text-foreground">Department Performance Table</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-label uppercase tracking-wider">Department</TableHead>
              <TableHead className="text-label uppercase tracking-wider">Total</TableHead>
              <TableHead className="text-label uppercase tracking-wider">Resolved</TableHead>
              <TableHead className="text-label uppercase tracking-wider">Escalated</TableHead>
              <TableHead className="text-label uppercase tracking-wider">Resolution Rate</TableHead>
              <TableHead className="text-label uppercase tracking-wider">Avg. Days</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((dept) => (
              <TableRow key={dept.departmentId}>
                <TableCell className="text-caption font-medium text-foreground">{dept.department}</TableCell>
                <TableCell className="text-caption text-foreground">{dept.total}</TableCell>
                <TableCell className="text-caption text-primary font-medium">{dept.resolved}</TableCell>
                <TableCell>
                  <span className={`text-caption font-medium ${dept.escalated > 0 ? "text-destructive" : "text-foreground"}`}>{dept.escalated}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-16 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${dept.resolutionRate}%` }} /></div>
                    <span className="text-caption font-medium text-foreground">{dept.resolutionRate}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-caption text-foreground">{dept.avgResolutionDays}d</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="mt-4 text-center text-label text-muted-foreground">Generated: {new Date(report.generatedAt).toLocaleString("en-IN")}</p>
    </div>
  );
};

export default MunicipalReports;
