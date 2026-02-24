import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { mockIssues } from "@/data/mock-issues";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  MapPin,
  Clock,
  FileDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Building2,
  Calendar,
  Search,
} from "lucide-react";

const MunicipalEscalations = () => {
  const { user } = useAuth();
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const allEscalated = mockIssues.filter(
    (i) => i.city === user?.city && i.status === "Escalated"
  );

  const departments = ["All Departments", ...new Set(allEscalated.map((i) => i.department))];

  const filtered = allEscalated.filter((i) => {
    const matchDept = deptFilter === "All Departments" || i.department === deptFilter;
    const matchSearch = !searchQuery ||
      i.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDept && matchSearch;
  });

  const avgDelay = 3.2;
  const criticalZones = 5;

  const getOverdueLabel = (dateStr?: string) => {
    if (!dateStr) return "Due Today";
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days <= 0) return "Due Today";
    return `Overdue by ${days} days`;
  };

  const getOverdueColor = (dateStr?: string) => {
    if (!dateStr) return "bg-amber-100 text-amber-800 border-amber-300";
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days > 7) return "bg-red-100 text-red-800 border-red-300";
    if (days > 3) return "bg-orange-100 text-orange-800 border-orange-300";
    return "bg-amber-100 text-amber-800 border-amber-300";
  };

  const getBorderColor = (dateStr?: string) => {
    if (!dateStr) return "border-l-amber-400";
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days > 7) return "border-l-destructive";
    if (days > 3) return "border-l-orange-500";
    return "border-l-amber-400";
  };

  return (
    <div className="civic-container civic-section">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h2 font-bold text-foreground">Escalation Management</h1>
          <p className="text-body text-muted-foreground">
            Monitor and resolve issues that have exceeded the 7-day resolution window.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" /> Export List
          </Button>
          <Button className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh Data
          </Button>
        </div>
      </div>

      {/* Stats + Filters */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-caption text-muted-foreground">Total Escalated</p>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <p className="text-h2 text-foreground">{allEscalated.length}</p>
          <p className="text-label text-destructive">↗ +12% this week</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-caption text-muted-foreground">Avg. Delay</p>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-h2 text-foreground">{avgDelay} <span className="text-body font-normal">days</span></p>
          <p className="text-label text-primary">↘ -0.5 days vs last week</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-caption text-muted-foreground">Critical Zones</p>
            <MapPin className="h-5 w-5 text-destructive" />
          </div>
          <p className="text-h2 text-foreground">{criticalZones}</p>
          <p className="text-label text-muted-foreground">Focus: North Ward</p>
        </div>
        <div className="space-y-2">
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search ID or Location..."
              className="h-10 pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Escalation cards */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((issue) => (
            <div
              key={issue.id}
              className={`rounded-xl border border-l-4 ${getBorderColor(issue.escalatedAt)} bg-card p-5 shadow-sm`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-label font-medium ${getOverdueColor(issue.escalatedAt)}`}>
                      {getOverdueLabel(issue.escalatedAt)}
                    </span>
                    <span className="text-label text-muted-foreground">ID: #{issue.id}</span>
                  </div>
                  <h3 className="mb-2 text-body font-semibold text-foreground">{issue.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-caption text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {issue.department}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {issue.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Reported: {new Date(issue.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted text-label font-medium text-muted-foreground">👤</div>
                    {issue.reporters > 1 && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted text-label text-muted-foreground">+{issue.reporters - 1}</div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="sm" variant="outline" className="h-7 border-primary text-primary text-label">
                      Contact Dept.
                    </Button>
                    <button className="text-label text-muted-foreground hover:text-foreground">View Details</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border bg-card py-16 text-center">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-body-lg text-muted-foreground">
            No escalated issues match your filters.
          </p>
        </div>
      )}

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-caption text-muted-foreground">
          Showing 1 to {Math.min(filtered.length, 4)} of {filtered.length} results
        </p>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {[1, 2, 3].map((p) => (
            <Button key={p} variant={page === p ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => setPage(p)}>
              {p}
            </Button>
          ))}
          <span className="flex h-8 w-8 items-center justify-center text-muted-foreground">...</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MunicipalEscalations;
