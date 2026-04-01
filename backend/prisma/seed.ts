/**
 * Seed script — creates all department demo accounts for Pune city.
 * Run with:  npx tsx prisma/seed.ts
 *
 * Safe to run multiple times (upserts).
 *
 * Schema: Department has (cityId, categoryType) as unique key.
 * Each IssueCategory → 1 Department → 1 demo login.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// Auto-derive direct (non-pooler) URL from pooler URL
let datasourceUrl = (process.env.DIRECT_URL || process.env.DATABASE_URL || "").replace(/-pooler\./, ".");
if (!datasourceUrl) { console.error("❌ No DATABASE_URL found in .env"); process.exit(1); }

// Add generous timeouts for Neon cold-start wake-up (can take 5-10s)
const url = new URL(datasourceUrl);
url.searchParams.set("connect_timeout", "30");
url.searchParams.set("pool_timeout", "60");
datasourceUrl = url.toString();

const isPooler = datasourceUrl.includes("-pooler.");
console.log(`🔌 Connecting via: ${isPooler ? "pooler ⚠️" : "direct ✅"}`);
console.log(`⏳ Waiting for Neon to wake up (cold start may take ~10s)…\n`);

const prisma = new PrismaClient({ datasourceUrl });

// Retry helper for Neon cold-start
async function withRetry<T>(fn: () => Promise<T>, retries = 5, delayMs = 5000): Promise<T> {
    for (let i = 1; i <= retries; i++) {
        try {
            return await fn();
        } catch (e: any) {
            if (i === retries) throw e;
            console.log(`  ⟳ Connection attempt ${i} failed — retrying in ${delayMs / 1000}s… (${e.message?.slice(0, 60)})`);
            await new Promise(r => setTimeout(r, delayMs));
        }
    }
    throw new Error("unreachable");
}


// IssueCategory enum values from schema
type IssueCategory = "Garbage" | "Pothole" | "WaterOverflow" | "StreetLight" | "Drainage" | "Footpath" | "Other";

// Maps each category to a human-readable department name and demo user
const DEPT_CONFIG: {
    categoryType: IssueCategory;
    name: string;
    email: string;
    userName: string;
}[] = [
    { categoryType: "Garbage",       name: "Sanitation",              email: "sanitation@pune.gov.in",  userName: "Sanitation Officer"      },
    { categoryType: "Pothole",       name: "Roads & Infrastructure",  email: "roads@pune.gov.in",       userName: "Roads Officer"           },
    { categoryType: "WaterOverflow", name: "Water Supply",            email: "water@pune.gov.in",       userName: "Water Supply Officer"    },
    { categoryType: "StreetLight",   name: "Electrical",              email: "electrical@pune.gov.in",  userName: "Electrical Officer"      },
    { categoryType: "Drainage",      name: "Drainage",                email: "drainage@pune.gov.in",    userName: "Drainage Officer"        },
    { categoryType: "Footpath",      name: "Roads & Infrastructure (Footpath)", email: "footpath@pune.gov.in", userName: "Footpath Officer"  },
    { categoryType: "Other",         name: "General",                 email: "general@pune.gov.in",     userName: "General Officer"         },
];

async function main() {
    console.log("🌱 Seeding CivicTrack demo accounts…\n");

    // 1. Ensure Pune city exists — wrapped in retry for Neon cold-start
    const pune = await withRetry(() => prisma.city.upsert({
        where: { name: "Pune" },
        update: {},
        create: { name: "Pune" },
    }));
    console.log(`✅ City: Pune (${pune.id})`);

    // 2. Hash password once
    const hashedPwd = await bcrypt.hash("password123", 12);

    // 3. Ensure citizen demo account exists
    await prisma.user.upsert({
        where: { email: "citizen@civictrack.in" },
        update: { name: "Demo Citizen", role: "citizen", cityId: pune.id },
        create: { name: "Demo Citizen", email: "citizen@civictrack.in", password: hashedPwd, role: "citizen", cityId: pune.id },
    });
    console.log(`  ✅ citizen@civictrack.in  → citizen`);

    // 4. Ensure municipal admin account exists
    await prisma.user.upsert({
        where: { email: "admin@pmc.gov.in" },
        update: { name: "Municipal Admin", role: "municipal", cityId: pune.id },
        create: { name: "Municipal Admin", email: "admin@pmc.gov.in", password: hashedPwd, role: "municipal", cityId: pune.id },
    });
    console.log(`  ✅ admin@pmc.gov.in  → municipal`);

    // 5. Create each department + its demo user
    console.log("\n📋 Creating departments and department users…");
    for (const d of DEPT_CONFIG) {
        // Upsert department by (cityId, categoryType) — the schema's unique constraint
        const dept = await prisma.department.upsert({
            where: { cityId_categoryType: { cityId: pune.id, categoryType: d.categoryType } },
            update: { name: d.name },
            create: { name: d.name, categoryType: d.categoryType, cityId: pune.id },
        });
        console.log(`  ✅ Department: ${d.name} [${d.categoryType}] (${dept.id})`);

        // Upsert demo user for this department
        await prisma.user.upsert({
            where: { email: d.email },
            update: {
                name: d.userName,
                role: "department",
                cityId: pune.id,
                departmentId: dept.id,
            },
            create: {
                name: d.userName,
                email: d.email,
                password: hashedPwd,
                role: "department",
                cityId: pune.id,
                departmentId: dept.id,
            },
        });
        console.log(`     👤 ${d.email}  → ${d.name}`);
    }

    console.log("\n🎉 Seeding complete!");
    console.log("\nDemo login credentials (all use password: password123)");
    console.log("──────────────────────────────────────────────────────");
    console.log("  Citizen:                   citizen@civictrack.in");
    console.log("  Sanitation Dept:           sanitation@pune.gov.in");
    console.log("  Roads & Infra Dept:        roads@pune.gov.in");
    console.log("  Water Supply Dept:         water@pune.gov.in");
    console.log("  Electrical Dept:           electrical@pune.gov.in");
    console.log("  Drainage Dept:             drainage@pune.gov.in");
    console.log("  Roads & Infra (Footpath):  footpath@pune.gov.in");
    console.log("  General Dept:              general@pune.gov.in");
    console.log("  Municipal Admin:           admin@pmc.gov.in");
    console.log("──────────────────────────────────────────────────────");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
