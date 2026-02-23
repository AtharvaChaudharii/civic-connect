import { useAuth } from "@/contexts/AuthContext";
import { mockIssues } from "@/data/mock-issues";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { User, MapPin, FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const ProfilePage = () => {
  const { user } = useAuth();
  const myIssues = mockIssues.filter((i) => i.reportedBy === user?.id);

  const statusCounts = {
    Pending: myIssues.filter((i) => i.status === "Pending").length,
    Ongoing: myIssues.filter((i) => i.status === "Ongoing").length,
    Resolved: myIssues.filter((i) => i.status === "Resolved").length,
    Escalated: myIssues.filter((i) => i.status === "Escalated").length,
  };

  return (
    <div className="civic-container civic-section">
      <div className="mx-auto max-w-3xl">
        {/* Profile header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-h3 font-semibold text-accent-foreground">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <h1 className="text-h3 text-foreground">{user?.name}</h1>
            <p className="text-caption text-muted-foreground">{user?.email}</p>
            <p className="text-label text-muted-foreground">{user?.city}</p>
          </div>
        </div>

        {/* Status overview */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="rounded-xl border bg-card p-4 text-center">
              <p className="text-h3 text-foreground">{count}</p>
              <p className="text-label text-muted-foreground">{status}</p>
            </div>
          ))}
        </div>

        {/* My Issues */}
        <h2 className="mb-4 text-h3 text-foreground">My Reported Issues</h2>
        {myIssues.length > 0 ? (
          <div className="space-y-3">
            {myIssues.map((issue) => (
              <Link
                key={issue.id}
                to={`/dashboard/issue/${issue.id}`}
                className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"
              >
                <img
                  src={issue.image}
                  alt={issue.title}
                  className="h-14 w-14 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-body font-medium text-foreground">
                    {issue.title}
                  </p>
                  <div className="flex items-center gap-1.5 text-label text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {issue.location}
                  </div>
                </div>
                <StatusBadge status={issue.status} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border bg-card py-12 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-body text-muted-foreground">You haven't reported any issues yet.</p>
            <Link to="/dashboard/report">
              <Button className="mt-4">Report an Issue</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
