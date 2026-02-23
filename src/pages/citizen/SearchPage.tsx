import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { mockIssues } from "@/data/mock-issues";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import IssueCard from "@/components/IssueCard";
import { Search, MapPin } from "lucide-react";

const categories = [
  "All Categories",
  "Garbage",
  "Pothole",
  "Water Overflow",
  "Street Light",
  "Drainage",
  "Footpath",
];
const statuses = ["All Status", "Pending", "Ongoing", "Resolved", "Escalated"];

const SearchPage = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [status, setStatus] = useState("All Status");

  const cityIssues = mockIssues.filter((i) => i.city === user?.city);

  const filtered = cityIssues.filter((issue) => {
    const matchSearch =
      !search ||
      issue.title.toLowerCase().includes(search.toLowerCase()) ||
      issue.location.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      category === "All Categories" || issue.category === category;
    const matchStatus = status === "All Status" || issue.status === status;
    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <div className="civic-container civic-section">
      <h1 className="mb-2 text-h2 text-foreground">Search Issues</h1>
      <p className="mb-8 text-body text-muted-foreground">
        Find and discover civic issues in {user?.city}.
      </p>

      {/* Filters */}
      <div className="mb-8 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by keyword or location…"
            className="h-11 pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-11 w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-11 w-full md:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="mb-4 text-caption text-muted-foreground">
        {filtered.length} issue{filtered.length !== 1 ? "s" : ""} found
      </p>

      {filtered.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((issue) => (
            <IssueCard key={issue.id} issue={issue} linkTo={`/dashboard/issue/${issue.id}`} />
          ))}
        </div>
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
