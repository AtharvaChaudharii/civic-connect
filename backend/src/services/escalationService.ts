import prisma from "../config/db.js";
import { ESCALATION_DAYS } from "../config/env.js";
import { notifyMunicipalUsers, notifyIssueReporters } from "./notificationService.js";

/**
 * Escalation Service.
 * Find all consolidated tickets that:
 * - Status is NOT Resolved
 * - Created more than 7 days ago
 * - Not already escalated
 *
 * Then mark them as Escalated and notify the Municipal Corporation.
 */
export async function runEscalation(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - ESCALATION_DAYS);

    // Find tickets eligible for escalation
    const tickets = await prisma.consolidatedTicket.findMany({
        where: {
            status: { in: ["Pending", "Ongoing"] },
            escalationFlag: false,
            createdAt: { lt: cutoffDate },
        },
        include: {
            department: { include: { city: true } },
            issuePosts: { select: { id: true, title: true, reportedById: true } },
        },
    });

    if (tickets.length === 0) {
        return 0;
    }

    let escalatedCount = 0;

    for (const ticket of tickets) {
        // Update ticket
        await prisma.consolidatedTicket.update({
            where: { id: ticket.id },
            data: {
                status: "Escalated",
                escalationFlag: true,
                escalatedAt: new Date(),
            },
        });

        // Update all linked issue posts
        await prisma.issuePost.updateMany({
            where: { consolidatedTicketId: ticket.id },
            data: {
                status: "Escalated",
                updatedAt: new Date(),
            },
        });

        // Build notification messages
        const issueTitle = ticket.issuePosts[0]?.title || "Unknown Issue";
        const deptName = ticket.department.name;
        const cityName = ticket.department.city.name;

        // Notify Municipal Corporation
        await notifyMunicipalUsers(
            ticket.cityId,
            "Escalation Alert",
            `"${issueTitle}" has been escalated. The ${deptName} department has not responded for ${ESCALATION_DAYS} days.`,
            "error",
            ticket.issuePosts[0]?.id
        );

        // Notify reporters
        await notifyIssueReporters(
            ticket.id,
            "Issue Escalated",
            `"${issueTitle}" in ${cityName} has been escalated to the Municipal Corporation after ${ESCALATION_DAYS} days without resolution.`,
            "warning"
        );

        escalatedCount++;
    }

    return escalatedCount;
}
