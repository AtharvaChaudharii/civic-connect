// ── Centralized API client ──
// Handles JWT token management, error handling, and typed requests.

const API_BASE = "/api";

function getToken(): string | null {
    return localStorage.getItem("civictrack_token");
}

function setToken(token: string) {
    localStorage.setItem("civictrack_token", token);
}

function removeToken() {
    localStorage.removeItem("civictrack_token");
}

function authHeaders(): HeadersInit {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = "ApiError";
    }
}

async function request<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE}${path}`;
    const headers: Record<string, string> = {
        ...authHeaders(),
        ...(options.headers as Record<string, string> || {}),
    };

    // Don't set Content-Type for FormData (browser sets multipart boundary)
    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url, { ...options, headers });

    if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new ApiError(body.error || "Something went wrong.", res.status);
    }

    // Handle empty responses (204 No Content)
    if (res.status === 204) return {} as T;

    return res.json();
}

// ── Auth ──

export const auth = {
    login: (email: string, password: string) =>
        request<{ user: ApiUser; token: string; message: string }>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        }),

    register: (name: string, email: string, password: string, city: string) =>
        request<{ user: ApiUser; token: string; message: string }>("/auth/register", {
            method: "POST",
            body: JSON.stringify({ name, email, password, city }),
        }),

    me: () => request<{ user: ApiUser }>("/auth/me"),
};

// ── Issues ──

export const issues = {
    list: (params?: Record<string, string>) => {
        const qs = params ? "?" + new URLSearchParams(params).toString() : "";
        return request<{ issues: ApiIssue[]; pagination: ApiPagination }>(`/issues${qs}`);
    },

    nearby: (lat: number, lng: number, radius?: number) => {
        const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
        if (radius) params.set("radius", String(radius));
        return request<{ issues: ApiIssue[] }>(`/issues/nearby?${params}`);
    },

    getById: (id: string) =>
        request<{ issue: ApiIssueDetail }>(`/issues/${id}`),

    report: (formData: FormData) =>
        request<{ message: string; issue: ApiIssue; isDuplicate: boolean }>("/issues", {
            method: "POST",
            body: formData,
        }),

    upvote: (id: string) =>
        request<{ message: string; upvoted: boolean }>(`/issues/${id}/upvote`, {
            method: "POST",
        }),

    addComment: (id: string, content: string) =>
        request<{ message: string; comment: ApiComment }>(`/issues/${id}/comments`, {
            method: "POST",
            body: JSON.stringify({ content }),
        }),

    byUser: (userId: string, params?: Record<string, string>) => {
        const qs = params ? "?" + new URLSearchParams(params).toString() : "";
        return request<{ issues: ApiIssue[]; pagination: ApiPagination }>(`/issues/user/${userId}${qs}`);
    },
};

// ── Tickets (Department) ──

export const tickets = {
    list: (params?: Record<string, string>) => {
        const qs = params ? "?" + new URLSearchParams(params).toString() : "";
        return request<{ tickets: ApiTicket[]; pagination: ApiPagination }>(`/tickets${qs}`);
    },

    getById: (id: string) =>
        request<{ ticket: ApiTicketDetail }>(`/tickets/${id}`),

    updateStatus: (id: string, status: string, resolutionComment?: string, proofFile?: File) => {
        const formData = new FormData();
        formData.append("status", status);
        if (resolutionComment) formData.append("resolutionComment", resolutionComment);
        if (proofFile) formData.append("proofImage", proofFile);
        return request<{ message: string; ticket: ApiTicket }>(`/tickets/${id}/status`, {
            method: "PATCH",
            body: formData,
        });
    },

    uploadProof: (id: string, file: File) => {
        const formData = new FormData();
        formData.append("proofImage", file);
        return request<{ message: string; ticket: ApiTicket }>(`/tickets/${id}/proof`, {
            method: "POST",
            body: formData,
        });
    },

    stats: () =>
        request<{ stats: ApiTicketStats }>("/tickets/stats"),
};

// ── Municipal ──

export const municipal = {
    overview: () =>
        request<{ city: string; overview: ApiOverviewStats; departments: ApiDeptStat[] }>(
            "/municipal/overview"
        ),

    departments: () =>
        request<{ departments: ApiDeptPerf[] }>("/municipal/departments"),

    escalations: () =>
        request<{ escalations: ApiEscalation[] }>("/municipal/escalations"),

    exportReport: (format?: string) => {
        const qs = format ? `?format=${format}` : "";
        return request<ApiExportReport>(`/municipal/reports/export${qs}`);
    },
};

// ── Notifications ──

export const notifications = {
    list: (unreadOnly?: boolean) => {
        const qs = unreadOnly ? "?unreadOnly=true" : "";
        return request<{ notifications: ApiNotification[]; unreadCount: number }>(
            `/notifications${qs}`
        );
    },

    markRead: (id: string) =>
        request<{ message: string }>(`/notifications/${id}/read`, { method: "PATCH" }),

    markAllRead: () =>
        request<{ message: string }>("/notifications/read-all", { method: "PATCH" }),
};

// ── Token management (used by AuthContext) ──

export { getToken, setToken, removeToken };

// ── API Response Types ──
// These mirror the shapes returned by the backend controllers.

export interface ApiUser {
    id: string;
    name: string;
    email: string;
    role: "citizen" | "department" | "municipal";
    avatar: string | null;
    createdAt: string;
    city: { id: string; name: string } | null;
    department?: { id: string; name: string } | null;
    cityId?: string;
    departmentId?: string | null;
}

export interface ApiIssue {
    id: string;
    title: string;
    description: string;
    category: string;
    location: string;
    lat: number;
    lng: number;
    image: string;
    status: string;
    reporters: number;
    createdAt: string;
    updatedAt: string;
    reportedBy?: { id: string; name: string; role: string };
    city?: { id: string; name: string };
    _count?: { comments: number; upvotes: number };
    consolidatedTicketId?: string;
}

export interface ApiIssueDetail extends ApiIssue {
    comments: ApiComment[];
    upvotes: { userId: string }[];
    consolidatedTicket?: {
        id: string;
        status: string;
        proofImage: string | null;
        resolutionComment: string | null;
        escalatedAt: string | null;
        resolvedAt: string | null;
    };
}

export interface ApiComment {
    id: string;
    content: string;
    image: string | null;
    isDepartmentUpdate: boolean;
    createdAt: string;
    user: { id: string; name: string; role: string; avatar?: string | null };
}

export interface ApiPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface ApiTicket {
    id: string;
    status: string;
    proofImage: string | null;
    resolutionComment: string | null;
    escalatedAt: string | null;
    resolvedAt: string | null;
    createdAt: string;
    updatedAt: string;
    department: { id: string; name: string };
    city: { id: string; name: string };
    issuePosts: ApiTicketIssue[];
    _count?: { issuePosts: number };
}

export interface ApiTicketIssue {
    id: string;
    title: string;
    description: string;
    category: string;
    location: string;
    lat: number;
    lng: number;
    image: string;
    reporters: number;
    createdAt: string;
    reportedBy?: { id: string; name: string };
}

export interface ApiTicketDetail extends ApiTicket {
    totalReporters: number;
    totalIssuePosts: number;
    issuePosts: (ApiTicketIssue & {
        comments: ApiComment[];
        _count?: { upvotes: number };
        reportedBy?: { id: string; name: string; role: string; avatar?: string | null };
    })[];
}

export interface ApiTicketStats {
    total: number;
    pending: number;
    ongoing: number;
    resolved: number;
    escalated: number;
    avgResolutionDays: number;
}

export interface ApiOverviewStats {
    total: number;
    pending: number;
    ongoing: number;
    resolved: number;
    escalated: number;
}

export interface ApiDeptStat {
    department: string;
    departmentId: string;
    categoryType: string;
    total: number;
    pending: number;
    ongoing: number;
    resolved: number;
    escalated: number;
}

export interface ApiDeptPerf {
    department: string;
    departmentId: string;
    categoryType: string;
    total: number;
    resolved: number;
    escalated: number;
    resolutionRate: number;
    avgResolutionDays: number;
}

export interface ApiEscalation {
    id: string;
    status: string;
    escalatedAt: string | null;
    createdAt: string;
    department: { id: string; name: string };
    issuePosts: {
        id: string;
        title: string;
        location: string;
        category: string;
        reporters: number;
        createdAt: string;
    }[];
}

export interface ApiNotification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    read: boolean;
    issuePostId: string | null;
    createdAt: string;
}

export interface ApiExportReport {
    city: string;
    report: ApiOverviewStats;
    departmentBreakdown: { department: string; count: number }[];
    generatedAt: string;
}

// Category display name mapping (backend uses PascalCase without spaces)
export const CATEGORY_DISPLAY: Record<string, string> = {
    Garbage: "Garbage",
    Pothole: "Pothole",
    WaterOverflow: "Water Overflow",
    StreetLight: "Street Light",
    Drainage: "Drainage",
    Footpath: "Footpath",
    Other: "Other",
};

export const CATEGORY_API_VALUE: Record<string, string> = {
    Garbage: "Garbage",
    Pothole: "Pothole",
    "Water Overflow": "WaterOverflow",
    "Street Light": "StreetLight",
    Drainage: "Drainage",
    Footpath: "Footpath",
    Other: "Other",
};
