import type { Request, Response } from "express";
import prisma from "../config/db.js";
import { reportIssueSchema, commentSchema } from "../utils/validators.js";
import { CATEGORY_DEPARTMENT_MAP } from "../config/env.js";
import { findDuplicateTicket } from "../services/duplicateDetection.js";
import { notifyDepartmentUsers, createNotification } from "../services/notificationService.js";

// Matches the IssueCategory enum in prisma/schema.prisma
type IssueCategory = "Garbage" | "Pothole" | "WaterOverflow" | "StreetLight" | "Drainage" | "Footpath" | "Other";

/**
 * POST /api/issues
 * Report a new civic issue (citizen only).
 */
export async function reportIssue(req: Request, res: Response): Promise<void> {
    try {
        const validation = reportIssueSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: validation.error.errors[0].message });
            return;
        }

        const { title, description, category, location, lat, lng } = validation.data;
        const userId = req.user!.id;
        const cityId = req.user!.cityId;

        if (!cityId) {
            res.status(400).json({ error: "Your account is not associated with a city." });
            return;
        }

        const imagePath = req.file ? `/uploads/${req.file.filename}` : "";
        if (!imagePath) {
            res.status(400).json({ error: "An image is required to report an issue." });
            return;
        }

        // Find department + check duplicate in parallel
        const departmentName = CATEGORY_DEPARTMENT_MAP[category] || "General";
        const [department, existingTicketId] = await Promise.all([
            prisma.department.findFirst({
                where: { cityId, categoryType: category as IssueCategory },
            }),
            findDuplicateTicket(lat, lng, category as IssueCategory, cityId),
        ]);

        // Auto-create department if it doesn't exist
        const dept = department || await prisma.department.create({
            data: { name: departmentName, categoryType: category as IssueCategory, cityId },
        });

        let consolidatedTicketId: string;

        if (existingTicketId) {
            consolidatedTicketId = existingTicketId;
            // Increment reporters count on original post
            await prisma.issuePost.updateMany({
                where: { consolidatedTicketId: existingTicketId },
                data: { reporters: { increment: 1 } },
            });
        } else {
            const ticket = await prisma.consolidatedTicket.create({
                data: { departmentId: dept.id, cityId },
            });
            consolidatedTicketId = ticket.id;
        }

        const issuePost = await prisma.issuePost.create({
            data: {
                title, description, category: category as IssueCategory,
                location, lat, lng, image: imagePath,
                reportedById: userId, cityId, consolidatedTicketId,
            },
            include: {
                reportedBy: { select: { id: true, name: true, role: true } },
                city: { select: { id: true, name: true } },
            },
        });

        // Fire notifications in background — don't await
        createNotification(userId, "Issue Submitted", `Your report "${title}" has been sent to the ${departmentName} department.`, "info", issuePost.id).catch(() => { });
        notifyDepartmentUsers(dept.id, "New Issue Assigned", `A new ${category.toLowerCase()} issue has been reported at ${location}.`, issuePost.id).catch(() => { });

        res.status(201).json({
            message: existingTicketId
                ? "Your report has been submitted. A similar issue was already reported nearby — they have been linked."
                : `Your report has been sent to the ${departmentName} department.`,
            issue: issuePost,
            isDuplicate: !!existingTicketId,
        });
    } catch (error) {
        console.error("Report issue error:", error);
        res.status(500).json({ error: "Something went wrong. Please try again." });
    }
}

/**
 * GET /api/issues
 * List issues with filters.
 */
