import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket, SOCKET_EVENTS } from "@/contexts/SocketContext";
import { issues as issuesApi, type ApiIssue, type ApiPagination, CATEGORY_DISPLAY } from "@/lib/api";
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
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

const PAGE_SIZE = 10;

const CitizenDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [allIssues, setAllIssues] = useState<ApiIssue[]>([]);
  const [pagination, setPagination] = useState<ApiPagination | null>(null);
  const [myIssues, setMyIssues] = useState<ApiIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [category, setCategory] = useState("All Categories");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch city issues (paginated) and my issues in parallel on mount
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const params: Record<string, string> = {
      limit: String(PAGE_SIZE),
      page: "1",
    };
    if (user.cityId) params.cityId = user.cityId;

    Promise.all([
      issuesApi.list(params),
      issuesApi.byUser(user.id),
    ])
      .then(([cityRes, myRes]) => {
        setAllIssues(cityRes.issues);
        setPagination(cityRes.pagination);
        setMyIssues(myRes.issues);
        setCurrentPage(1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  // ── Real-time: prepend new issues from the same city ──
  useEffect(() => {
    if (!socket) return;
    const handleNewIssue = (issue: ApiIssue) => {
      // Only show on page 1 with no category filter
      if (currentPage !== 1 || category !== "All Categories") return;
      setAllIssues((prev) => {
        if (prev.some((i) => i.id === issue.id)) return prev;
        return [issue, ...prev].slice(0, PAGE_SIZE);
      });
    };
    socket.on(SOCKET_EVENTS.ISSUE_CREATED, handleNewIssue);
    return () => { socket.off(SOCKET_EVENTS.ISSUE_CREATED, handleNewIssue); };
  }, [socket, currentPage, category]);

  // Fetch a specific page (with optional category filter)
  const fetchPage = useCallback(
    async (page: number, cat: string) => {
      if (!user) return;
      setPageLoading(true);
      const params: Record<string, string> = {
        limit: String(PAGE_SIZE),
        page: String(page),
      };
      if (user.cityId) params.cityId = user.cityId;
      if (cat !== "All Categories") {
        // Map display name back to API value
        const apiCat = Object.entries(CATEGORY_DISPLAY).find(([, v]) => v === cat)?.[0] ?? cat;
        params.category = apiCat;
      }
      try {
        const res = await issuesApi.list(params);
        setAllIssues(res.issues);
        setPagination(res.pagination);
        setCurrentPage(page);
      } catch (err) {
        console.error(err);
      } finally {
        setPageLoading(false);
      }
    },
    [user]
  );

  // Re-fetch from page 1 when category changes
  useEffect(() => {
    if (!user || loading) return;
    fetchPage(1, category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const resolvedCount = allIssues.filter((i) => i.status === "Resolved").length;
  const pendingCount = myIssues.filter((i) => i.status === "Pending").length;
  const totalUpvotes = myIssues.reduce((sum, i) => sum + (i._count?.upvotes ?? 0), 0);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  if (loading) {
    return (
      <div className="civic-container civic-section flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
              <p className="text-h2 text-foreground">{totalUpvotes}</p>
              <p className="text-label text-muted-foreground">Upvotes received</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Issues feed */}
        <div className="lg:col-span-2">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-h3 text-foreground">Issues Around You</h2>
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
          </div>

          {pageLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : allIssues.length > 0 ? (
            <>
              <div className="space-y-4">
                {allIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex gap-0 overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="relative w-56 shrink-0">
                      <img
                        src={issue.image}
                        alt={issue.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3">
                        <StatusBadge status={issue.status} />
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="rounded-md border bg-secondary px-2 py-0.5 text-label text-secondary-foreground">
                            {CATEGORY_DISPLAY[issue.category] || issue.category}
                          </span>
                          <span className="text-label text-muted-foreground">
                            {getRelativeTime(issue.createdAt)}
                          </span>
                        </div>
                        <h3 className="mb-1 text-body font-semibold text-foreground">{issue.title}</h3>
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
                            <ThumbsUp className="h-3.5 w-3.5" /> {issue._count?.upvotes ?? 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" /> {issue._count?.comments ?? 0}
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

              {/* Pagination controls */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-caption text-muted-foreground">
                    Page {currentPage} of {pagination.totalPages} &middot; {pagination.total} issues
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1 || pageLoading}
                      onClick={() => fetchPage(currentPage - 1, category)}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" /> Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= pagination.totalPages || pageLoading}
                      onClick={() => fetchPage(currentPage + 1, category)}
                      className="gap-1"
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border bg-card py-16 text-center">
              <MapPin className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-body text-muted-foreground">No issues found in your city yet.</p>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl bg-primary p-6 text-primary-foreground">
            <h3 className="mb-2 text-body-lg font-bold">See something wrong?</h3>
            <p className="mb-4 text-caption text-primary-foreground/80">
              Report civic issues in your area and help make your city better.
            </p>
            <Link to="/dashboard/report">
              <Button variant="secondary" className="w-full gap-2 bg-card text-foreground hover:bg-card/90">
                <PlusCircle className="h-4 w-4" />
                Report an Issue Now
              </Button>
            </Link>
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
