import type { Request, Response } from "express";
import prisma from "../config/db.js";

/**
 * GET /api/municipal/overview
 * City-level overview dashboard with stats breakdown by department and status.
 * Optimised: single groupBy query instead of N+1 count queries.
 */
export async function getCityOverview(req: Request, res: Response): Promise<void> {
    try {
        const cityId = req.user!.cityId;
        if (!cityId) {
            res.status(403).json({ error: "Your account is not associated with a city." });
            return;
        }

        // Fetch city info, issue status counts, and dept ticket counts — all in parallel
        const [city, issueStatusGroups, deptTicketGroups, departments] = await Promise.all([
            prisma.city.findUnique({ where: { id: cityId }, select: { name: true } }),
            // Single groupBy instead of 5 separate counts
            prisma.issuePost.groupBy({
                by: ["status"],
                where: { cityId },
                _count: { _all: true },
            }),
            // Single groupBy for ticket counts per dept per status
            prisma.consolidatedTicket.groupBy({
                by: ["departmentId", "status"],
                where: { cityId },
                _count: { _all: true },
            }),
            prisma.department.findMany({
                where: { cityId },
                select: { id: true, name: true, categoryType: true },
            }),
        ]);

        // Build overview from groupBy results
        const overview = { total: 0, pending: 0, ongoing: 0, resolved: 0, escalated: 0 };
        for (const g of issueStatusGroups) {
            const count = g._count._all;
            overview.total += count;
            if (g.status === "Pending") overview.pending = count;
            else if (g.status === "Ongoing") overview.ongoing = count;
            else if (g.status === "Resolved") overview.resolved = count;
            else if (g.status === "Escalated") overview.escalated = count;
        }

        // Index ticket group counts by departmentId+status
        type TicketGroup = { departmentId: string; status: string; _count: { _all: number } };
        const ticketIndex = new Map<string, number>();
        for (const g of deptTicketGroups as TicketGroup[]) {
            const key = `${g.departmentId}:${g.status}`;
            ticketIndex.set(key, g._count._all);
        }

        const getCount = (deptId: string, status: string) =>
            ticketIndex.get(`${deptId}:${status}`) ?? 0;

        const departmentStats = departments.map((dept) => {
            const deptPending = getCount(dept.id, "Pending");
            const deptOngoing = getCount(dept.id, "Ongoing");
            const deptResolved = getCount(dept.id, "Resolved");
            const deptEscalated = getCount(dept.id, "Escalated");
            return {
                department: dept.name,
                departmentId: dept.id,
                categoryType: dept.categoryType,
                total: deptPending + deptOngoing + deptResolved + deptEscalated,
                pending: deptPending,
                ongoing: deptOngoing,
                resolved: deptResolved,
                escalated: deptEscalated,
            };
        });

        res.json({
            city: city?.name || "Unknown",
            overview,
            departments: departmentStats,
        });
    } catch (error) {
        console.error("Get city overview error:", error);
        res.status(500).json({ error: "Something went wrong. Please try again." });
    }
}

/**
 * GET /api/municipal/departments
 * Department-wise performance stats.
 * Optimised: groupBy replaces N+1 count loops; single resolved-tickets fetch.
 */
export async function getDepartmentPerformance(req: Request, res: Response): Promise<void> {
    try {
        const cityId = req.user!.cityId;
        if (!cityId) {
            res.status(403).json({ error: "Your account is not associated with a city." });
            return;
        }

        const [departments, ticketGroups, resolvedTickets] = await Promise.all([
            prisma.department.findMany({
                where: { cityId },
                select: { id: true, name: true, categoryType: true },
            }),
            // One groupBy replaces 3N count queries
            prisma.consolidatedTicket.groupBy({
                by: ["departmentId", "status"],
                where: { cityId },
                _count: { _all: true },
            }),
            // Fetch all resolved tickets with timing info in one query
            prisma.consolidatedTicket.findMany({
                where: { cityId, status: "Resolved", resolvedAt: { not: null } },
                select: { departmentId: true, createdAt: true, resolvedAt: true },
            }),
        ]);

        // Index ticket counts
        type TicketGroup = { departmentId: string; status: string; _count: { _all: number } };
        const ticketIndex = new Map<string, number>();
        for (const g of ticketGroups as TicketGroup[]) {
            ticketIndex.set(`${g.departmentId}:${g.status}`, g._count._all);
        }

        // Index resolution times per department
        type ResTicket = { departmentId: string; createdAt: Date; resolvedAt: Date | null };
        const resolutionMap = new Map<string, number[]>();
        for (const t of resolvedTickets as ResTicket[]) {
            const days = (t.resolvedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24);
            const arr = resolutionMap.get(t.departmentId) ?? [];
            arr.push(days);
            resolutionMap.set(t.departmentId, arr);
        }

        const getCount = (deptId: string, status: string) =>
            ticketIndex.get(`${deptId}:${status}`) ?? 0;

        const stats = departments.map((dept) => {
            const total =
                getCount(dept.id, "Pending") +
                getCount(dept.id, "Ongoing") +
                getCount(dept.id, "Resolved") +
                getCount(dept.id, "Escalated");
            const resolved = getCount(dept.id, "Resolved");
            const escalated = getCount(dept.id, "Escalated");

            const days = resolutionMap.get(dept.id) ?? [];
            const avgResolutionDays =
                days.length > 0
                    ? Math.round((days.reduce((s, d) => s + d, 0) / days.length) * 10) / 10
                    : 0;

            return {
                department: dept.name,
                departmentId: dept.id,
                categoryType: dept.categoryType,
                total,
                resolved,
                escalated,
                resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
                avgResolutionDays,
            };
        });

        res.json({ departments: stats });
    } catch (error) {
        console.error("Get department performance error:", error);
        res.status(500).json({ error: "Something went wrong. Please try again." });
    }
}

