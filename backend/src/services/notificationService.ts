import prisma from "../config/db.js";

type NotificationType = "info" | "success" | "warning" | "error";

/**
 * Create a notification for a user.
 */
export async function createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = "info",
    issueId?: string
) {
    return prisma.notification.create({
        data: {
            userId,
            title,
            message,
            type,
            issueId,
        },
    });
}

/**
 * Notify all reporters of an issue post about a status change.
 */
export async function notifyIssueReporters(
    consolidatedTicketId: string,
    title: string,
    message: string,
    type: NotificationType = "info"
) {
    // Find all issue posts linked to this ticket
    const posts = await prisma.issuePost.findMany({
        where: { consolidatedTicketId },
        select: { id: true, reportedById: true },
    });

    // Create notifications for each reporter
    const notifications = posts.map((post: { id: string; reportedById: string }) =>
        createNotification(post.reportedById, title, message, type, post.id)
    );

    return Promise.all(notifications);
}

/**
 * Notify department users about new issue assignments.
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

    const notifications = deptUsers.map((user: { id: string }) =>
        createNotification(user.id, title, message, "info", issueId)
    );

    return Promise.all(notifications);
}

/**
 * Notify municipal corporation users about escalations.
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

    const notifications = municipalUsers.map((user: { id: string }) =>
        createNotification(user.id, title, message, type, issueId)
    );

    return Promise.all(notifications);
}
