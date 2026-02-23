import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import IssueCard from "@/components/IssueCard";
import type { IssueStatus } from "@/components/StatusBadge";

interface Issue {
  id: string;
  title: string;
  location: string;
  department: string;
  status: IssueStatus;
  image: string;
  upvotes: number;
  comments: number;
  reporters: number;
  daysAgo: number;
}

import issueGarbage from "@/assets/issue-garbage.jpg";
import issuePothole from "@/assets/issue-pothole.jpg";
import issueWater from "@/assets/issue-water.jpg";
import issueStreetlight from "@/assets/issue-streetlight.jpg";
import issueDrainage from "@/assets/issue-drainage.jpg";
import issueFootpath from "@/assets/issue-footpath.jpg";

const mockIssues: Issue[] = [
  {
    id: "1",
    title: "Garbage Accumulation Near FC Road",
    location: "FC Road, Deccan, Pune",
    department: "Sanitation",
    status: "Pending",
    image: issueGarbage,
    upvotes: 47,
    comments: 12,
    reporters: 5,
    daysAgo: 2,
  },
  {
    id: "2",
    title: "Large Pothole on MG Road",
    location: "MG Road, Camp, Pune",
    department: "Roads & Infrastructure",
    status: "Ongoing",
    image: issuePothole,
    upvotes: 89,
    comments: 23,
    reporters: 12,
    daysAgo: 5,
  },
  {
    id: "3",
    title: "Water Pipe Burst Near Market",
    location: "Laxmi Road, Pune",
    department: "Water Supply",
    status: "Resolved",
    image: issueWater,
    upvotes: 34,
    comments: 8,
    reporters: 3,
    daysAgo: 10,
  },
  {
    id: "4",
    title: "Non-functional Street Lights",
    location: "Kothrud, Pune",
    department: "Electrical",
    status: "Escalated",
    image: issueStreetlight,
    upvotes: 62,
    comments: 15,
    reporters: 8,
    daysAgo: 9,
  },
  {
    id: "5",
    title: "Blocked Storm Drain Causing Flooding",
    location: "Hadapsar, Pune",
    department: "Drainage",
    status: "Pending",
    image: issueDrainage,
    upvotes: 51,
    comments: 19,
    reporters: 7,
    daysAgo: 1,
  },
  {
    id: "6",
    title: "Damaged Footpath Near School",
    location: "Aundh, Pune",
    department: "Roads & Infrastructure",
    status: "Ongoing",
    image: issueFootpath,
    upvotes: 28,
    comments: 6,
    reporters: 4,
    daysAgo: 4,
  },
];

const categories = [
  "All Categories",
  "Sanitation",
  "Roads & Infrastructure",
  "Water Supply",
  "Electrical",
  "Drainage",
];
const statuses = ["All Status", "Pending", "Ongoing", "Resolved", "Escalated"];

const IssueFeed = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [status, setStatus] = useState("All Status");

  const filtered = mockIssues.filter((issue) => {
    const matchSearch =
      !search ||
      issue.title.toLowerCase().includes(search.toLowerCase()) ||
      issue.location.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      category === "All Categories" || issue.department === category;
    const matchStatus = status === "All Status" || issue.status === status;
    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <section id="issues" className="civic-section bg-background">
      <div className="civic-container">
        <h2 className="mb-2 text-h2 text-foreground">Issues Around You</h2>
        <p className="mb-8 text-body-lg text-muted-foreground">
          Browse and upvote civic issues reported in your area.
        </p>

        {/* Filter bar */}
        <div className="mb-8 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by keyword or location…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border bg-card py-16 text-center">
            <p className="text-body-lg text-muted-foreground">
              No issues match your filters.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default IssueFeed;
