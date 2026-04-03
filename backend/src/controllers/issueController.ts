import type { Request, Response } from "express";
import prisma from "../config/db.js";
import { reportIssueSchema, commentSchema } from "../utils/validators.js";
import { CATEGORY_DEPARTMENT_MAP } from "../config/env.js";
import { findDuplicateTicket } from "../services/duplicateDetection.js";
import { notifyDepartmentUsers, createNotification } from "../services/notificationService.js";
import { emitIssueCreated, emitIssueUpvoted, emitIssueCommented } from "../services/socketEvents.js";
import { sendIssueConfirmationEmail } from "../services/emailService.js";

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

        const imagePath = req.file ? req.file.path : "";
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

        // Real-time: broadcast new issue to the city
        emitIssueCreated(cityId, issuePost as unknown as Record<string, unknown>);

        // Email confirmation to citizen (fire-and-forget — never block the response)
        const userEmail = req.user!.email;
        sendIssueConfirmationEmail({
            to: userEmail,
            issueTitle: title,
            description,
            location,
            imageUrl: imagePath || undefined,
        }).catch(() => { });

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
 * Optimised: explicit select to avoid fetching unused columns; enforced pagination.
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
        // Cap at 100 per page (higher limit for admin/map use-cases)
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
        const skip = (pageNum - 1) * limitNum;

        const [issues, total] = await Promise.all([
            prisma.issuePost.findMany({
                where,
                select: {
                    id: true,
                    title: true,
                    description: true,
                    category: true,
                    location: true,
                    lat: true,
                    lng: true,
                    image: true,
                    status: true,
                    reporters: true,
                    createdAt: true,
                    updatedAt: true,
                    consolidatedTicketId: true,
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
            select: {
                id: true,
                title: true,
                description: true,
                category: true,
                location: true,
                lat: true,
                lng: true,
                status: true,
                image: true,
                reporters: true,
                createdAt: true,
                updatedAt: true,
                reportedBy: { select: { id: true, name: true, role: true, avatar: true } },
                city: { select: { id: true, name: true } },
                comments: {
                    select: {
                        id: true,
                        content: true,
                        image: true,
                        isDepartmentUpdate: true,
                        createdAt: true,
                        user: { select: { id: true, name: true, role: true, avatar: true } },
                    },
                    orderBy: { createdAt: "asc" },
                    take: 50, // Limit comments to 50 most recent
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
 * Toggle upvote — atomic: try create, if unique constraint fires then delete.
 * Saves one extra SELECT round-trip vs find-then-act.
 */
export async function toggleUpvote(req: Request, res: Response): Promise<void> {
    try {
        const issuePostId = req.params.id as string;
        const userId = req.user!.id;

        try {
            // Optimistic create — will throw P2002 if already upvoted
            await prisma.upvote.create({ data: { userId, issuePostId } });
            emitIssueUpvoted(issuePostId, { issueId: issuePostId, userId, upvoted: true });
            res.json({ message: "Issue upvoted.", upvoted: true });
        } catch (createError: any) {
            if (createError?.code === "P2002") {
                // Already upvoted → delete (toggle off)
                await prisma.upvote.delete({
                    where: { userId_issuePostId: { userId, issuePostId } },
                });
                emitIssueUpvoted(issuePostId, { issueId: issuePostId, userId, upvoted: false });
                res.json({ message: "Upvote removed.", upvoted: false });
            } else {
                throw createError;
            }
        }
    } catch (error: any) {
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
        const imagePath = req.file ? req.file.path : undefined;

        const comment = await prisma.comment.create({
            data: { content, image: imagePath, isDepartmentUpdate, userId, issuePostId: id },
            include: { user: { select: { id: true, name: true, role: true, avatar: true } } },
        });

        // Real-time: broadcast comment to everyone viewing this issue
        emitIssueCommented(id, comment as unknown as Record<string, unknown>);

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
 * Optimised: select only needed fields; add pagination.
 */
export async function getUserIssues(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.params.userId as string;
        const { page = "1", limit = "20", search, status } = req.query;

        const pageNum = Math.max(1, parseInt(page as string, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
        const skip = (pageNum - 1) * limitNum;

        const where: Record<string, unknown> = { reportedById: userId };
        if (status && status !== "All Status") where.status = status as string;
        if (search && (search as string).trim()) {
            where.OR = [
                { title: { contains: (search as string).trim(), mode: "insensitive" } },
                { location: { contains: (search as string).trim(), mode: "insensitive" } },
            ];
        }

        const [issues, total] = await Promise.all([
            prisma.issuePost.findMany({
                where,
                select: {
                    id: true,
                    title: true,
                    description: true,
                    category: true,
                    location: true,
                    image: true,
                    status: true,
                    reporters: true,
                    createdAt: true,
                    updatedAt: true,
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
        console.error("Get user issues error:", error);
        res.status(500).json({ error: "Something went wrong. Please try again." });
    }
}

/**
 * GET /api/issues/map
 * Lightweight geo-only data for map rendering.
 * Returns ALL issues for a city (no pagination cap) with minimal fields.
 * Used by admin overview, departments, escalations pages.
 */
export async function getMapIssues(req: Request, res: Response): Promise<void> {
    try {
        const { cityId, category, status, department } = req.query;

        const where: any = {};
        if (cityId) where.cityId = cityId;
        if (category) where.category = category;
        if (status) where.status = status;
        if (department) {
            // Filter by department via consolidated ticket
            where.consolidatedTicket = { departmentId: department };
        }

        const issues = await prisma.issuePost.findMany({
            where,
            select: {
                id: true,
                title: true,
                category: true,
                location: true,
                lat: true,
                lng: true,
                status: true,
                reporters: true,
                createdAt: true,
                consolidatedTicket: {
                    select: {
                        departmentId: true,
                        department: { select: { name: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 500, // Hard cap at 500 for performance
        });

        res.json({ issues });
    } catch (error) {
        console.error("Get map issues error:", error);
        res.status(500).json({ error: "Something went wrong. Please try again." });
    }
}

/**
 * GET /api/issues/:id/comments
 * Paginated comments for an issue post.
 * Supports cursor-based pagination via `cursor` query param.
 */
export async function getComments(req: Request, res: Response): Promise<void> {
    try {
        const issuePostId = req.params.id as string;
        const { cursor, limit = "20" } = req.query;
        const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));

        const where: any = { issuePostId };
        const options: any = {
            where,
            select: {
                id: true,
                content: true,
                image: true,
                isDepartmentUpdate: true,
                createdAt: true,
                user: { select: { id: true, name: true, role: true, avatar: true } },
            },
            orderBy: { createdAt: "asc" },
            take: limitNum,
        };

        if (cursor) {
            options.skip = 1; // skip the cursor itself
            options.cursor = { id: cursor as string };
        }

        const comments = await prisma.comment.findMany(options);

        const nextCursor = comments.length === limitNum ? comments[comments.length - 1].id : null;

        // Also get total count for display
        const total = await prisma.comment.count({ where: { issuePostId } });

        res.json({
            comments,
            pagination: {
                nextCursor,
                total,
                hasMore: nextCursor !== null,
            },
        });
    } catch (error) {
        console.error("Get comments error:", error);
        res.status(500).json({ error: "Something went wrong. Please try again." });
    }
}
