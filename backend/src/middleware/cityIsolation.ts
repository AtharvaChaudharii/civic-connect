import type { Request, Response, NextFunction } from "express";

/**
 * City isolation middleware.
 * Ensures department and municipal users can only access data from their own city.
 * Citizens can view issues across cities (but only report in their own city).
 */
export function cityIsolation(req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
        res.status(401).json({ error: "Authentication required." });
        return;
    }

    // Department and Municipal users MUST have a city
    if ((req.user.role === "department" || req.user.role === "municipal") && !req.user.cityId) {
        res.status(403).json({ error: "Your account is not associated with a city." });
        return;
    }

    // Inject cityId into request for downstream use
    // For department/municipal users, force city filter
    if (req.user.role === "department" || req.user.role === "municipal") {
        req.query.cityId = req.user.cityId!;
    }

    next();
}
