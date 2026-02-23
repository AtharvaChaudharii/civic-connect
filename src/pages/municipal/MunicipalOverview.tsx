import { useAuth } from "@/contexts/AuthContext";
import { mockIssues } from "@/data/mock-issues";
import StatCard from "@/components/StatCard";
import { Link } from "react-router-dom";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building2,
  TrendingUp,
} from "lucide-react";

const MunicipalOverview = () => {
  const { user } = useAuth();
  const cityIssues = mockIssues.filter((i) => i.city === user?.city);

  const stats = [
    { label: "Total Issues", value: cityIssues.length, icon: FileText },
    { label: "Resolved", value: cityIssues.filter((i) => i.status === "Resolved").length, icon: CheckCircle },
    { label: "Pending", value: cityIssues.filter((i) => i.status === "Pending").length, icon: Clock },
    { label: "Escalated", value: cityIssues.filter((i) => i.status === "Escalated").length, icon: AlertTriangle },
  ];

  // Department breakdown
  const departments = [...new Set(cityIssues.map((i) => i.department))];
  const deptBreakdown = departments.map((dept) => {
    const deptIssues = cityIssues.filter((i) => i.department === dept);
    return {
      name: dept,
      total: deptIssues.length,
      resolved: deptIssues.filter((i) => i.status === "Resolved").length,
      pending: deptIssues.filter((i) => i.status === "Pending").length,
      escalated: deptIssues.filter((i) => i.status === "Escalated").length,
    };
  });

  const resolutionRate = cityIssues.length > 0
    ? Math.round((cityIssues.filter((i) => i.status === "Resolved").length / cityIssues.length) * 100)
    : 0;

  return (
    <div className="civic-container civic-section">
      <h1 className="mb-2 text-h2 text-foreground">City Overview</h1>
      <p className="mb-8 text-body text-muted-foreground">
        Municipal Corporation · {user?.city}
      </p>

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Resolution rate card */}
      <div className="mb-10 rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-h3 text-foreground">Resolution Rate</h2>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-display text-primary">{resolutionRate}%</span>
          <span className="mb-2 text-body text-muted-foreground">of all reported issues</span>
        </div>
      </div>

      {/* Department breakdown */}
      <h2 className="mb-4 flex items-center gap-2 text-h3 text-foreground">
        <Building2 className="h-5 w-5" />
        Department Breakdown
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {deptBreakdown.map((dept) => (
          <div key={dept.name} className="rounded-xl border bg-card p-5 shadow-sm civic-card-hover">
            <h3 className="mb-3 text-body font-semibold text-foreground">{dept.name}</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-h3 text-foreground">{dept.total}</p>
                <p className="text-label text-muted-foreground">Total</p>
              </div>
              <div>
                <p className="text-h3 text-success">{dept.resolved}</p>
                <p className="text-label text-muted-foreground">Resolved</p>
              </div>
              <div>
                <p className="text-h3 text-warning">{dept.pending}</p>
                <p className="text-label text-muted-foreground">Pending</p>
              </div>
              <div>
                <p className="text-h3 text-destructive">{dept.escalated}</p>
                <p className="text-label text-muted-foreground">Escalated</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MunicipalOverview;
