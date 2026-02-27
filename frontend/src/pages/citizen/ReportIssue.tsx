import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { issues as issuesApi, CATEGORY_DISPLAY, type ApiIssue } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Upload, MapPin, CheckCircle, Camera, Send, Info, Loader2 } from "lucide-react";
import IssueMap from "@/components/IssueMap";
import type { IssueCategory } from "@/types";
import { CATEGORY_LABELS, DEPARTMENT_MAP, ALL_CATEGORIES } from "@/types";

const ReportIssue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [pinLat, setPinLat] = useState(18.5204);
  const [pinLng, setPinLng] = useState(73.8567);
  const [category, setCategory] = useState<IssueCategory | "">("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [responseMessage, setResponseMessage] = useState("");

  // Duplicate detection: fetch nearby issues with same category
  const [nearbyDuplicates, setNearbyDuplicates] = useState<ApiIssue[]>([]);
  useEffect(() => {
    if (!category) { setNearbyDuplicates([]); return; }
    issuesApi.nearby(pinLat, pinLng, 500).then((res) => {
      const matches = res.issues.filter((i) => i.category === category);
      setNearbyDuplicates(matches);
    }).catch(() => { });
  }, [category, pinLat, pinLng]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!imageFile || !location || !category || !description || !title) return;
    setSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("location", location);
      formData.append("lat", String(pinLat));
      formData.append("lng", String(pinLng));

      const res = await issuesApi.report(formData);
      setResponseMessage(res.message);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    const dept = category ? DEPARTMENT_MAP[category as IssueCategory] : "the relevant department";
    return (
      <div className="civic-container civic-section">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-accent">
            <CheckCircle className="h-12 w-12 text-primary" />
          </div>
          <h1 className="mb-3 text-h2 font-bold text-foreground">Report Submitted Successfully!</h1>
          <p className="mb-8 text-body text-muted-foreground">{responseMessage}</p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => navigate("/dashboard")} className="gap-2"><Send className="h-4 w-4 rotate-[-45deg]" /> Track Progress</Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  const canSubmit = imageFile && location && category && description && title && !submitting;

  return (
    <div className="civic-container civic-section">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-h2 font-bold text-foreground">Report a Civic Issue</h1>
          <p className="mt-2 text-body text-muted-foreground">
            Help us improve the city by reporting infrastructure problems, sanitation issues, or other concerns.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-caption text-destructive">
            {error}
          </div>
        )}

        {/* Section 1: Upload */}
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
              <button onClick={() => { setImagePreview(null); setImageFile(null); }} className="absolute top-2 right-2 rounded-lg bg-card/90 px-3 py-1 text-label font-medium text-foreground">Remove</button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 py-12 transition-colors hover:border-primary/50">
              <Camera className="h-10 w-10 text-muted-foreground" />
              <span className="text-caption"><span className="font-medium text-primary">Upload a file</span> or drag and drop</span>
              <span className="text-label text-muted-foreground">PNG, JPG up to 5MB</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          )}
        </div>

        {/* Section 2: Location */}
        <div className="mb-6 rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">2</span>
            <div>
              <h2 className="text-body font-semibold text-foreground">Issue Location</h2>
              <p className="text-caption text-muted-foreground">Drag the pin on the map to adjust the exact location.</p>
            </div>
          </div>
          <div className="mb-3 overflow-hidden rounded-xl border">
            <IssueMap issues={[]} singlePin={[pinLat, pinLng]} draggablePin onPinMove={(lat, lng) => { setPinLat(lat); setPinLng(lng); }} height="h-52" />
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <Input placeholder="Enter address or area" value={location} onChange={(e) => setLocation(e.target.value)} className="h-10 flex-1" />
            <Button variant="ghost" size="sm" className="text-primary text-caption font-medium" onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((pos) => { setPinLat(pos.coords.latitude); setPinLng(pos.coords.longitude); });
              }
            }}>USE GPS</Button>
          </div>
        </div>

        {/* Section 3: Details */}
        <div className="mb-6 rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">3</span>
            <div>
              <h2 className="text-body font-semibold text-foreground">Issue Details</h2>
              <p className="text-caption text-muted-foreground">Provide details to help the department classify and prioritize.</p>
            </div>
          </div>
          <div className="mb-4 space-y-2">
            <Label>Title</Label>
            <Input placeholder="Brief title for the issue" value={title} onChange={(e) => setTitle(e.target.value)} className="h-10" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as IssueCategory)}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>{ALL_CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Label>Description</Label>
            <Textarea placeholder="Describe the issue in detail..." value={description} onChange={(e) => setDescription(e.target.value.slice(0, 500))} rows={4} />
            <p className="text-right text-label text-muted-foreground">{description.length}/500 characters</p>
          </div>
        </div>

        {/* Duplicate Detection */}
        {nearbyDuplicates.length > 0 && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-caption font-semibold text-amber-800">
              <Info className="h-4 w-4" /> Similar issues found nearby
            </div>
            <p className="mb-3 text-caption text-amber-700">
              We found {nearbyDuplicates.length} similar issue(s) within 500m. Your report may be linked automatically.
            </p>
            <div className="space-y-2">
              {nearbyDuplicates.slice(0, 3).map((dup) => (
                <div key={dup.id} className="flex items-center gap-3 rounded-lg bg-card p-2">
                  <img src={dup.image} alt={dup.title} className="h-10 w-10 rounded object-cover" />
                  <div className="flex-1">
                    <p className="text-caption font-medium text-foreground">{dup.title}</p>
                    <p className="text-label text-muted-foreground">{dup.reporters} reporters · {dup.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-caption text-muted-foreground">
            By submitting, you agree to our <a href="#" className="text-primary hover:underline">Terms of Service</a>.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!canSubmit} className="gap-2">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : <><Send className="h-4 w-4" /> Submit Report</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportIssue;
