import { Router } from "express";
import {
    reportIssue,
    getIssues,
    getNearbyIssues,
    getIssueById,
    toggleUpvote,
    addComment,
    getUserIssues,
} from "../controllers/issueController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { upload, uploadToCloudinary } from "../middleware/upload.js";

const router = Router();

// All issue routes require authentication
router.use(authenticate);

// Citizen reports an issue
router.post("/", authorize("citizen"), upload.single("image"), uploadToCloudinary, reportIssue);

// List issues (all authenticated users can view)
router.get("/", getIssues);

// Nearby issues
router.get("/nearby", getNearbyIssues);

// User's own issues
router.get("/user/:userId", getUserIssues);

// Issue detail
router.get("/:id", getIssueById);

// Upvote
router.post("/:id/upvote", authorize("citizen"), toggleUpvote);

// Add comment (with optional image)
router.post("/:id/comments", upload.single("image"), uploadToCloudinary, addComment);

export default router;
