import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { issues as issuesApi, CATEGORY_DISPLAY, type ApiIssue } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, FileText, ThumbsUp, Search, PlusCircle, ChevronLeft, ChevronRight, MoreVertical, CheckCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ProfilePage = () => {
  const { user } = useAuth();
  const [myIssues, setMyIssues] = useState<ApiIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    issuesApi.byUser(user.id)
      .then((res) => setMyIssues(res.issues))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const resolvedCount = myIssues.filter((i) => i.status === "Resolved").length;
  const totalUpvotes = myIssues.reduce((sum, i) => sum + (i._count?.upvotes ?? 0), 0);

  const filtered = myIssues.filter((i) => {
    const matchSearch = !search || i.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All Status" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusColors: Record<string, string> = { Pending: "bg-amber-500", Ongoing: "bg-orange-500", Resolved: "bg-emerald-500", Escalated: "bg-red-500" };

  if (loading) {
    return <div className="civic-container civic-section flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="civic-container civic-section">
      {/* Profile header */}
      <div className="mb-8 flex flex-wrap items-center gap-6 rounded-xl border bg-card p-6">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-h2 font-semibold text-muted-foreground">{user?.name?.charAt(0)}</div>
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"><CheckCircle className="h-3.5 w-3.5" /></div>
        </div>
        <div className="flex-1">
          <h1 className="text-h3 text-foreground">{user?.name}</h1>
          <p className="flex items-center gap-1 text-caption text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{user?.city}</p>
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-label font-medium text-accent-foreground">Active Citizen</span>
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
            <p className="text-h3 text-foreground">{totalUpvotes}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="reported">
            <TabsList className="mb-6 h-auto gap-0 bg-transparent p-0 border-b rounded-none w-full justify-start">
              <TabsTrigger value="reported" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-1.5 px-4 pb-3">
                <FileText className="h-4 w-4" /> My Reported Issues
              </TabsTrigger>
              <TabsTrigger value="upvoted" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-1.5 px-4 pb-3">
                <ThumbsUp className="h-4 w-4" /> Upvoted Issues
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reported">
              <div className="mb-4 flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search issues..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>{["All Status", "Pending", "Ongoing", "Resolved", "Escalated"].map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {filtered.map((issue) => (
                  <div key={issue.id} className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="flex gap-0">
                      <img src={issue.image} alt={issue.title} className="h-32 w-28 shrink-0 object-cover" />
                      <div className="flex flex-1 flex-col justify-between p-4">
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <StatusBadge status={issue.status} />
                            <span className="text-label text-muted-foreground">Reported {getRelativeTime(issue.createdAt)}</span>
                          </div>
                          <h3 className="text-body font-semibold text-foreground">{issue.title}</h3>
                          <p className="mt-1 line-clamp-2 text-caption text-muted-foreground">{issue.description}</p>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-3 text-caption text-muted-foreground">
                            <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" /> {issue._count?.upvotes ?? 0}</span>
                            <span className="flex items-center gap-1">💬 {issue._count?.comments ?? 0}</span>
                            <span className="rounded-md border px-2 py-0.5 text-label">{CATEGORY_DISPLAY[issue.category] || issue.category}</span>
                          </div>
                          <Link to={`/dashboard/issue/${issue.id}`} className="text-caption font-medium text-primary hover:underline">View Details →</Link>
                        </div>
                      </div>
                    </div>
                    <div className={`h-1 ${statusColors[issue.status] || "bg-muted"}`} />
                  </div>
                ))}
                {filtered.length === 0 && <p className="py-8 text-center text-muted-foreground">No issues found.</p>}
              </div>
            </TabsContent>

            <TabsContent value="upvoted">
              <div className="rounded-xl border bg-card py-16 text-center">
                <ThumbsUp className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-body text-muted-foreground">Upvoted issues tracking coming soon.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-primary p-6 text-primary-foreground">
            <h3 className="mb-2 text-body font-bold">Have a new issue?</h3>
            <p className="mb-4 text-caption text-primary-foreground/80">Report civic issues in your neighborhood and track their resolution.</p>
            <Link to="/dashboard/report">
              <Button variant="secondary" className="w-full gap-2 bg-card text-foreground hover:bg-card/90"><PlusCircle className="h-4 w-4" /> Report Issue</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

function getRelativeTime(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffD = Math.floor(diffMs / 86400000);
  if (diffD === 0) return "today";
  if (diffD === 1) return "1 day ago";
  if (diffD < 7) return `${diffD} days ago`;
  return `${Math.floor(diffD / 7)} weeks ago`;
}

export default ProfilePage;
