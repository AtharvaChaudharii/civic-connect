import { Router } from "express";
import {
    getCityOverview,
    getDepartmentPerformance,
    getEscalations,
    exportReport,
    getReportAnalytics,
} from "../controllers/municipalController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { cityIsolation } from "../middleware/cityIsolation.js";

const router = Router();

// All municipal routes require municipal authentication + city isolation
router.use(authenticate, authorize("municipal"), cityIsolation);

// City overview dashboard
router.get("/overview", getCityOverview);

// Department performance
router.get("/departments", getDepartmentPerformance);

// Escalated issues
router.get("/escalations", getEscalations);

// Report analytics (charts, trends, insights)
router.get("/reports/analytics", getReportAnalytics);

// Export report (CSV or JSON)
router.get("/reports/export", exportReport);

export default router;
