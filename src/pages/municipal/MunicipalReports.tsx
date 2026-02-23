import { useAuth } from "@/contexts/AuthContext";
import { mockIssues } from "@/data/mock-issues";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

const MunicipalReports = () => {
  const { user } = useAuth();
  const cityIssues = mockIssues.filter((i) => i.city === user?.city);

  const summary = {
    total: cityIssues.length,
    pending: cityIssues.filter((i) => i.status === "Pending").length,
    ongoing: cityIssues.filter((i) => i.status === "Ongoing").length,
    resolved: cityIssues.filter((i) => i.status === "Resolved").length,
    escalated: cityIssues.filter((i) => i.status === "Escalated").length,
  };

  const departments = [...new Set(cityIssues.map((i) => i.department))];

  const handleExportCSV = () => {
    const headers = ["ID", "Title", "Category", "Location", "Department", "Status", "Reporters", "Created"];
    const rows = cityIssues.map((i) => [
      i.id,
      i.title,
      i.category,
      i.location,
      i.department,
      i.status,
      String(i.reporters),
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

  return (
    <div className="civic-container civic-section">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h2 text-foreground">Reports & Exports</h1>
          <p className="text-body text-muted-foreground">{user?.city} · City-restricted data</p>
        </div>
        <Button onClick={handleExportCSV} className="gap-2">
          <FileDown className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary table */}
      <div className="mb-10 rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-h3 text-foreground">Issue Summary</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {Object.entries(summary).map(([key, val]) => (
            <div key={key} className="text-center">
              <p className="text-h2 text-foreground">{val}</p>
              <p className="text-label capitalize text-muted-foreground">{key}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Department breakdown */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-h3 text-foreground">Department Breakdown</h2>
        <div className="space-y-3">
          {departments.map((dept) => {
            const deptIssues = cityIssues.filter((i) => i.department === dept);
            const resolved = deptIssues.filter((i) => i.status === "Resolved").length;
            const pct = deptIssues.length > 0 ? Math.round((resolved / deptIssues.length) * 100) : 0;
            return (
              <div key={dept} className="flex items-center gap-4 rounded-lg border p-4">
                <div className="flex-1">
                  <p className="text-body font-medium text-foreground">{dept}</p>
                  <p className="text-caption text-muted-foreground">
                    {deptIssues.length} issues · {resolved} resolved
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-h3 text-primary">{pct}%</p>
                  <p className="text-label text-muted-foreground">resolved</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MunicipalReports;
