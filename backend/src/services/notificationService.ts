import prisma from "../config/db.js";

type NotificationType = "info" | "success" | "warning" | "error";

/**
 * Create a notification for a single user.
 */
export async function createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = "info",
    issueId?: string
) {
    return prisma.notification.create({
        data: { userId, title, message, type, issueId },
    });
}

/**
 * Notify all reporters of an issue post about a status change.
 * Optimised: single createMany instead of N individual creates.
 */
export async function notifyIssueReporters(
    consolidatedTicketId: string,
    title: string,
    message: string,
    type: NotificationType = "info"
) {
    // Find all issue posts linked to this ticket in one query
    const posts = await prisma.issuePost.findMany({
        where: { consolidatedTicketId },
        select: { id: true, reportedById: true },
    });

    if (posts.length === 0) return;

    // Bulk insert — single round-trip to DB
    return prisma.notification.createMany({
        data: posts.map((post: { id: string; reportedById: string }) => ({
            userId: post.reportedById,
            title,
            message,
            type,
            issueId: post.id,
        })),
        skipDuplicates: true,
    });
}

/**
 * Notify department users about new issue assignments.
 * Optimised: single createMany instead of N individual creates.
 */
export async function notifyDepartmentUsers(
    departmentId: string,
    title: string,
    message: string,
    issueId?: string
) {
    const deptUsers = await prisma.user.findMany({
        where: { departmentId, role: "department" },
        select: { id: true },
    });

    if (deptUsers.length === 0) return;

    return prisma.notification.createMany({
        data: deptUsers.map((user: { id: string }) => ({
            userId: user.id,
            title,
            message,
            type: "info" as NotificationType,
            issueId,
        })),
        skipDuplicates: true,
    });
}

/**
 * Notify municipal corporation users about escalations.
 * Optimised: single createMany instead of N individual creates.
 */
export async function notifyMunicipalUsers(
    cityId: string,
    title: string,
    message: string,
    type: NotificationType = "error",
    issueId?: string
) {
    const municipalUsers = await prisma.user.findMany({
        where: { cityId, role: "municipal" },
        select: { id: true },
    });

    if (municipalUsers.length === 0) return;

    return prisma.notification.createMany({
        data: municipalUsers.map((user: { id: string }) => ({
            userId: user.id,
            title,
            message,
            type,
            issueId,
        })),
        skipDuplicates: true,
    });
}
