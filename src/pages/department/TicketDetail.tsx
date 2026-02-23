import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { mockIssues } from "@/data/mock-issues";
import { useAuth } from "@/contexts/AuthContext";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  MapPin,
  Users,
  ImagePlus,
  Send,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { IssueStatus } from "@/types";

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const issue = mockIssues.find((i) => i.id === id);
  const [status, setStatus] = useState<IssueStatus | "">(issue?.status || "");
  const [proofPreview, setProofPreview] = useState<string | null>(null);
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

  const canResolve = status === "Resolved" && proofPreview;

  return (
    <div className="civic-container civic-section">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-1 text-caption text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left: Image */}
        <div className="lg:col-span-3 space-y-4">
          <div className="overflow-hidden rounded-xl border">
            <img
              src={issue.image}
              alt={issue.title}
              className="w-full object-cover"
              style={{ maxHeight: 400 }}
            />
          </div>

          {/* Comments */}
          <div className="rounded-xl border bg-card p-4">
            <h3 className="mb-3 text-caption font-semibold text-foreground">
              Comments ({issue.comments.length})
            </h3>
            <div className="space-y-3">
              {issue.comments.map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    "rounded-lg border p-3",
                    c.isDepartmentUpdate && "border-l-4 border-l-primary bg-accent/20"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-caption font-medium text-foreground">{c.userName}</span>
                    {c.isDepartmentUpdate && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-label text-primary">Dept</span>
                    )}
                    <span className="ml-auto text-label text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <p className="text-caption text-foreground">{c.content}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <Textarea
                placeholder="Post a department update…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                className="flex-1"
              />
              <Button disabled={!comment.trim()} size="sm" className="self-end gap-1">
                <Send className="h-3.5 w-3.5" /> Post
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Details & Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <StatusBadge status={issue.status} />
            {issue.status === "Escalated" && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-destructive/20 bg-destructive/5 px-3 py-0.5 text-label font-medium text-destructive">
                <AlertTriangle className="h-3 w-3" />
                Escalated
              </span>
            )}
            <h1 className="mt-3 text-h3 text-foreground">{issue.title}</h1>
          </div>

          <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {issue.location}
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-md bg-secondary px-2.5 py-1 text-label text-secondary-foreground">
              {issue.category}
            </span>
            <span className="flex items-center gap-1 text-label text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {issue.reporters} reporters
            </span>
          </div>

          <p className="text-body text-foreground">{issue.description}</p>

          {/* Status update control */}
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <h3 className="text-caption font-semibold text-foreground">Update Status</h3>
            <Select value={status} onValueChange={(v) => setStatus(v as IssueStatus)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Ongoing">Ongoing</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            {status === "Resolved" && (
              <div className="space-y-2">
                <p className="text-caption text-muted-foreground">
                  A proof image is required before marking as resolved.
                </p>
                {proofPreview ? (
                  <div className="relative">
                    <img
                      src={proofPreview}
                      alt="Proof"
                      className="max-h-48 w-full rounded-lg object-cover"
                    />
                    <button
                      onClick={() => setProofPreview(null)}
                      className="absolute top-2 right-2 rounded bg-card/90 px-2 py-1 text-label text-foreground"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border py-8 transition-colors hover:border-primary/50">
                    <ImagePlus className="h-8 w-8 text-muted-foreground" />
                    <span className="text-caption text-muted-foreground">Upload proof image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProofUpload}
                    />
                  </label>
                )}
              </div>
            )}

            <Button
              className="w-full h-11 gap-2"
              disabled={status === "Resolved" && !proofPreview}
            >
              <CheckCircle className="h-4 w-4" />
              Update Status
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
