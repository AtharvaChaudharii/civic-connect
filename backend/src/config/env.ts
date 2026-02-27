import dotenv from "dotenv";
dotenv.config();

export const env = {
    PORT: parseInt(process.env.PORT || "5000", 10),
    NODE_ENV: process.env.NODE_ENV || "development",
    DATABASE_URL: process.env.DATABASE_URL || "",
    JWT_SECRET: process.env.JWT_SECRET || "fallback_secret",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
    UPLOAD_DIR: process.env.UPLOAD_DIR || "./uploads",
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || "5242880", 10),
};

// Category → Department mapping
export const CATEGORY_DEPARTMENT_MAP: Record<string, string> = {
    Garbage: "Sanitation",
    Pothole: "Roads & Infrastructure",
    WaterOverflow: "Water Supply",
    StreetLight: "Electrical",
    Drainage: "Drainage",
    Footpath: "Roads & Infrastructure",
    Other: "General",
};

// Duplicate detection radius in meters
export const DUPLICATE_RADIUS_METERS = 20;

// Escalation days
export const ESCALATION_DAYS = 7;
