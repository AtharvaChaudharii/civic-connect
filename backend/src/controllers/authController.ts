import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/db.js";
import { env } from "../config/env.js";
import { registerSchema, loginSchema } from "../utils/validators.js";
import { sendOtpEmail } from "../services/emailService.js";

/**
 * POST /api/auth/register
 * Register a new citizen user.
 */
export async function register(req: Request, res: Response): Promise<void> {
    try {
        const validation = registerSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: validation.error.errors[0].message });
            return;
        }

        const { name, email, password, city } = validation.data;

        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ error: "An account with this email already exists." });
            return;
        }

        // Find or create city
        let cityRecord = await prisma.city.findUnique({ where: { name: city } });
        if (!cityRecord) {
            cityRecord = await prisma.city.create({ data: { name: city } });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: "citizen",
                cityId: cityRecord.id,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                createdAt: true,
                city: { select: { id: true, name: true } },
            },
        });

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, cityId: user.city?.id || null, departmentId: null },
            env.JWT_SECRET,
            { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
        );

        res.status(201).json({
            message: "Account created successfully. Welcome to CivicConnect!",
            user,
            token,
        });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ error: "Something went wrong. Please try again." });
    }
}

/**
 * POST /api/auth/login
 * Login for all roles.
 */
export async function login(req: Request, res: Response): Promise<void> {
    try {
        const validation = loginSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: validation.error.errors[0].message });
            return;
        }

        const { email, password } = validation.data;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                city: { select: { id: true, name: true } },
                department: { select: { id: true, name: true } },
            },
        });

        if (!user) {
            res.status(401).json({ error: "Invalid email or password." });
            return;
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            res.status(401).json({ error: "Invalid email or password." });
            return;
        }

        // Generate JWT
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                cityId: user.cityId,
                departmentId: user.departmentId,
            },
            env.JWT_SECRET,
            { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
        );

        // Return user (without password)
        const { password: _pwd, ...userWithoutPassword } = user;

        res.json({
            message: "Login successful.",
            user: userWithoutPassword,
            token,
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Something went wrong. Please try again." });
    }
}

/**
 * GET /api/auth/me
 * Get current authenticated user.
 */
export async function getMe(req: Request, res: Response): Promise<void> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                createdAt: true,
                city: { select: { id: true, name: true } },
                department: { select: { id: true, name: true } },
            },
        });

        if (!user) {
            res.status(404).json({ error: "User not found." });
            return;
        }

        res.json({ user });
    } catch (error) {
        console.error("GetMe error:", error);
        res.status(500).json({ error: "Something went wrong. Please try again." });
    }
}

/**
 * POST /api/auth/forgot-password
 * Generate a 6-digit OTP and send it to the user's email.
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: "Email is required." });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        // Don't reveal whether the email exists — always return 200
        if (!user) {
            res.json({ message: "If that email is registered, an OTP has been sent." });
            return;
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await prisma.user.update({
            where: { email },
            data: { otpCode: otp, otpExpiresAt: expiresAt },
        });

        await sendOtpEmail(email, otp);

        res.json({ message: "If that email is registered, an OTP has been sent." });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ error: "Something went wrong. Please try again." });
    }
}

/**
 * POST /api/auth/verify-otp
 * Verify the 6-digit OTP for password reset.
 */
export async function verifyOtp(req: Request, res: Response): Promise<void> {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            res.status(400).json({ error: "Email and OTP are required." });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.otpCode || !user.otpExpiresAt) {
            res.status(400).json({ error: "Invalid or expired OTP." });
            return;
        }

        if (user.otpCode !== otp) {
            res.status(400).json({ error: "Incorrect OTP. Please try again." });
            return;
        }

        if (new Date() > user.otpExpiresAt) {
            res.status(400).json({ error: "OTP has expired. Please request a new one." });
            return;
        }

        // OTP valid — issue a short-lived reset token (we reuse the otp itself as the token for simplicity)
        res.json({ message: "OTP verified.", resetToken: otp });
    } catch (error) {
        console.error("Verify OTP error:", error);
        res.status(500).json({ error: "Something went wrong. Please try again." });
    }
}

/**
 * POST /api/auth/reset-password
 * Reset the user's password after OTP verification.
 */
export async function resetPassword(req: Request, res: Response): Promise<void> {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            res.status(400).json({ error: "Email, OTP, and new password are required." });
            return;
        }
        if (newPassword.length < 6) {
            res.status(400).json({ error: "Password must be at least 6 characters." });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.otpCode || !user.otpExpiresAt) {
            res.status(400).json({ error: "Invalid or expired OTP." });
            return;
        }
        if (user.otpCode !== otp || new Date() > user.otpExpiresAt) {
            res.status(400).json({ error: "Invalid or expired OTP." });
            return;
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password and clear OTP
        await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
                otpCode: null,
                otpExpiresAt: null,
            },
        });

        res.json({ message: "Password reset successfully. You can now log in." });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ error: "Something went wrong. Please try again." });
    }
}
