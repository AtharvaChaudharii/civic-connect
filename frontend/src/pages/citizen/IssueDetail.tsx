import { useParams, useNavigate, useLocation } from "react-router-dom";
import { issues as issuesApi, CATEGORY_DISPLAY, type ApiIssueDetail, type ApiComment } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket, SOCKET_EVENTS } from "@/contexts/SocketContext";
import StatusBadge from "@/components/StatusBadge";
import IssueMap from "@/components/IssueMap";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin, ThumbsUp, ArrowLeft, Clock, Users, MessageSquare,
  AlertTriangle, CheckCircle, Send, Loader2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const IssueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { socket, joinIssueRoom, leaveIssueRoom } = useSocket();
  const commentsRef = useRef<HTMLDivElement>(null);
  const [issue, setIssue] = useState<ApiIssueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [upvoted, setUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    issuesApi.getById(id)
      .then((res) => {
        setIssue(res.issue);
        setComments(res.issue.comments || []);
        setUpvoteCount(res.issue.upvotes?.length ?? 0);
        setUpvoted(res.issue.upvotes?.some((u) => u.userId === user?.id) ?? false);
      })
      .catch(() => setIssue(null))
      .finally(() => setLoading(false));
  }, [id, user?.id]);

  // Scroll to comments if #comments hash is present
  useEffect(() => {
    if (!loading && location.hash === "#comments" && commentsRef.current) {
      commentsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading, location.hash]);

  // ── Real-time: join/leave issue room & listen for updates ──
  useEffect(() => {
    if (!id || !socket) return;
    joinIssueRoom(id);

    // Listen for new comments from OTHER users only.
    // Our own comments are handled optimistically in handlePostComment,
    // so we skip socket events from ourselves to avoid duplicates.
    const handleComment = (data: { issueId: string; comment: ApiComment }) => {
      if (data.issueId !== id) return;
      if (data.comment.user?.id === user?.id) return; // skip own comments
      setComments((prev) => {
        if (prev.some((c) => c.id === data.comment.id)) return prev;
        return [...prev, data.comment];
      });
    };

    // Listen for upvote changes from other users
    const handleUpvote = (data: { issueId: string; userId: string; upvoted: boolean }) => {
      if (data.issueId !== id) return;
      // Don't override our own optimistic update
      if (data.userId === user?.id) return;
      setUpvoteCount((prev) => data.upvoted ? prev + 1 : Math.max(0, prev - 1));
    };

    // Listen for status changes (ticket resolved, ongoing, etc.)
    const handleStatusChange = (data: { issueIds: string[]; status: string }) => {
      if (!data.issueIds?.includes(id)) return;
      setIssue((prev) => prev ? { ...prev, status: data.status } : prev);
      toast({ title: `Issue status updated to ${data.status}` });
    };

    socket.on(SOCKET_EVENTS.ISSUE_COMMENTED, handleComment);
    socket.on(SOCKET_EVENTS.ISSUE_UPVOTED, handleUpvote);
    socket.on(SOCKET_EVENTS.TICKET_STATUS_CHANGED, handleStatusChange);

    return () => {
      leaveIssueRoom(id);
      socket.off(SOCKET_EVENTS.ISSUE_COMMENTED, handleComment);
      socket.off(SOCKET_EVENTS.ISSUE_UPVOTED, handleUpvote);
      socket.off(SOCKET_EVENTS.TICKET_STATUS_CHANGED, handleStatusChange);
    };
  }, [id, socket, user?.id, joinIssueRoom, leaveIssueRoom]);

  if (loading) {
    return (
      <div className="civic-container civic-section flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="civic-container civic-section text-center">
        <p className="text-body-lg text-muted-foreground">Issue not found.</p>
        <Button className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const status = issue.consolidatedTicket?.status || issue.status;
  const proofImage = issue.consolidatedTicket?.proofImage;
  const isEscalated = status === "Escalated";

  const handleUpvote = async () => {
    if (!id) return;
    
    // Optimistic update - instant feedback
    const wasUpvoted = upvoted;
    const prevCount = upvoteCount;
    setUpvoted(!wasUpvoted);
    setUpvoteCount(wasUpvoted ? prevCount - 1 : prevCount + 1);

    try {
      const res = await issuesApi.upvote(id);
      // Sync with server response
      if (res.upvoted !== !wasUpvoted) {
        setUpvoted(res.upvoted);
        setUpvoteCount(res.upvoted ? prevCount + 1 : prevCount - 1);
      }
      if (res.upvoted) {
        toast({ title: "Issue upvoted!", description: "You're helping prioritize this issue." });
      } else {
        toast({ title: "Upvote removed" });
      }
    } catch {
      // Revert on error
      setUpvoted(wasUpvoted);
      setUpvoteCount(prevCount);
      toast({ title: "Failed to upvote", variant: "destructive" });
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !id || !user) return;
    
    // Optimistic update - show comment immediately
    const tempComment: ApiComment = {
      id: `temp-${Date.now()}`,
      content: newComment.trim(),
      image: null,
      isDepartmentUpdate: false,
      createdAt: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        avatar: user.avatar || null,
      },
    };
    
    setComments((prev) => [...prev, tempComment]);
    const commentText = newComment.trim();
    setNewComment("");
    setSubmittingComment(true);

    try {
      const res = await issuesApi.addComment(id, commentText);
      // Replace temp comment with real one from server
      setComments((prev) => prev.map(c => c.id === tempComment.id ? res.comment : c));
      toast({ title: "Comment posted" });
    } catch {
      // Remove temp comment on error
      setComments((prev) => prev.filter(c => c.id !== tempComment.id));
      setNewComment(commentText); // Restore text
      toast({ title: "Failed to post comment", variant: "destructive" });
    } finally {
      setSubmittingComment(false);
    }
  };

  const timelineSteps = [
    { label: "Reported", date: issue.createdAt, done: true },
    { label: "Ongoing", date: status !== "Pending" ? issue.updatedAt : undefined, done: ["Ongoing", "Resolved", "Escalated"].includes(status) },
    { label: "Resolved", date: issue.consolidatedTicket?.resolvedAt || undefined, done: status === "Resolved" },
  ];

  return (
    <div className="civic-container civic-section">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-caption text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <div className="overflow-hidden rounded-xl border">
            <img src={issue.image} alt={issue.title} className="w-full object-cover" style={{ maxHeight: 400 }} />
          </div>
          <div className="overflow-hidden rounded-xl border">
            <IssueMap issues={[]} singlePin={[issue.lat, issue.lng]} height="h-48" />
          </div>
          {proofImage && status === "Resolved" && (
            <div className="rounded-xl border bg-accent/30 p-4">
              <div className="mb-2 flex items-center gap-2 text-caption font-medium text-primary">
                <CheckCircle className="h-4 w-4" /> Resolution Proof
              </div>
              <img src={proofImage} alt="Resolution proof" className="max-h-60 w-full rounded-lg object-cover" />
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="mb-3 flex items-start gap-3 flex-wrap">
              <StatusBadge status={status} />
              {isEscalated && (
                <span className="inline-flex items-center gap-1 rounded-full border border-destructive/20 bg-destructive/5 px-3 py-0.5 text-label font-medium text-destructive">
                  <AlertTriangle className="h-3 w-3" /> Escalated
                </span>
              )}
            </div>
            <h1 className="text-h2 text-foreground">{issue.title}</h1>
          </div>

          <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
            <MapPin className="h-4 w-4" /> {issue.location}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-md bg-secondary px-2.5 py-1 text-label text-secondary-foreground">{CATEGORY_DISPLAY[issue.category] || issue.category}</span>
            {issue.reporters > 1 && (
              <span className="flex items-center gap-1 text-label text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> Reported by {issue.reporters} users
              </span>
            )}
          </div>

          <p className="text-body text-foreground leading-relaxed">{issue.description}</p>

          <div className="flex items-center gap-4">
            <Button variant={upvoted ? "default" : "outline"} size="sm" className="gap-2" onClick={handleUpvote}>
              <ThumbsUp className={cn("h-4 w-4", upvoted && "fill-current")} /> Upvote ({upvoteCount})
            </Button>
          </div>

          {/* Timeline */}
          <div className={cn("rounded-xl border p-4", isEscalated && "border-l-4 border-l-destructive")}>
            <h3 className="mb-3 text-caption font-semibold text-foreground">Status Timeline</h3>
            <div className="space-y-3">
              {timelineSteps.map((s) => (
                <div key={s.label} className="flex items-start gap-3">
                  <div className={cn("mt-0.5 flex h-6 w-6 items-center justify-center rounded-full", s.done ? "bg-primary" : "bg-muted")}>
                    {s.done ? <CheckCircle className="h-3.5 w-3.5 text-primary-foreground" /> : <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className={cn("text-caption font-medium", s.done ? "text-foreground" : "text-muted-foreground")}>{s.label}</p>
                    {s.date && <p className="text-label text-muted-foreground">{new Date(s.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>}
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
                    {issue.consolidatedTicket?.escalatedAt && <p className="text-label text-muted-foreground">{new Date(issue.consolidatedTicket.escalatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>}
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
          <MessageSquare className="h-5 w-5" /> Comments ({comments.length})
        </h2>
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className={cn("rounded-xl border p-4", c.isDepartmentUpdate && "border-l-4 border-l-primary bg-accent/20")}>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-label font-semibold text-muted-foreground">{c.user.name.charAt(0)}</div>
                <div>
                  <span className="text-caption font-medium text-foreground">{c.user.name}</span>
                  {c.isDepartmentUpdate && <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-label text-primary">Department Update</span>}
                </div>
                <span className="ml-auto text-label text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
              </div>
              <p className="text-body text-foreground">{c.content}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <Textarea placeholder="Add a comment…" value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={2} className="flex-1" />
          <Button disabled={!newComment.trim() || submittingComment} className="self-end gap-2" onClick={handlePostComment}>
            {submittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Post
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;
