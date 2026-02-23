import { useParams, useNavigate } from "react-router-dom";
import { mockIssues } from "@/data/mock-issues";
import { useAuth } from "@/contexts/AuthContext";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  ThumbsUp,
  ArrowLeft,
  Clock,
  Users,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Send,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const IssueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const issue = mockIssues.find((i) => i.id === id);
  const [newComment, setNewComment] = useState("");

  if (!issue) {
    return (
      <div className="civic-container civic-section text-center">
        <p className="text-body-lg text-muted-foreground">Issue not found.</p>
        <Button className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const timelineSteps = [
    { label: "Reported", date: issue.createdAt, done: true },
    {
      label: "Ongoing",
      date: issue.status !== "Pending" ? issue.updatedAt : undefined,
      done: ["Ongoing", "Resolved", "Escalated"].includes(issue.status),
    },
    {
      label: "Resolved",
      date: issue.resolvedAt,
      done: issue.status === "Resolved",
    },
  ];

  const isEscalated = issue.status === "Escalated";

  return (
    <div className="civic-container civic-section">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-1 text-caption text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left: Image & map */}
        <div className="lg:col-span-3 space-y-4">
          <div className="overflow-hidden rounded-xl border">
            <img
              src={issue.image}
              alt={issue.title}
              className="w-full object-cover"
              style={{ maxHeight: 400 }}
            />
          </div>

          {/* Resolution proof */}
          {issue.proofImage && issue.status === "Resolved" && (
            <div className="rounded-xl border bg-accent/30 p-4">
              <div className="mb-2 flex items-center gap-2 text-caption font-medium text-primary">
                <CheckCircle className="h-4 w-4" /> Resolution Proof
              </div>
              <img
                src={issue.proofImage}
                alt="Resolution proof"
                className="max-h-60 w-full rounded-lg object-cover"
              />
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="mb-3 flex items-start gap-3 flex-wrap">
              <StatusBadge status={issue.status} />
              {isEscalated && (
                <span className="inline-flex items-center gap-1 rounded-full border border-destructive/20 bg-destructive/5 px-3 py-0.5 text-label font-medium text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  Escalated to Municipal Corporation
                </span>
              )}
            </div>
            <h1 className="text-h2 text-foreground">{issue.title}</h1>
          </div>

          <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {issue.location}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-md bg-secondary px-2.5 py-1 text-label text-secondary-foreground">
              {issue.category}
            </span>
            <span className="rounded-md bg-secondary px-2.5 py-1 text-label text-secondary-foreground">
              {issue.department}
            </span>
            {issue.reporters > 1 && (
              <span className="flex items-center gap-1 text-label text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                Reported by {issue.reporters} users
              </span>
            )}
          </div>

          <p className="text-body text-foreground leading-relaxed">
            {issue.description}
          </p>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="gap-2">
              <ThumbsUp className="h-4 w-4" />
              Upvote ({issue.upvotes})
            </Button>
          </div>

          {/* Timeline */}
          <div
            className={cn(
              "rounded-xl border p-4",
              isEscalated && "border-l-4 border-l-destructive"
            )}
          >
            <h3 className="mb-3 text-caption font-semibold text-foreground">Status Timeline</h3>
            <div className="space-y-3">
              {timelineSteps.map((s, idx) => (
                <div key={s.label} className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full",
                      s.done ? "bg-primary" : "bg-muted"
                    )}
                  >
                    {s.done ? (
                      <CheckCircle className="h-3.5 w-3.5 text-primary-foreground" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className={cn("text-caption font-medium", s.done ? "text-foreground" : "text-muted-foreground")}>
                      {s.label}
                    </p>
                    {s.date && (
                      <p className="text-label text-muted-foreground">
                        {new Date(s.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {isEscalated && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-destructive">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive-foreground" />
                  </div>
                  <div>
                    <p className="text-caption font-medium text-destructive">Escalated</p>
                    {issue.escalatedAt && (
                      <p className="text-label text-muted-foreground">
                        {new Date(issue.escalatedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 text-h3 text-foreground">
          <MessageSquare className="h-5 w-5" />
          Comments ({issue.comments.length})
        </h2>

        <div className="space-y-4">
          {issue.comments.map((c) => (
            <div
              key={c.id}
              className={cn(
                "rounded-xl border p-4",
                c.isDepartmentUpdate && "border-l-4 border-l-primary bg-accent/20"
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-label font-semibold text-muted-foreground">
                  {c.userName.charAt(0)}
                </div>
                <div>
                  <span className="text-caption font-medium text-foreground">{c.userName}</span>
                  {c.isDepartmentUpdate && (
                    <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-label text-primary">
                      Department Update
                    </span>
                  )}
                </div>
                <span className="ml-auto text-label text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
              <p className="text-body text-foreground">{c.content}</p>
              {c.image && (
                <img src={c.image} alt="Comment attachment" className="mt-2 max-h-40 rounded-lg" />
              )}
            </div>
          ))}
        </div>

        {/* Add comment */}
        <div className="mt-6 flex gap-3">
          <Textarea
            placeholder="Add a comment…"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={2}
            className="flex-1"
          />
          <Button disabled={!newComment.trim()} className="self-end gap-2">
            <Send className="h-4 w-4" /> Post
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;
