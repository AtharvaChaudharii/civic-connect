import { useAuth } from "@/contexts/AuthContext";
import { mockIssues } from "@/data/mock-issues";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { Link } from "react-router-dom";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader,
  Users,
  MapPin,
} from "lucide-react";
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
  const issues = mockIssues.filter(
    (i) => i.city === user?.city && i.department === user?.department
  );

  const stats = [
    { label: "Total Issues", value: issues.length, icon: FileText },
    { label: "Pending", value: issues.filter((i) => i.status === "Pending").length, icon: Clock },
    { label: "Ongoing", value: issues.filter((i) => i.status === "Ongoing").length, icon: Loader },
    { label: "Resolved", value: issues.filter((i) => i.status === "Resolved").length, icon: CheckCircle },
    { label: "Escalated", value: issues.filter((i) => i.status === "Escalated").length, icon: AlertTriangle },
  ];

  return (
    <div className="civic-container civic-section">
      <h1 className="mb-2 text-h2 text-foreground">{user?.department} Dashboard</h1>
      <p className="mb-8 text-body text-muted-foreground">{user?.city} · Department Overview</p>

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <h2 className="mb-4 text-h3 text-foreground">All Tickets</h2>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-center">Reporters</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell className="font-mono text-caption">{issue.id}</TableCell>
                <TableCell className="text-caption">{issue.category}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1 text-caption">
                    <MapPin className="h-3 w-3" />
                    {issue.location}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="flex items-center justify-center gap-1 text-caption">
                    <Users className="h-3 w-3" />
                    {issue.reporters}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={issue.status} />
                </TableCell>
                <TableCell>
                  <Link
                    to={`/department/ticket/${issue.id}`}
                    className="text-caption font-medium text-primary hover:underline"
                  >
                    View
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {issues.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No tickets assigned.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DeptDashboard;
