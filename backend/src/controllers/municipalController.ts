import type { Request, Response } from "express";
import prisma from "../config/db.js";

/**
 * GET /api/municipal/overview
 * City-level overview dashboard with stats breakdown by department and status.
 */
export async function getCityOverview(req: Request, res: Response): Promise<void> {
    try {
        const cityId = req.user!.cityId;
        if (!cityId) {
            res.status(403).json({ error: "Your account is not associated with a city." });
            return;
        }

        // Total issues in city
        const [total, pending, ongoing, resolved, escalated] = await Promise.all([
            prisma.issuePost.count({ where: { cityId } }),
            prisma.issuePost.count({ where: { cityId, status: "Pending" } }),
            prisma.issuePost.count({ where: { cityId, status: "Ongoing" } }),
            prisma.issuePost.count({ where: { cityId, status: "Resolved" } }),
            prisma.issuePost.count({ where: { cityId, status: "Escalated" } }),
        ]);

        // Department-wise breakdown
        const departments = await prisma.department.findMany({
            where: { cityId },
            include: {
                _count: { select: { consolidatedTickets: true } },
            },
        });

        const departmentStats = await Promise.all(
            departments.map(async (dept: { id: string; name: string; categoryType: string }) => {
                const [deptTotal, deptPending, deptOngoing, deptResolved, deptEscalated] = await Promise.all([
                    prisma.consolidatedTicket.count({ where: { departmentId: dept.id, cityId } }),
                    prisma.consolidatedTicket.count({ where: { departmentId: dept.id, cityId, status: "Pending" } }),
                    prisma.consolidatedTicket.count({ where: { departmentId: dept.id, cityId, status: "Ongoing" } }),
                    prisma.consolidatedTicket.count({ where: { departmentId: dept.id, cityId, status: "Resolved" } }),
                    prisma.consolidatedTicket.count({ where: { departmentId: dept.id, cityId, status: "Escalated" } }),
                ]);

                return {
                    department: dept.name,
                    departmentId: dept.id,
                    categoryType: dept.categoryType,
                    total: deptTotal,
                    pending: deptPending,
                    ongoing: deptOngoing,
                    resolved: deptResolved,
                    escalated: deptEscalated,
                };
            })
        );

        // Get city info
        const city = await prisma.city.findUnique({ where: { id: cityId }, select: { name: true } });

        res.json({
            city: city?.name || "Unknown",
            overview: { total, pending, ongoing, resolved, escalated },
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
 */
export async function getDepartmentPerformance(req: Request, res: Response): Promise<void> {
    try {
        const cityId = req.user!.cityId;
        if (!cityId) {
            res.status(403).json({ error: "Your account is not associated with a city." });
            return;
        }

        const departments = await prisma.department.findMany({
            where: { cityId },
        });

        const stats = await Promise.all(
            departments.map(async (dept: { id: string; name: string; categoryType: string }) => {
                const [total, resolved, escalated] = await Promise.all([
                    prisma.consolidatedTicket.count({ where: { departmentId: dept.id } }),
                    prisma.consolidatedTicket.count({ where: { departmentId: dept.id, status: "Resolved" } }),
                    prisma.consolidatedTicket.count({ where: { departmentId: dept.id, status: "Escalated" } }),
                ]);

                // Avg resolution time
                const resolvedTickets = await prisma.consolidatedTicket.findMany({
                    where: { departmentId: dept.id, status: "Resolved", resolvedAt: { not: null } },
                    select: { createdAt: true, resolvedAt: true },
                });

                let avgResolutionDays = 0;
                if (resolvedTickets.length > 0) {
                    const totalDays = resolvedTickets.reduce((sum: number, t: { resolvedAt: Date | null; createdAt: Date }) => {
                        const diff = (t.resolvedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24);
                        return sum + diff;
                    }, 0);
                    avgResolutionDays = Math.round((totalDays / resolvedTickets.length) * 10) / 10;
                }

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
            })
        );

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
 */
export async function exportReport(req: Request, res: Response): Promise<void> {
    try {
        const cityId = req.user!.cityId;
        if (!cityId) {
            res.status(403).json({ error: "Your account is not associated with a city." });
            return;
        }

        const city = await prisma.city.findUnique({ where: { id: cityId }, select: { name: true } });

        // Gather all data
        const [total, resolved, pending, ongoing, escalated] = await Promise.all([
            prisma.consolidatedTicket.count({ where: { cityId } }),
            prisma.consolidatedTicket.count({ where: { cityId, status: "Resolved" } }),
            prisma.consolidatedTicket.count({ where: { cityId, status: "Pending" } }),
            prisma.consolidatedTicket.count({ where: { cityId, status: "Ongoing" } }),
            prisma.consolidatedTicket.count({ where: { cityId, status: "Escalated" } }),
        ]);

        // Department breakdown
        const departments = await prisma.department.findMany({ where: { cityId } });
        const deptBreakdown = await Promise.all(
            departments.map(async (dept: { id: string; name: string }) => {
                const count = await prisma.consolidatedTicket.count({ where: { departmentId: dept.id } });
                return { department: dept.name, count };
            })
        );

        const { format } = req.query;

        if (format === "csv") {
            // Generate CSV
            let csv = "Metric,Value\n";
            csv += `City,${city?.name}\n`;
            csv += `Total Issues,${total}\n`;
            csv += `Resolved,${resolved}\n`;
            csv += `Pending,${pending}\n`;
            csv += `Ongoing,${ongoing}\n`;
            csv += `Escalated,${escalated}\n\n`;
            csv += "Department,Ticket Count\n";
            deptBreakdown.forEach((d: { department: string; count: number }) => {
                csv += `${d.department},${d.count}\n`;
            });

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
