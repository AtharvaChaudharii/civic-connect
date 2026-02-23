import { useAuth } from "@/contexts/AuthContext";
import { mockIssues } from "@/data/mock-issues";
import StatCard from "@/components/StatCard";
import { BarChart3, Clock, AlertTriangle, CheckCircle } from "lucide-react";

const DeptPerformance = () => {
  const { user } = useAuth();
  const issues = mockIssues.filter(
    (i) => i.city === user?.city && i.department === user?.department
  );
  const resolved = issues.filter((i) => i.status === "Resolved");
  const escalated = issues.filter((i) => i.status === "Escalated");
  const avgDays = resolved.length > 0 ? 3.2 : 0; // mock avg

  const stats = [
    { label: "Avg. Resolution Time", value: `${avgDays} days`, icon: Clock },
    { label: "Escalation Rate", value: issues.length > 0 ? `${Math.round((escalated.length / issues.length) * 100)}%` : "0%", icon: AlertTriangle },
    { label: "Resolution Rate", value: issues.length > 0 ? `${Math.round((resolved.length / issues.length) * 100)}%` : "0%", icon: CheckCircle },
    { label: "Open Issues", value: issues.filter((i) => i.status !== "Resolved").length, icon: BarChart3 },
  ];

  return (
    <div className="civic-container civic-section">
      <h1 className="mb-2 text-h2 text-foreground">Performance Overview</h1>
      <p className="mb-8 text-body text-muted-foreground">
        {user?.department} · {user?.city}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="mt-10 rounded-xl border bg-card p-8 text-center">
        <BarChart3 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-body text-muted-foreground">
          Detailed analytics charts will be available when connected to a live backend.
        </p>
      </div>
    </div>
  );
};

export default DeptPerformance;
