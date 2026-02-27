// ── Re-export the User type from AuthContext ──
export type { User } from "@/contexts/AuthContext";
export type UserRole = "citizen" | "department" | "municipal";

// ── Issue Types ──
export type IssueStatus = "Pending" | "Ongoing" | "Resolved" | "Escalated";

// Minimal Issue type used by shared components like IssueMap
export interface Issue {
  id: string;
  title: string;
  location: string;
  lat: number;
  lng: number;
  status: string;
  image?: string;
  category?: string;
  description?: string;
  reporters?: number;
  createdAt?: string;
}

// Backend categories (PascalCase, no spaces)
export type IssueCategory =
  | "Garbage"
  | "Pothole"
  | "WaterOverflow"
  | "StreetLight"
  | "Drainage"
  | "Footpath"
  | "Other";

// Display labels for categories
export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  Garbage: "Garbage",
  Pothole: "Pothole",
  WaterOverflow: "Water Overflow",
  StreetLight: "Street Light",
  Drainage: "Drainage",
  Footpath: "Footpath",
  Other: "Other",
};

export const ALL_CATEGORIES: IssueCategory[] = [
  "Garbage",
  "Pothole",
  "WaterOverflow",
  "StreetLight",
  "Drainage",
  "Footpath",
  "Other",
];

// ── Department mapping ──
export const DEPARTMENT_MAP: Record<IssueCategory, string> = {
  Garbage: "Sanitation",
  Pothole: "Roads & Infrastructure",
  WaterOverflow: "Water Supply",
  StreetLight: "Electrical",
  Drainage: "Drainage",
  Footpath: "Roads & Infrastructure",
  Other: "General",
};

// ── Notification Types ──
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  issuePostId?: string | null;
  createdAt: string;
}

// ── Department Stats ──
export interface DepartmentStats {
  department: string;
  city: string;
  total: number;
  pending: number;
  ongoing: number;
  resolved: number;
  escalated: number;
  avgResolutionDays: number;
}