/**
 * GET /api/municipal/escalations
 * All escalated issues in the city.
 */
export async function getEscalations(req: Request, res: Response): Promise<void> {
    try {
        const cityId = req.user!.cityId;
        if (!cityId) {
            res.status(403).json({ error: "Your account is not associated with a city." });
            return;
        }

        const escalatedTickets = await prisma.consolidatedTicket.findMany({
            where: { cityId, status: "Escalated" },
            include: {
                department: { select: { id: true, name: true } },
                issuePosts: {
                    select: {
                        id: true,
                        title: true,
                        location: true,
                        category: true,
                        reporters: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: "asc" },
                    take: 1, // just the original post
                },
            },
            orderBy: { escalatedAt: "desc" },
        });

        res.json({ escalations: escalatedTickets });
    } catch (error) {
        console.error("Get escalations error:", error);
        res.status(500).json({ error: "Something went wrong. Please try again." });
    }
}

/**
 * GET /api/municipal/reports/export
 * Generate city report data (CSV export format).
 * Optimised: groupBy replaces 5 + N individual count queries.
 */
export async function exportReport(req: Request, res: Response): Promise<void> {
    try {
        const cityId = req.user!.cityId;
        if (!cityId) {
            res.status(403).json({ error: "Your account is not associated with a city." });
            return;
        }

        const [city, statusGroups, deptGroups, departments] = await Promise.all([
            prisma.city.findUnique({ where: { id: cityId }, select: { name: true } }),
            // One groupBy replaces 5 separate counts
            prisma.consolidatedTicket.groupBy({
                by: ["status"],
                where: { cityId },
                _count: { _all: true },
            }),
            // One groupBy replaces N per-department counts
            prisma.consolidatedTicket.groupBy({
                by: ["departmentId"],
                where: { cityId },
                _count: { _all: true },
            }),
            prisma.department.findMany({
                where: { cityId },
                select: { id: true, name: true },
            }),
        ]);

        // Build totals from status groups
        type StatusGroup = { status: string; _count: { _all: number } };
        const statusMap = new Map<string, number>();
        let total = 0;
        for (const g of statusGroups as StatusGroup[]) {
            statusMap.set(g.status, g._count._all);
            total += g._count._all;
        }
        const resolved = statusMap.get("Resolved") ?? 0;
        const pending = statusMap.get("Pending") ?? 0;
        const ongoing = statusMap.get("Ongoing") ?? 0;
        const escalated = statusMap.get("Escalated") ?? 0;

        // Build dept breakdown
        type DeptGroup = { departmentId: string; _count: { _all: number } };
        const deptCountMap = new Map<string, number>();
        for (const g of deptGroups as DeptGroup[]) {
            deptCountMap.set(g.departmentId, g._count._all);
        }
        const deptBreakdown = departments.map((d) => ({
            department: d.name,
            count: deptCountMap.get(d.id) ?? 0,
        }));

        const { format } = req.query;

        if (format === "csv") {
            let csv = "Metric,Value\n";
            csv += `City,${city?.name}\n`;
            csv += `Total Issues,${total}\n`;
            csv += `Resolved,${resolved}\n`;
            csv += `Pending,${pending}\n`;
            csv += `Ongoing,${ongoing}\n`;
            csv += `Escalated,${escalated}\n\n`;
            csv += "Department,Ticket Count\n";
            deptBreakdown.forEach((d) => { csv += `${d.department},${d.count}\n`; });

            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", `attachment; filename=${city?.name || "city"}-report.csv`);
            res.send(csv);
        } else {
            res.json({
                city: city?.name,
                report: { total, resolved, pending, ongoing, escalated },
                departmentBreakdown: deptBreakdown,
                generatedAt: new Date().toISOString(),
            });
        }
    } catch (error) {
        console.error("Export report error:", error);
        res.status(500).json({ error: "Something went wrong. Please try again." });
    }
}
