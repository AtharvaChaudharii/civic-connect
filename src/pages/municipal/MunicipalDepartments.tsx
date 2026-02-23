import { useAuth } from "@/contexts/AuthContext";
import { mockIssues } from "@/data/mock-issues";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatCard from "@/components/StatCard";
import { Clock, AlertTriangle, CheckCircle, BarChart3 } from "lucide-react";

const MunicipalDepartments = () => {
  const { user } = useAuth();
  const cityIssues = mockIssues.filter((i) => i.city === user?.city);
  const departments = [...new Set(cityIssues.map((i) => i.department))];

  return (
    <div className="civic-container civic-section">
      <h1 className="mb-2 text-h2 text-foreground">Department Performance</h1>
      <p className="mb-8 text-body text-muted-foreground">
        Compare department metrics across {user?.city}
      </p>

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

          const stats = [
            { label: "Avg. Resolution Time", value: resolved.length > 0 ? "3.2 days" : "N/A", icon: Clock },
            { label: "Escalation Rate", value: deptIssues.length > 0 ? `${Math.round((escalated.length / deptIssues.length) * 100)}%` : "0%", icon: AlertTriangle },
            { label: "Open Issues", value: deptIssues.filter((i) => i.status !== "Resolved").length, icon: BarChart3 },
            { label: "Resolution Rate", value: deptIssues.length > 0 ? `${Math.round((resolved.length / deptIssues.length) * 100)}%` : "0%", icon: CheckCircle },
          ];

          return (
            <TabsContent key={dept} value={dept}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((s) => (
                  <StatCard key={s.label} {...s} />
                ))}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default MunicipalDepartments;
