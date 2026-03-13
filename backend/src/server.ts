import express from "express";
import cors from "cors";
import compression from "compression";
import { createServer } from "http";
import { env } from "./config/env.js";
import { initSocket } from "./config/socket.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { startEscalationJob } from "./jobs/escalationJob.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import issueRoutes from "./routes/issueRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import municipalRoutes from "./routes/municipalRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

// ── App Setup ──
const app = express();
const httpServer = createServer(app);

// ── Socket.IO ──
initSocket(httpServer);

// ── Middleware ──
// Compression must come before other middleware
app.use(compression());
app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health Check ──
app.get("/api/health", (_req, res) => {
    res.json({
        status: "ok",
        service: "CivicConnect API",
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
    });
});

// ── API Routes ──
app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/municipal", municipalRoutes);
app.use("/api/notifications", notificationRoutes);

// ── Error Handler ──
app.use(errorHandler);

// ── Start Server ──
httpServer.listen(env.PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║     CivicConnect API Server              ║
║     Port: ${String(env.PORT).padEnd(29)}║
║     Env:  ${String(env.NODE_ENV).padEnd(29)}║
╚══════════════════════════════════════════╝
  `);

    // Start background jobs
    startEscalationJob();
});

export default app;
