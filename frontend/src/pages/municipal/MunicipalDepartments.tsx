import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { municipal as municipalApi, type ApiDeptPerf } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, BarChart3, Clock, FileDown, Loader2 } from "lucide-react";

const MunicipalDepartments = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<ApiDeptPerf[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    municipalApi.departments()
      .then((res) => setDepartments(res.departments))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="civic-container civic-section flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="civic-container civic-section">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h2 font-bold text-foreground">Department Performance</h1>
          <p className="text-body text-muted-foreground">Compare department metrics across {user?.city}</p>
        </div>
        <Button variant="outline" className="gap-2"><FileDown className="h-4 w-4" /> Export Report</Button>
      </div>

      {departments.length === 0 ? (
        <div className="rounded-xl border bg-card py-16 text-center">
          <BarChart3 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-body text-muted-foreground">No department data available.</p>
        </div>
      ) : (
        <Tabs defaultValue={departments[0]?.department || "none"}>
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            {departments.map((d) => (
              <TabsTrigger key={d.departmentId} value={d.department} className="text-caption">{d.department}</TabsTrigger>
            ))}
          </TabsList>

          {departments.map((dept) => {
            const escRate = dept.total > 0 ? Math.round((dept.escalated / dept.total) * 100) : 0;
            const stats = [
              { label: "Total Tickets", value: dept.total, icon: BarChart3 },
              { label: "Resolution Rate", value: `${dept.resolutionRate}%`, icon: CheckCircle },
              { label: "Avg. Resolution", value: `${dept.avgResolutionDays} days`, icon: Clock },
              { label: "Escalation Rate", value: `${escRate}%`, icon: AlertTriangle },
            ];

            const statusBreakdown = [
              { name: "Resolved", count: dept.resolved, color: "hsl(142 72% 29%)" },
              { name: "Escalated", count: dept.escalated, color: "hsl(0 72% 51%)" },
              { name: "Other", count: dept.total - dept.resolved - dept.escalated, color: "hsl(210 80% 55%)" },
            ];

            return (
              <TabsContent key={dept.departmentId} value={dept.department} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {stats.map((s) => (
                    <div key={s.label} className="rounded-xl border bg-card p-5 shadow-sm">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                        <s.icon className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <p className="text-h2 text-foreground">{s.value}</p>
                      <p className="text-caption text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border bg-card p-5 shadow-sm">
                  <h4 className="mb-4 text-body font-semibold text-foreground">Status Breakdown</h4>
                  <div className="space-y-4">
                    {statusBreakdown.map((s) => {
                      const pct = dept.total > 0 ? Math.round((s.count / dept.total) * 100) : 0;
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
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
};

export default MunicipalDepartments;
