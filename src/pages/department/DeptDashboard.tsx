import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { mockIssues } from "@/data/mock-issues";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader,
  Users,
  MapPin,
  Search,
  SlidersHorizontal,
  FileDown,
  ChevronLeft,
  ChevronRight,
  Copy,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DeptDashboard = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 5;

  const issues = mockIssues.filter(
    (i) => i.city === user?.city && i.department === user?.department
  );

  const filtered = issues.filter((i) =>
    !searchQuery ||
    i.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageIssues = filtered.slice((page - 1) * perPage, page * perPage);

  const stats = [
    { label: "Total Issues", value: issues.length, icon: FileText, trend: "+12%" },
    { label: "Pending Review", value: issues.filter((i) => i.status === "Pending").length, icon: Clock },
    { label: "Work in Progress", value: issues.filter((i) => i.status === "Ongoing").length, icon: Loader },
    { label: "Resolved", value: issues.filter((i) => i.status === "Resolved").length, icon: CheckCircle, trend: "+8%" },
    { label: "Escalated", value: issues.filter((i) => i.status === "Escalated").length, icon: AlertTriangle, isAlert: true },
  ];

  const getActionLabel = (status: string) => {
    switch (status) {
      case "Escalated": return "Review";
      case "Ongoing": return "Details";
      case "Pending": return "Assign";
      case "Resolved": return "Archive";
      default: return "View";
    }
  };

  const getPriorityLabel = (issue: typeof issues[0]) => {
    if (issue.status === "Escalated") return <span className="text-destructive text-label font-medium">Critical Priority</span>;
    if (issue.reporters > 5) return <span className="text-warning text-label font-medium">High Priority</span>;
    return null;
  };

  return (
    <div className="civic-container civic-section">
      {/* Breadcrumb */}
      <p className="mb-1 text-caption text-muted-foreground">
        Pune Municipal Corporation &gt; Dashboard
      </p>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h2 font-bold text-foreground">{user?.department} Department</h1>
          <p className="text-body text-muted-foreground">
            Overview of reported issues and resolution status for {user?.city} region.
          </p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="30">
            <SelectTrigger className="h-10 w-40 gap-2">
              <Clock className="h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-10 gap-2">
            <FileDown className="h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <s.icon className="h-5 w-5 text-accent-foreground" />
              </div>
              {s.trend && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-label font-medium text-primary">{s.trend}</span>
              )}
              {s.isAlert && (
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-label font-medium text-destructive">Action Req.</span>
              )}
            </div>
            <p className="text-h2 text-foreground">{s.value}</p>
            <p className="text-caption text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tickets table */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
          <div className="flex items-center gap-2">
            <h2 className="text-body-lg font-semibold text-foreground">Active Tickets</h2>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-label text-muted-foreground">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by ID, location..."
                className="h-9 w-56 pl-9"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              />
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-label uppercase tracking-wider">Issue Details</TableHead>
              <TableHead className="text-label uppercase tracking-wider">Location</TableHead>
              <TableHead className="text-label uppercase tracking-wider">Status & Priority</TableHead>
              <TableHead className="text-label uppercase tracking-wider">Date Reported</TableHead>
              <TableHead className="text-right text-label uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageIssues.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img src={issue.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    <div>
                      <p className="text-caption font-semibold text-foreground">{issue.title}</p>
                      <div className="flex items-center gap-1 text-label text-muted-foreground">
                        <span>ID: #{issue.id}</span>
                        {issue.reporters > 3 && (
                          <span className="ml-1 flex items-center gap-0.5 rounded bg-destructive/10 px-1.5 py-0.5 text-destructive">
                            <Copy className="h-3 w-3" />{issue.reporters} Duplicates
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-caption text-muted-foreground">
                  {issue.location}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <StatusBadge status={issue.status} />
                    {getPriorityLabel(issue)}
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-caption text-foreground">
                    {new Date(issue.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <p className="text-label text-muted-foreground">{getRelativeTime(issue.createdAt)}</p>
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    to={`/department/ticket/${issue.id}`}
                    className="text-caption font-medium text-primary hover:underline"
                  >
                    {getActionLabel(issue.status)}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {pageIssues.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No tickets found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t px-5 py-3">
          <p className="text-caption text-muted-foreground">
            Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, filtered.length)} of {filtered.length} results
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

function getRelativeTime(dateStr: string) {
  const diffH = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000);
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH} hours ago`;
  const d = Math.floor(diffH / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
}

export default DeptDashboard;
