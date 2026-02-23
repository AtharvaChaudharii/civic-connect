import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Upload, MapPin, CheckCircle, ArrowLeft, ArrowRight, ImagePlus } from "lucide-react";
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

const ReportIssue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<IssueCategory | "">("");
  const [title, setTitle] = useState("");
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

  if (submitted) {
    const dept = category ? departmentMap[category] : "the relevant department";
    return (
      <div className="civic-container civic-section">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="mb-3 text-h2 text-foreground">Report Submitted</h1>
          <p className="mb-8 text-body-lg text-muted-foreground">
            Your report has been sent to the{" "}
            <span className="font-medium text-foreground">{dept}</span> department of{" "}
            <span className="font-medium text-foreground">{user?.city}</span>.
            You'll receive updates as the status changes.
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
            <Button
              variant="outline"
              onClick={() => {
                setSubmitted(false);
                setStep(1);
                setImagePreview(null);
                setLocation("");
                setCategory("");
                setTitle("");
                setDescription("");
              }}
            >
              Report Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="civic-container civic-section">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-6 flex items-center gap-1 text-caption text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        <h1 className="mb-2 text-h2 text-foreground">Report an Issue</h1>
        <p className="mb-8 text-body text-muted-foreground">
          Help improve your city by reporting civic problems.
        </p>

        {/* Step indicator */}
        <div className="mb-8 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-label font-semibold ${
                  step >= s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`h-0.5 w-8 rounded ${
                    step > s ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
          <span className="ml-2 text-caption text-muted-foreground">
            {step === 1 ? "Upload Photo" : step === 2 ? "Location & Category" : "Review & Submit"}
          </span>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-h3 text-foreground">Upload a Photo</h2>
              <p className="text-caption text-muted-foreground">
                Take or upload a clear photo of the issue.
              </p>
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Issue preview"
                    className="max-h-80 w-full rounded-lg object-cover"
                  />
                  <button
                    onClick={() => setImagePreview(null)}
                    className="absolute top-2 right-2 rounded-lg bg-card/90 px-3 py-1 text-label font-medium text-foreground"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/50 py-16 transition-colors hover:border-primary/50 hover:bg-accent/30">
                  <ImagePlus className="h-10 w-10 text-muted-foreground" />
                  <span className="text-body font-medium text-muted-foreground">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-caption text-muted-foreground">
                    JPG, PNG up to 10MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
              <div className="flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!imagePreview}
                  className="gap-2"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Location & Category */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-h3 text-foreground">Location & Category</h2>
              <div className="space-y-2">
                <Label htmlFor="title">Issue Title</Label>
                <Input
                  id="title"
                  placeholder="Brief title, e.g. Garbage near park"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="Enter address or area"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-11 pl-9"
                  />
                </div>
                {/* Map placeholder */}
                <div className="flex h-40 items-center justify-center rounded-lg border bg-muted text-caption text-muted-foreground">
                  <MapPin className="mr-2 h-5 w-5" />
                  Map preview would appear here
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as IssueCategory)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select issue category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  placeholder="Describe the issue in detail…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!title || !location || !category}
                  className="gap-2"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-h3 text-foreground">Review & Submit</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Issue"
                    className="rounded-lg object-cover"
                  />
                )}
                <div className="space-y-3">
                  <div>
                    <span className="text-label text-muted-foreground">Title</span>
                    <p className="text-body font-medium text-foreground">{title}</p>
                  </div>
                  <div>
                    <span className="text-label text-muted-foreground">Location</span>
                    <p className="text-body text-foreground">{location}</p>
                  </div>
                  <div>
                    <span className="text-label text-muted-foreground">Category</span>
                    <p className="text-body text-foreground">{category}</p>
                  </div>
                  <div>
                    <span className="text-label text-muted-foreground">Department</span>
                    <p className="text-body text-foreground">
                      {category ? departmentMap[category] : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-label text-muted-foreground">City</span>
                    <p className="text-body text-foreground">{user?.city}</p>
                  </div>
                </div>
              </div>
              {description && (
                <div>
                  <span className="text-label text-muted-foreground">Description</span>
                  <p className="mt-1 text-body text-foreground">{description}</p>
                </div>
              )}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleSubmit} className="gap-2">
                  <Upload className="h-4 w-4" /> Submit Report
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportIssue;
