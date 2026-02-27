import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/db.js";
import { env } from "../config/env.js";
import { registerSchema, loginSchema } from "../utils/validators.js";

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
