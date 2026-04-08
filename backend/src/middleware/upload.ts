import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

// ── Configure Cloudinary from env vars ──
cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
});

// Use memory storage — we stream the buffer to Cloudinary ourselves
const storage = multer.memoryStorage();

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only image files (JPEG, PNG, WebP, GIF) are allowed."));
    }
};

// Base multer instance (validates type + size, buffers file in memory)
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: env.MAX_FILE_SIZE,
    },
});

/**
 * Express middleware that uploads req.file buffer to Cloudinary.
 * Must be used AFTER upload.single() / upload.fields().
 * On success, sets req.file.path to the Cloudinary secure URL.
 */
export async function uploadToCloudinary(
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> {
    if (!req.file) return next();

    try {
        const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "civicconnect",
                    resource_type: "image",
                    // Auto-compress & convert to webp for smaller sizes
                    transformation: [{ quality: "auto", fetch_format: "auto" }],
                },
                (error, result) => {
                    if (error || !result) return reject(error ?? new Error("Cloudinary upload failed"));
                    resolve(result);
                }
            );
            stream.end(req.file!.buffer);
        });

        // Store the full Cloudinary URL in path (replacing the old /uploads/... pattern)
        req.file.path = result.secure_url;
        next();
    } catch (err) {
        next(err);
    }
}
