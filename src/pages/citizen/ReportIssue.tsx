import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, MapPin, CheckCircle, Camera, Send, AlertTriangle } from "lucide-react";
import type { IssueCategory } from "@/types";

const categories: IssueCategory[] = [
  "Garbage",
  "Pothole",
  "Water Overflow",
  "Street Light",
  "Drainage",
  "Footpath",
  "Other",
];

const departmentMap: Record<IssueCategory, string> = {
  Garbage: "Sanitation",
  Pothole: "Roads & Infrastructure",
  "Water Overflow": "Water Supply",
  "Street Light": "Electrical",
  Drainage: "Drainage",
  Footpath: "Roads & Infrastructure",
  Other: "General",
};

const urgencyLevels = [
  "Normal (Can wait a few days)",
  "Urgent (Needs attention soon)",
  "Critical (Immediate danger)",
];

const ReportIssue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDesc, setImageDesc] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<IssueCategory | "">("");
  const [urgency, setUrgency] = useState(urgencyLevels[0]);
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  // Success page
  if (submitted) {
    const dept = category ? departmentMap[category] : "the relevant department";
    return (
      <div className="civic-container civic-section">
        <div className="mx-auto max-w-xl text-center">
          {/* Green checkmark */}
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-accent">
            <CheckCircle className="h-12 w-12 text-primary" />
          </div>

          <h1 className="mb-3 text-h2 font-bold text-foreground">Report Submitted Successfully!</h1>
          <p className="mb-8 text-body text-muted-foreground">
            Thank you for being an active citizen. Your report has been automatically assigned to the{" "}
            <span className="font-semibold text-foreground">{dept} of {user?.city}</span>.
          </p>

          {/* Issue summary card */}
          <div className="mb-8 rounded-xl border bg-card p-6 text-left shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-body font-semibold text-foreground">Issue Summary</h3>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-label font-medium text-amber-800">
                Pending Review
              </span>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="text-body font-semibold text-foreground">
                {description ? description.slice(0, 40) : "New Issue Report"}
              </h4>
              <p className="mt-1 flex items-center gap-1 text-caption text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {location || "Location not specified"}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-label uppercase tracking-wider text-muted-foreground">Category</p>
                  <p className="text-caption font-medium text-foreground">{category || "General"}</p>
                </div>
                <div>
                  <p className="text-label uppercase tracking-wider text-muted-foreground">Report ID</p>
                  <p className="text-caption font-medium text-foreground">#PUN-2023-{Math.floor(Math.random() * 9000 + 1000)}</p>
                </div>
                <div>
                  <p className="text-label uppercase tracking-wider text-muted-foreground">Date</p>
                  <p className="text-caption font-medium text-foreground">{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <div>
                  <p className="text-label uppercase tracking-wider text-muted-foreground">Est. Resolution</p>
                  <p className="text-caption font-medium text-primary">7 Days</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <Button onClick={() => navigate("/dashboard")} className="gap-2">
              <Send className="h-4 w-4 rotate-[-45deg]" /> Track Progress
            </Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Return to Dashboard
            </Button>
          </div>
          <p className="mt-4 text-caption text-muted-foreground">
            You will receive email updates as the status of your report changes.
          </p>
        </div>
      </div>
    );
  }

  const canSubmit = imagePreview && location && category && description;

  return (
    <div className="civic-container civic-section">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-h2 font-bold text-foreground">Report a Civic Issue</h1>
          <p className="mt-2 text-body text-muted-foreground">
            Help us improve the city by reporting infrastructure problems, sanitation issues, or other concerns. Your reports are automatically routed to the right department.
          </p>
        </div>

        {/* Section 1: Upload Evidence */}
        <div className="mb-6 rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">1</span>
            <div>
              <h2 className="text-body font-semibold text-foreground">Upload Evidence</h2>
              <p className="text-caption text-muted-foreground">Photos help teams locate and understand the problem faster.</p>
            </div>
          </div>

          {imagePreview ? (
            <div className="relative mb-3">
              <img src={imagePreview} alt="Issue preview" className="max-h-60 w-full rounded-lg object-cover" />
              <button
                onClick={() => setImagePreview(null)}
                className="absolute top-2 right-2 rounded-lg bg-card/90 px-3 py-1 text-label font-medium text-foreground"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 py-12 transition-colors hover:border-primary/50">
              <Camera className="h-10 w-10 text-muted-foreground" />
              <span className="text-caption">
                <span className="font-medium text-primary">Upload a file</span> or drag and drop
              </span>
              <span className="text-label text-muted-foreground">PNG, JPG, GIF up to 10MB</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          )}

          <div className="mt-3 space-y-2">
            <Label>Describe the image (Accessibility)</Label>
            <Input
              placeholder="e.g. A large pothole in the middle of the crosswalk"
              value={imageDesc}
              onChange={(e) => setImageDesc(e.target.value)}
              className="h-10"
            />
          </div>
        </div>

        {/* Section 2: Issue Location */}
        <div className="mb-6 rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">2</span>
            <div>
              <h2 className="text-body font-semibold text-foreground">Issue Location</h2>
              <p className="text-caption text-muted-foreground">We've auto-detected your location. Please adjust the pin if needed.</p>
            </div>
          </div>

          {/* Map placeholder */}
          <div className="relative mb-3 flex h-48 items-center justify-center rounded-xl border bg-muted overflow-hidden">
            <div className="text-center text-caption text-muted-foreground">
              <MapPin className="mx-auto mb-2 h-8 w-8 text-destructive" />
              Interactive Map Preview
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <Input
              placeholder="Enter address or area"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-10 flex-1"
            />
            <Button variant="ghost" size="sm" className="text-primary text-caption font-medium">
              EDIT
            </Button>
          </div>
        </div>

        {/* Section 3: Issue Details */}
        <div className="mb-6 rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">3</span>
            <div>
              <h2 className="text-body font-semibold text-foreground">Issue Details</h2>
              <p className="text-caption text-muted-foreground">Provide details to help the department classify and prioritize.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as IssueCategory)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Urgency Level</Label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {urgencyLevels.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Describe the issue in detail. Example: There is a large pothole near the bus stop causing traffic slowdowns..."
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              rows={4}
            />
            <p className="text-right text-label text-muted-foreground">{description.length}/500 characters</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-caption text-muted-foreground">
            By submitting, you agree to our{" "}
            <a href="#" className="text-primary hover:underline">Terms of Service</a> and{" "}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="gap-2 bg-destructive hover:bg-destructive/90"
            >
              Submit Report <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportIssue;
