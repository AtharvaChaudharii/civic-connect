import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { issues as issuesApi, CATEGORY_DISPLAY, type ApiIssue } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import { Search, MapPin, ThumbsUp, MessageSquare, Users, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const categoryOptions = ["All Categories", "Garbage", "Pothole", "Water Overflow", "Street Light", "Drainage", "Footpath"];
const statusOptions = ["All Status", "Pending", "Ongoing", "Resolved", "Escalated"];

const SearchPage = () => {
  const { user } = useAuth();
  const [allIssues, setAllIssues] = useState<ApiIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [status, setStatus] = useState("All Status");
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    issuesApi.list({ cityId: user.cityId })
      .then((res) => setAllIssues(res.issues))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = allIssues.filter((issue) => {
    const matchSearch = !search || issue.title.toLowerCase().includes(search.toLowerCase()) || issue.location.toLowerCase().includes(search.toLowerCase());
    const displayCat = CATEGORY_DISPLAY[issue.category] || issue.category;
    const matchCategory = category === "All Categories" || displayCat === category;
    const matchStatus = status === "All Status" || issue.status === status;
    return matchSearch && matchCategory && matchStatus;
  });

  const visible = filtered.slice(0, visibleCount);

  if (loading) {
    return <div className="civic-container civic-section flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="civic-container civic-section">
      <h1 className="mb-2 text-h2 font-bold text-foreground">Issues Around You</h1>
      <p className="mb-8 max-w-lg text-body text-muted-foreground">Browse civic issues reported by neighbors, upvote important problems, and track their resolution progress in real-time.</p>

      <div className="mb-8 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by keyword, street name, or location..." className="h-11 pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-11 w-full md:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{categoryOptions.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-11 w-full md:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{statusOptions.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
        </Select>
      </div>

      {visible.length > 0 ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((issue) => (
              <div key={issue.id} className="group overflow-hidden rounded-xl border bg-card shadow-sm civic-card-hover">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={issue.image} alt={issue.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  <div className="absolute top-3 right-3"><StatusBadge status={issue.status} /></div>
                </div>
                <div className="p-5">
                  <h3 className="mb-1 text-body font-semibold text-foreground leading-snug">{issue.title}</h3>
                  <p className="mb-3 flex items-center gap-1 text-caption text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{issue.location}</p>
                  <div className="mb-4 flex items-center gap-2 flex-wrap">
                    <span className="rounded-md border px-2 py-0.5 text-label text-muted-foreground">{CATEGORY_DISPLAY[issue.category] || issue.category}</span>
                    {issue.reporters > 1 && (<span className="flex items-center gap-1 text-label text-muted-foreground"><Users className="h-3 w-3" /> {issue.reporters} reporters</span>)}
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <div className="flex items-center gap-4 text-caption text-muted-foreground">
                      <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" /> {issue._count?.upvotes ?? 0}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {issue._count?.comments ?? 0}</span>
                    </div>
                    <Link to={`/dashboard/issue/${issue.id}`}><Button variant="outline" size="sm" className="text-caption">View Details</Button></Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {visibleCount < filtered.length && (
            <div className="mt-8 text-center">
              <Button variant="outline" onClick={() => setVisibleCount((c) => c + 6)}>Load More Issues</Button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border bg-card py-16 text-center">
          <MapPin className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-body-lg text-muted-foreground">No issues match your search.</p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