export async function getIssues(req: Request, res: Response): Promise<void> {
    try {
        const { cityId, category, status, search, page = "1", limit = "20" } = req.query;

        const where: any = {};
        if (cityId) where.cityId = cityId;
        if (category) where.category = category;
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { title: { contains: search as string, mode: "insensitive" } },
                { location: { contains: search as string, mode: "insensitive" } },
            ];
        }

        const pageNum = Math.max(1, parseInt(page as string, 10));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
        const skip = (pageNum - 1) * limitNum;

        const [issues, total] = await Promise.all([
            prisma.issuePost.findMany({
                where,
                include: {
                    reportedBy: { select: { id: true, name: true, role: true } },
                    city: { select: { id: true, name: true } },
                    _count: { select: { comments: true, upvotes: true } },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limitNum,
            }),
            prisma.issuePost.count({ where }),
        ]);

        res.json({ issues, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
    } catch (error) {
        console.error("Get issues error:", error);
        res.status(500).json({ error: "Something went wrong. Please try again." });
    }
}

/**
 * GET /api/issues/nearby
 */
export async function getNearbyIssues(req: Request, res: Response): Promise<void> {
    try {
        const { lat, lng, radius = "5000" } = req.query;
        if (!lat || !lng) {
            res.status(400).json({ error: "Latitude and longitude are required." });
            return;
        }

        const latNum = parseFloat(lat as string);
        const lngNum = parseFloat(lng as string);
        const radiusNum = parseFloat(radius as string);
        const latDelta = radiusNum / 111320;
        const lngDelta = radiusNum / (111320 * Math.cos(latNum * (Math.PI / 180)));

        const issues = await prisma.issuePost.findMany({
            where: {
                lat: { gte: latNum - latDelta, lte: latNum + latDelta },
                lng: { gte: lngNum - lngDelta, lte: lngNum + lngDelta },
            },
            select: {
                id: true, title: true, category: true, location: true, lat: true, lng: true,
                status: true, image: true, reporters: true, createdAt: true,
                _count: { select: { upvotes: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        res.json({ issues });
    } catch (error) {
        console.error("Get nearby issues error:", error);
        res.status(500).json({ error: "Something went wrong. Please try again." });
    }
}

/**
 * GET /api/issues/:id
 */
export async function getIssueById(req: Request, res: Response): Promise<void> {
    try {
        const id = req.params.id as string;

        const issue = await prisma.issuePost.findUnique({
            where: { id },
            include: {
                reportedBy: { select: { id: true, name: true, role: true, avatar: true } },
                city: { select: { id: true, name: true } },
                comments: {
                    include: { user: { select: { id: true, name: true, role: true, avatar: true } } },
                    orderBy: { createdAt: "asc" },
                },
                upvotes: { select: { userId: true } },
                consolidatedTicket: {
                    select: { id: true, status: true, proofImage: true, resolutionComment: true, escalatedAt: true, resolvedAt: true },
                },
            },
        });

        if (!issue) {
            res.status(404).json({ error: "Issue not found." });
            return;
        }

        res.json({ issue });
    } catch (error) {
        console.error("Get issue by ID error:", error);
        res.status(500).json({ error: "Something went wrong. Please try again." });
    }
}

/**
 * POST /api/issues/:id/upvote
 * Toggle upvote — single upsert/delete, no existence check.
 */
export async function toggleUpvote(req: Request, res: Response): Promise<void> {
    try {
        const issuePostId = req.params.id as string;
        const userId = req.user!.id;

        // Try to find and delete in one query
        const existing = await prisma.upvote.findUnique({
            where: { userId_issuePostId: { userId, issuePostId } },
            select: { id: true },
        });

        if (existing) {
            await prisma.upvote.delete({ where: { id: existing.id } });
            res.json({ message: "Upvote removed.", upvoted: false });
        } else {
            await prisma.upvote.create({ data: { userId, issuePostId } });
            res.json({ message: "Issue upvoted.", upvoted: true });
        }
    } catch (error: any) {
        // Handle case where issue doesn't exist (FK violation)
        if (error?.code === "P2003") {
            res.status(404).json({ error: "Issue not found." });
            return;
        }
        console.error("Toggle upvote error:", error);
        res.status(500).json({ error: "Something went wrong. Please try again." });
    }
}

/**
 * POST /api/issues/:id/comments
 * Add comment — skip existence check, let FK constraint handle it.
 */
export async function addComment(req: Request, res: Response): Promise<void> {
    try {
        const id = req.params.id as string;
        const validation = commentSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: validation.error.errors[0].message });
            return;
        }

        const { content } = validation.data;
        const userId = req.user!.id;
        const isDepartmentUpdate = req.user!.role === "department";
        const imagePath = req.file ? `/uploads/${req.file.filename}` : undefined;

        const comment = await prisma.comment.create({
            data: { content, image: imagePath, isDepartmentUpdate, userId, issuePostId: id },
            include: { user: { select: { id: true, name: true, role: true, avatar: true } } },
        });

        res.status(201).json({ message: "Comment added.", comment });
    } catch (error: any) {
        if (error?.code === "P2003") {
            res.status(404).json({ error: "Issue not found." });
            return;
        }
        console.error("Add comment error:", error);
        res.status(500).json({ error: "Something went wrong. Please try again." });
    }
}

/**
 * GET /api/issues/user/:userId
 */
export async function getUserIssues(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.params.userId as string;

        const issues = await prisma.issuePost.findMany({
            where: { reportedById: userId },
            include: {
                city: { select: { id: true, name: true } },
                _count: { select: { comments: true, upvotes: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        res.json({ issues });
    } catch (error) {
        console.error("Get user issues error:", error);
        res.status(500).json({ error: "Something went wrong. Please try again." });
    }
}
