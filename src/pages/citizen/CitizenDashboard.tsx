import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { mockIssues } from "@/data/mock-issues";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/StatCard";
import IssueCard from "@/components/IssueCard";
import { FileText, CheckCircle, Clock, AlertTriangle, PlusCircle, TrendingUp } from "lucide-react";

const CitizenDashboard = () => {
  const { user } = useAuth();
  const cityIssues = mockIssues.filter((i) => i.city === user?.city);
  const myIssues = cityIssues.filter((i) => i.reportedBy === user?.id);

  const stats = [
    { label: "My Reports", value: myIssues.length, icon: FileText },
    { label: "Resolved", value: cityIssues.filter((i) => i.status === "Resolved").length, icon: CheckCircle },
    { label: "Pending", value: cityIssues.filter((i) => i.status === "Pending").length, icon: Clock },
    { label: "Escalated", value: cityIssues.filter((i) => i.status === "Escalated").length, icon: AlertTriangle },
  ];

  // Sort by upvotes for trending
  const trending = [...cityIssues].sort((a, b) => b.upvotes - a.upvotes).slice(0, 3);
  const nearby = cityIssues.slice(0, 3);

  return (
    <div className="civic-container civic-section">
      {/* Welcome */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h2 text-foreground">
            Welcome, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-body text-muted-foreground">
            Here's what's happening in {user?.city}
          </p>
        </div>
        <Link to="/dashboard/report">
          <Button size="lg" className="gap-2">
            <PlusCircle className="h-5 w-5" />
            Report Issue
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Nearby Issues */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-h3 text-foreground">Nearby Issues</h2>
          <Link to="/dashboard/search" className="text-caption font-medium text-primary hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {nearby.map((issue) => (
            <IssueCard key={issue.id} issue={issue} linkTo={`/dashboard/issue/${issue.id}`} />
          ))}
        </div>
      </section>

      {/* Trending Issues */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-h3 text-foreground">Trending in {user?.city}</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {trending.map((issue) => (
            <IssueCard key={issue.id} issue={issue} linkTo={`/dashboard/issue/${issue.id}`} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default CitizenDashboard;
