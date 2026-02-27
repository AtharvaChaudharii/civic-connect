import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { municipal as municipalApi, type ApiEscalation } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, MapPin, Clock, Building2, Calendar, Search, Loader2, Users } from "lucide-react";

const MunicipalEscalations = () => {
  const { user } = useAuth();
  const [escalations, setEscalations] = useState<ApiEscalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    municipalApi.escalations()
      .then((res) => setEscalations(res.escalations))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const allDepts = ["All Departments", ...new Set(escalations.map((e) => e.department.name))];

  const filtered = escalations.filter((e) => {
    const primary = e.issuePosts[0];
    const matchDept = deptFilter === "All Departments" || e.department.name === deptFilter;
    const matchSearch = !searchQuery || primary?.title.toLowerCase().includes(searchQuery.toLowerCase()) || primary?.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDept && matchSearch;
  });

  const getOverdueLabel = (dateStr?: string | null) => {
    if (!dateStr) return "Escalated";
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days <= 0) return "Escalated Today";
    return `Overdue by ${days} days`;
  };

  const getBorderColor = (dateStr?: string | null) => {
    if (!dateStr) return "border-l-amber-400";
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days > 7) return "border-l-destructive";
    if (days > 3) return "border-l-orange-500";
    return "border-l-amber-400";
  };

  if (loading) {
    return <div className="civic-container civic-section flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="civic-container civic-section">
      <div className="mb-8">
        <h1 className="text-h2 font-bold text-foreground">Escalation Management</h1>
        <p className="text-body text-muted-foreground">Monitor and resolve issues that have exceeded the 7-day resolution window.</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-caption text-muted-foreground">Total Escalated</p>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <p className="text-h2 text-foreground">{escalations.length}</p>
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
          <SelectContent>{allDepts.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}</SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." className="h-12 pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((esc) => {
            const primary = esc.issuePosts[0];
            return (
              <div key={esc.id} className={`rounded-xl border border-l-4 ${getBorderColor(esc.escalatedAt)} bg-card p-5 shadow-sm`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full border border-destructive/20 bg-destructive/5 px-2.5 py-0.5 text-label font-medium text-destructive">
                        {getOverdueLabel(esc.escalatedAt)}
                      </span>
                      <span className="text-label text-muted-foreground">#{esc.id.slice(0, 8)}</span>
                    </div>
                    <h3 className="mb-2 text-body font-semibold text-foreground">{primary?.title || "Untitled"}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-caption text-muted-foreground">
                      <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {esc.department.name}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {primary?.location}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {primary && new Date(primary.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      {primary && primary.reporters > 1 && (
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {primary.reporters} reporters</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border bg-card py-16 text-center">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-body-lg text-muted-foreground">No escalated issues found.</p>
        </div>
      )}
    </div>
  );
};

export default MunicipalEscalations;
