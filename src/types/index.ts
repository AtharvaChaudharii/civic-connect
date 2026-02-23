// ── Role & Auth Types ──
export type UserRole = "citizen" | "department" | "municipal";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  city: string;
  department?: string; // only for department role
  avatar?: string;
  createdAt: string;
}

// ── Issue Types ──
export type IssueStatus = "Pending" | "Ongoing" | "Resolved" | "Escalated";

export type IssueCategory =
  | "Garbage"
  | "Pothole"
  | "Water Overflow"
  | "Street Light"
  | "Drainage"
  | "Footpath"
  | "Other";

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  location: string;
  lat: number;
  lng: number;
  city: string;
  department: string;
  status: IssueStatus;
  image: string;
  proofImage?: string;
  upvotes: number;
  comments: Comment[];
  reporters: number;
  reportedBy: string; // user id
  createdAt: string;
  updatedAt: string;
  escalatedAt?: string;
  resolvedAt?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  content: string;
  image?: string;
  createdAt: string;
  isDepartmentUpdate?: boolean;
}

// ── Notification Types ──
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  issueId?: string;
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
