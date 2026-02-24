import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { mockIssues } from "@/data/mock-issues";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  FileText,
  ThumbsUp,
  Search,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckCircle,
  Shield,
  Award,
  BookmarkIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ProfilePage = () => {
  const { user } = useAuth();
  const myIssues = mockIssues.filter((i) => i.reportedBy === user?.id);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [page, setPage] = useState(1);

  const resolvedCount = myIssues.filter((i) => i.status === "Resolved").length;
  const totalUpvotes = myIssues.reduce((sum, i) => sum + i.upvotes, 0);

  const filtered = myIssues.filter((i) => {
    const matchSearch = !search || i.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All Status" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusColors: Record<string, string> = {
    Pending: "bg-amber-500",
    Ongoing: "bg-orange-500",
    Resolved: "bg-emerald-500",
    Escalated: "bg-red-500",
  };

  return (
    <div className="civic-container civic-section">
      {/* Profile header */}
      <div className="mb-8 flex flex-wrap items-center gap-6 rounded-xl border bg-card p-6">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-h2 font-semibold text-muted-foreground">
            {user?.name?.charAt(0)}
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <CheckCircle className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="flex-1">
          <h1 className="text-h3 text-foreground">{user?.name}</h1>
          <p className="flex items-center gap-1 text-caption text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {user?.city}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-label font-medium text-accent-foreground">
              Active Citizen
            </span>
            <span className="text-label text-muted-foreground">Member since 2023</span>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="rounded-xl border bg-background px-6 py-3 text-center">
            <p className="text-caption text-muted-foreground">Issues Reported</p>
            <p className="text-h3 text-primary">{myIssues.length}</p>
          </div>
          <div className="rounded-xl border bg-background px-6 py-3 text-center">
            <p className="text-caption text-muted-foreground">Resolved</p>
            <p className="text-h3 text-foreground">{resolvedCount}</p>
          </div>
          <div className="rounded-xl border bg-background px-6 py-3 text-center">
            <p className="text-caption text-muted-foreground">Impact Score</p>
            <p className="text-h3 text-foreground">{totalUpvotes || 450}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Issue tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="reported">
            <TabsList className="mb-6 h-auto gap-0 bg-transparent p-0 border-b rounded-none w-full justify-start">
              <TabsTrigger value="reported" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-1.5 px-4 pb-3">
                <FileText className="h-4 w-4" /> My Reported Issues
              </TabsTrigger>
              <TabsTrigger value="upvoted" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-1.5 px-4 pb-3">
                <ThumbsUp className="h-4 w-4" /> Upvoted Issues
              </TabsTrigger>
              <TabsTrigger value="drafts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-1.5 px-4 pb-3">
                <BookmarkIcon className="h-4 w-4" /> Saved Drafts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reported">
              {/* Filters */}
              <div className="mb-4 flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search issues..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["All Status", "Pending", "Ongoing", "Resolved", "Escalated"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Issue list */}
              <div className="space-y-4">
                {filtered.map((issue) => (
                  <div key={issue.id} className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="flex gap-0">
                      <img
                        src={issue.image}
                        alt={issue.title}
                        className="h-32 w-28 shrink-0 object-cover"
                      />
                      <div className="flex flex-1 flex-col justify-between p-4">
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <StatusBadge status={issue.status} />
                            <span className="text-label text-muted-foreground">
                              Reported {getRelativeTime(issue.createdAt)}
                            </span>
                            <button className="ml-auto text-muted-foreground hover:text-foreground">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>
                          <h3 className="text-body font-semibold text-foreground">{issue.title}</h3>
                          <p className="mt-1 line-clamp-2 text-caption text-muted-foreground">
                            {issue.description}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-3 text-caption text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="h-3.5 w-3.5" /> {issue.upvotes}
                            </span>
                            <span className="flex items-center gap-1">
                              💬 {issue.comments.length}
                            </span>
                            <span className="rounded-md border px-2 py-0.5 text-label">{issue.department}</span>
                          </div>
                          <Link
                            to={`/dashboard/issue/${issue.id}`}
                            className="text-caption font-medium text-primary hover:underline"
                          >
                            View Details →
                          </Link>
                        </div>
                      </div>
                    </div>
                    {/* Bottom status bar */}
                    <div className={`h-1 ${statusColors[issue.status] || "bg-muted"}`} />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-6 flex items-center justify-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {[1, 2, 3].map((p) => (
                  <Button
                    key={p}
                    variant={page === p ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))}
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="upvoted">
              <div className="rounded-xl border bg-card py-16 text-center">
                <ThumbsUp className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-body text-muted-foreground">No upvoted issues yet.</p>
              </div>
            </TabsContent>

            <TabsContent value="drafts">
              <div className="rounded-xl border bg-card py-16 text-center">
                <BookmarkIcon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-body text-muted-foreground">No saved drafts.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Report CTA */}
          <div className="rounded-xl bg-primary p-6 text-primary-foreground">
            <h3 className="mb-2 text-body font-bold">Have a new issue?</h3>
            <p className="mb-4 text-caption text-primary-foreground/80">
              Report civic issues in your neighborhood and track their resolution.
            </p>
            <Link to="/dashboard/report">
              <Button variant="secondary" className="w-full gap-2 bg-card text-foreground hover:bg-card/90">
                <PlusCircle className="h-4 w-4" />
                Report Issue
              </Button>
            </Link>
          </div>

          {/* Notification Settings */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="mb-4 text-body font-semibold text-foreground">Notification Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption font-medium text-foreground">Issue Status Updates</p>
                  <p className="text-label text-muted-foreground">Get notified when status changes</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption font-medium text-foreground">Nearby Issues</p>
                  <p className="text-label text-muted-foreground">Alerts for issues within 1km</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption font-medium text-foreground">Department Announcements</p>
                  <p className="text-label text-muted-foreground">News from local municipality</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-body font-semibold text-foreground">Your Badges</h3>
              <a href="#" className="text-caption font-medium text-primary hover:underline">View All</a>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <p className="text-label text-muted-foreground">Verified</p>
              </div>
              <div>
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                  <Award className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-label text-muted-foreground">Helper</p>
              </div>
              <div>
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
                  <Award className="h-6 w-6 text-amber-600" />
                </div>
                <p className="text-label text-muted-foreground">Champion</p>
              </div>
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
  const diffD = Math.floor(diffMs / 86400000);
  if (diffD === 0) return "today";
  if (diffD === 1) return "1 day ago";
  if (diffD < 7) return `${diffD} days ago`;
  return `${Math.floor(diffD / 7)} weeks ago`;
}

export default ProfilePage;
