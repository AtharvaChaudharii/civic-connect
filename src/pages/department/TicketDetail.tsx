import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { mockIssues } from "@/data/mock-issues";
import { useAuth } from "@/contexts/AuthContext";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  MapPin,
  Users,
  ImagePlus,
  Send,
  AlertTriangle,
  CheckCircle,
  Printer,
  Flag,
  Clock,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { IssueStatus } from "@/types";

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const issue = mockIssues.find((i) => i.id === id);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [comment, setComment] = useState("");

  if (!issue) {
    return (
      <div className="civic-container civic-section text-center">
        <p className="text-body-lg text-muted-foreground">Ticket not found.</p>
        <Button className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProofPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Mock timeline
  const timeline = [
    {
      label: "Work in Progress",
      date: "Today, 10:00 AM",
      description: "Maintenance team dispatched with asphalt mix.",
      active: true,
    },
    {
      label: "Issue Verified",
      date: "Yesterday, 4:30 PM",
      description: "Field officer verified severity.",
      active: false,
    },
    {
      label: "Ticket Created",
      date: new Date(issue.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + ", 10:42 AM",
      description: "",
      active: false,
    },
  ];

  // Mock discussion
  const discussion = [
    { initials: "AS", name: "Amit Singh (Sup.)", time: "Yesterday", message: "Please prioritize this. The CM is visiting this route tomorrow.", isOwn: false },
    { initials: "", name: "You", time: "10:05 AM", message: "Noted. Team is already on site. Will update with photos shortly.", isOwn: true },
    { initials: "M", name: "Maintenance", time: "10:15 AM", message: "Traffic diversion setup complete.", isOwn: false },
  ];

  return (
    <div className="civic-container civic-section">
      {/* Breadcrumb & actions */}
      <div className="mb-2 flex items-center gap-2 text-caption text-muted-foreground">
        <button onClick={() => navigate(-1)} className="hover:text-foreground">Tickets</button>
        <span>/</span>
        <span>#{issue.id}</span>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-h3 font-bold text-foreground">{issue.title}</h1>
          <StatusBadge status={issue.status} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/5">
            <Flag className="h-4 w-4" /> Escalate
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Image */}
          <div className="relative overflow-hidden rounded-xl border">
            <img src={issue.image} alt={issue.title} className="w-full object-cover" style={{ maxHeight: 380 }} />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <p className="text-caption text-white">
                Captured: {new Date(issue.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} • 10:42 AM
              </p>
            </div>
          </div>

          {/* Location & Details */}
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-1 text-label uppercase tracking-wider text-muted-foreground">Location</p>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-caption font-medium text-foreground">{issue.location}</p>
                  <p className="text-label text-muted-foreground">{user?.city}, Maharashtra</p>
                  <a href="#" className="text-label font-medium text-primary hover:underline">View on Map</a>
                </div>
              </div>
            </div>
            <div>
              <p className="mb-1 text-label uppercase tracking-wider text-muted-foreground">Details</p>
              <div className="space-y-1 text-caption">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium text-foreground">{issue.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority:</span>
                  <span className="font-medium text-destructive">! High</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assigned To:</span>
                  <span className="font-medium text-foreground">Team Alpha (North Zone)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="mb-2 text-label uppercase tracking-wider text-muted-foreground">Description</p>
            <p className="text-body text-foreground leading-relaxed">{issue.description}</p>
          </div>

          {/* Linked Reports */}
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-body font-semibold text-foreground">🔗 Linked Reports</h3>
              </div>
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-label font-medium text-primary">
                {issue.reporters} Reporters
              </span>
            </div>
            <p className="mb-3 text-caption text-muted-foreground">
              Multiple citizens have reported this same issue. All updates here will notify them automatically.
            </p>
            <div className="space-y-2">
              {["Rahul K.", "Sneha M."].map((name, idx) => (
                <div key={name} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-label font-medium text-primary">
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-caption font-medium text-foreground">{name}</p>
                      <p className="text-label text-muted-foreground">Reported {idx === 0 ? "2 hours" : "5 hours"} ago</p>
                    </div>
                  </div>
                  <span className="text-label text-muted-foreground">Ticket #{8955 - idx * 23}</span>
                </div>
              ))}
            </div>
            <button className="mt-3 w-full text-center text-caption font-medium text-primary hover:underline">
              View all {issue.reporters} reporters
            </button>
          </div>

          {/* Mark as Resolved */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="mb-1 text-body font-semibold text-foreground">Mark as Resolved</h3>
            <p className="mb-4 text-caption text-muted-foreground">Resolution Proof (Required)</p>

            {proofPreview ? (
              <div className="relative mb-3">
                <img src={proofPreview} alt="Proof" className="max-h-40 w-full rounded-lg object-cover" />
                <button
                  onClick={() => setProofPreview(null)}
                  className="absolute top-2 right-2 rounded bg-card/90 px-2 py-1 text-label text-foreground"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="mb-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border py-8 transition-colors hover:border-primary/50">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-caption">
                  <span className="font-medium text-primary">Upload a file</span> or drag and drop
                </span>
                <span className="text-label text-muted-foreground">PNG, JPG, GIF up to 10MB</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleProofUpload} />
              </label>
            )}

            <div className="mb-4 space-y-2">
              <p className="text-caption font-medium text-foreground">Resolution Note</p>
              <Textarea
                placeholder="Describe the work done..."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button disabled={!proofPreview} className="gap-2">
                <CheckCircle className="h-4 w-4" /> Mark as Resolved
              </Button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Activity Timeline */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="mb-4 text-label uppercase tracking-wider text-muted-foreground font-semibold">Activity Timeline</h3>
            <div className="space-y-4">
              {timeline.map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "flex h-3 w-3 rounded-full",
                      item.active ? "bg-primary" : "bg-muted-foreground/30"
                    )} />
                    {idx < timeline.length - 1 && <div className="w-px flex-1 bg-border" />}
                  </div>
                  <div className="pb-4">
                    <p className={cn("text-caption font-medium", item.active ? "text-primary" : "text-foreground")}>{item.label}</p>
                    <p className="text-label text-muted-foreground">{item.date}</p>
                    {item.description && (
                      <p className="mt-1 text-caption text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discussion */}
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-caption font-semibold text-foreground">Discussion</h3>
              <span className="text-label text-muted-foreground">Internal Only</span>
            </div>

            <div className="space-y-3 mb-4">
              {discussion.map((msg, idx) => (
                <div key={idx} className={cn("flex gap-2", msg.isOwn && "flex-row-reverse")}>
                  {!msg.isOwn && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-label font-semibold text-muted-foreground">
                      {msg.initials}
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[80%] rounded-xl px-3 py-2",
                    msg.isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <div className="mb-0.5 flex items-center gap-2">
                      <span className={cn("text-label font-medium", msg.isOwn ? "text-primary-foreground" : "text-foreground")}>{msg.name}</span>
                      <span className={cn("text-label", msg.isOwn ? "text-primary-foreground/70" : "text-muted-foreground")}>{msg.time}</span>
                    </div>
                    <p className={cn("text-caption", msg.isOwn ? "text-primary-foreground/90" : "text-foreground")}>{msg.message}</p>
                  </div>
                  {msg.isOwn && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-label font-semibold text-primary-foreground">
                      You
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Textarea
                placeholder="Type a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={1}
                className="flex-1 min-h-[40px]"
              />
              <Button disabled={!comment.trim()} size="icon" className="shrink-0 h-10 w-10">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
