import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { mockIssues } from "@/data/mock-issues";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  Clock,
  ThumbsUp,
  PlusCircle,
  MapPin,
  MessageSquare,
  TrendingUp,
  Award,
} from "lucide-react";
import { useState } from "react";

const CitizenDashboard = () => {
  const { user } = useAuth();
  const cityIssues = mockIssues.filter((i) => i.city === user?.city);
  const myIssues = cityIssues.filter((i) => i.reportedBy === user?.id);
  const [category, setCategory] = useState("All Categories");
  const [distance, setDistance] = useState("5km");

  const resolvedCount = cityIssues.filter((i) => i.status === "Resolved").length;
  const pendingCount = myIssues.filter((i) => i.status === "Pending").length;
  const totalUpvotes = myIssues.reduce((sum, i) => sum + i.upvotes, 0);

  const filteredIssues = cityIssues.filter((i) =>
    category === "All Categories" ? true : i.category === category
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const trendingTopics = [
    { rank: 1, name: "Monsoon Prep", reports: "452 reports this week" },
    { rank: 2, name: "Water Logging", reports: "310 reports this week" },
    { rank: 3, name: "Traffic Signals", reports: "128 reports this week" },
  ];

  const topCitizens = [
    { name: "Amit Patel", points: 245, badge: "Gold" },
    { name: "Sneha Rao", points: 189, badge: "Silver" },
    { name: "Rahul Deshmukh", points: 156, badge: "Bronze" },
  ];

  const badgeColors: Record<string, string> = {
    Gold: "bg-amber-100 text-amber-800",
    Silver: "bg-gray-100 text-gray-600",
    Bronze: "bg-orange-100 text-orange-800",
  };

  return (
    <div className="civic-container civic-section">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-h2 font-bold text-foreground">
          {greeting()}, {user?.name?.split(" ")[0]}! 👋
        </h1>
        <p className="mt-1 text-body text-muted-foreground">
          Here's what's happening in your neighborhood today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-caption text-muted-foreground">Issues Resolved</p>
              <p className="text-h2 text-foreground">{resolvedCount}</p>
              <p className="text-label text-primary">↗ +2 this week</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-caption text-muted-foreground">Your Pending Reports</p>
              <p className="text-h2 text-foreground">{pendingCount}</p>
              <p className="text-label text-muted-foreground">Last updated 2h ago</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <ThumbsUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-caption text-muted-foreground">Community Impact</p>
              <p className="text-h2 text-foreground">{totalUpvotes || 45}</p>
              <p className="text-label text-muted-foreground">Upvotes received</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content - two columns */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Issues feed */}
        <div className="lg:col-span-2">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-h3 text-foreground">Issues Around You</h2>
            <div className="flex gap-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["All Categories", "Garbage", "Pothole", "Water Overflow", "Street Light", "Drainage", "Footpath"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={distance} onValueChange={setDistance}>
                <SelectTrigger className="h-9 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["1km", "5km", "10km", "25km"].map((d) => (
                    <SelectItem key={d} value={d}>Distance: {d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredIssues.map((issue) => (
              <div
                key={issue.id}
                className="flex gap-0 overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Image */}
                <div className="relative w-56 shrink-0">
                  <img
                    src={issue.image}
                    alt={issue.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <StatusBadge status={issue.status} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="rounded-md border bg-secondary px-2 py-0.5 text-label text-secondary-foreground">
                        {issue.department}
                      </span>
                      <span className="text-label text-muted-foreground">
                        {getRelativeTime(issue.createdAt)}
                      </span>
                    </div>
                    <h3 className="mb-1 text-body font-semibold text-foreground">
                      {issue.title}
                    </h3>
                    <p className="mb-2 flex items-center gap-1 text-caption text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {issue.location}
                    </p>
                    <p className="line-clamp-2 text-caption text-muted-foreground">
                      {issue.description}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-caption text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3.5 w-3.5" /> {issue.upvotes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" /> {issue.comments.length}
                      </span>
                    </div>
                    <Link
                      to={`/dashboard/issue/${issue.id}`}
                      className="text-caption font-medium text-primary hover:underline"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Report CTA */}
          <div className="rounded-xl bg-primary p-6 text-primary-foreground">
            <h3 className="mb-2 text-body-lg font-bold">See something wrong?</h3>
            <p className="mb-4 text-caption text-primary-foreground/80">
              Report civic issues in your area and help make your city better. It only takes a minute.
            </p>
            <Link to="/dashboard/report">
              <Button
                variant="secondary"
                className="w-full gap-2 bg-card text-foreground hover:bg-card/90"
              >
                <PlusCircle className="h-4 w-4" />
                Report an Issue Now
              </Button>
            </Link>
          </div>

          {/* Trending Issues */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="mb-4 text-body font-semibold text-foreground">Trending Issues</h3>
            <div className="space-y-3">
              {trendingTopics.map((t) => (
                <div key={t.rank} className="flex items-start gap-3">
                  <span className="text-body-lg font-bold text-primary">#{t.rank}</span>
                  <div>
                    <p className="text-caption font-medium text-foreground">{t.name}</p>
                    <p className="text-label text-muted-foreground">{t.reports}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Citizens */}
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-body font-semibold text-foreground">Top Citizens</h3>
              <a href="#" className="text-caption font-medium text-primary hover:underline">View All</a>
            </div>
            <div className="space-y-3">
              {topCitizens.map((c, idx) => (
                <div key={c.name} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-label font-semibold text-muted-foreground">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-caption font-medium text-foreground">{c.name}</p>
                    <p className="text-label text-muted-foreground">{c.points} Impact Pts</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-label font-medium ${badgeColors[c.badge]}`}>
                    {c.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function getRelativeTime(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH} hours ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "1 day ago";
  if (diffD < 7) return `${diffD} days ago`;
  if (diffD < 14) return "1 week ago";
  return `${Math.floor(diffD / 7)} weeks ago`;
}

export default CitizenDashboard;
