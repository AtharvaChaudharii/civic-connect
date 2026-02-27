import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...\n");

    // ── Cities ──
    const pune = await prisma.city.upsert({
        where: { name: "Pune" },
        update: {},
        create: { name: "Pune", state: "Maharashtra" },
    });
    const mumbai = await prisma.city.upsert({
        where: { name: "Mumbai" },
        update: {},
        create: { name: "Mumbai", state: "Maharashtra" },
    });
    const bangalore = await prisma.city.upsert({
        where: { name: "Bangalore" },
        update: {},
        create: { name: "Bangalore", state: "Karnataka" },
    });

    console.log("✅ Cities created");

    // ── Departments (Pune) ──
    const puneSanitation = await prisma.department.upsert({
        where: { cityId_categoryType: { cityId: pune.id, categoryType: "Garbage" } },
        update: {},
        create: { name: "Sanitation", categoryType: "Garbage", cityId: pune.id },
    });
    const puneRoads = await prisma.department.upsert({
        where: { cityId_categoryType: { cityId: pune.id, categoryType: "Pothole" } },
        update: {},
        create: { name: "Roads & Infrastructure", categoryType: "Pothole", cityId: pune.id },
    });
    const puneWater = await prisma.department.upsert({
        where: { cityId_categoryType: { cityId: pune.id, categoryType: "WaterOverflow" } },
        update: {},
        create: { name: "Water Supply", categoryType: "WaterOverflow", cityId: pune.id },
    });
    const puneElectrical = await prisma.department.upsert({
        where: { cityId_categoryType: { cityId: pune.id, categoryType: "StreetLight" } },
        update: {},
        create: { name: "Electrical", categoryType: "StreetLight", cityId: pune.id },
    });
    const puneDrainage = await prisma.department.upsert({
        where: { cityId_categoryType: { cityId: pune.id, categoryType: "Drainage" } },
        update: {},
        create: { name: "Drainage", categoryType: "Drainage", cityId: pune.id },
    });
    const puneFootpath = await prisma.department.upsert({
        where: { cityId_categoryType: { cityId: pune.id, categoryType: "Footpath" } },
        update: {},
        create: { name: "Roads & Infrastructure (Footpath)", categoryType: "Footpath", cityId: pune.id },
    });

    // ── Departments (Mumbai) ──
    const mumbaiSanitation = await prisma.department.upsert({
        where: { cityId_categoryType: { cityId: mumbai.id, categoryType: "Garbage" } },
        update: {},
        create: { name: "Sanitation", categoryType: "Garbage", cityId: mumbai.id },
    });
    const mumbaiDrainage = await prisma.department.upsert({
        where: { cityId_categoryType: { cityId: mumbai.id, categoryType: "Drainage" } },
        update: {},
        create: { name: "Drainage", categoryType: "Drainage", cityId: mumbai.id },
    });

    console.log("✅ Departments created");

    // ── Users ──
    const hashedPassword = await bcrypt.hash("password123", 12);

    // Citizens
    const citizen1 = await prisma.user.upsert({
        where: { email: "citizen@civictrack.in" },
        update: {},
        create: {
            name: "Aarav Sharma",
            email: "citizen@civictrack.in",
            password: hashedPassword,
            role: "citizen",
            cityId: pune.id,
        },
    });
    const citizen2 = await prisma.user.upsert({
        where: { email: "priya@civictrack.in" },
        update: {},
        create: {
            name: "Priya Deshmukh",
            email: "priya@civictrack.in",
            password: hashedPassword,
            role: "citizen",
            cityId: pune.id,
        },
    });
    const citizen3 = await prisma.user.upsert({
        where: { email: "rohan@civictrack.in" },
        update: {},
        create: {
            name: "Rohan Mehta",
            email: "rohan@civictrack.in",
            password: hashedPassword,
            role: "citizen",
            cityId: mumbai.id,
        },
    });

    // Department users
    const deptSanitation = await prisma.user.upsert({
        where: { email: "sanitation@pune.gov.in" },
        update: {},
        create: {
            name: "Sanitation Dept – Pune",
            email: "sanitation@pune.gov.in",
            password: hashedPassword,
            role: "department",
            cityId: pune.id,
            departmentId: puneSanitation.id,
        },
    });
    const deptRoads = await prisma.user.upsert({
        where: { email: "roads@pune.gov.in" },
        update: {},
        create: {
            name: "Roads & Infra – Pune",
            email: "roads@pune.gov.in",
            password: hashedPassword,
            role: "department",
            cityId: pune.id,
            departmentId: puneRoads.id,
        },
    });
    const deptWater = await prisma.user.upsert({
        where: { email: "water@pune.gov.in" },
        update: {},
        create: {
            name: "Water Supply – Pune",
            email: "water@pune.gov.in",
            password: hashedPassword,
            role: "department",
            cityId: pune.id,
            departmentId: puneWater.id,
        },
    });
    const deptElectrical = await prisma.user.upsert({
        where: { email: "electrical@pune.gov.in" },
        update: {},
        create: {
            name: "Electrical – Pune",
            email: "electrical@pune.gov.in",
            password: hashedPassword,
            role: "department",
            cityId: pune.id,
            departmentId: puneElectrical.id,
        },
    });
    const deptDrainage = await prisma.user.upsert({
        where: { email: "drainage@pune.gov.in" },
        update: {},
        create: {
            name: "Drainage – Pune",
            email: "drainage@pune.gov.in",
            password: hashedPassword,
            role: "department",
            cityId: pune.id,
            departmentId: puneDrainage.id,
        },
    });

    // Municipal users
    const pmcAdmin = await prisma.user.upsert({
        where: { email: "admin@pmc.gov.in" },
        update: {},
        create: {
            name: "PMC Admin",
            email: "admin@pmc.gov.in",
            password: hashedPassword,
            role: "municipal",
            cityId: pune.id,
        },
    });
    const bmcAdmin = await prisma.user.upsert({
        where: { email: "admin@bmc.gov.in" },
        update: {},
        create: {
            name: "BMC Admin",
            email: "admin@bmc.gov.in",
            password: hashedPassword,
            role: "municipal",
            cityId: mumbai.id,
        },
    });

    console.log("✅ Users created");

    // ── Consolidated Tickets ──
    function daysAgo(n: number): Date {
        const d = new Date();
        d.setDate(d.getDate() - n);
        return d;
    }

    const ticket1 = await prisma.consolidatedTicket.create({
        data: {
            departmentId: puneSanitation.id,
            cityId: pune.id,
            status: "Pending",
            createdAt: daysAgo(2),
        },
    });

    const ticket2 = await prisma.consolidatedTicket.create({
        data: {
            departmentId: puneRoads.id,
            cityId: pune.id,
            status: "Ongoing",
            createdAt: daysAgo(5),
        },
    });

    const ticket3 = await prisma.consolidatedTicket.create({
        data: {
            departmentId: puneWater.id,
            cityId: pune.id,
            status: "Resolved",
            resolvedAt: daysAgo(7),
            createdAt: daysAgo(10),
        },
    });

    const ticket4 = await prisma.consolidatedTicket.create({
        data: {
            departmentId: puneElectrical.id,
            cityId: pune.id,
            status: "Escalated",
            escalationFlag: true,
            escalatedAt: daysAgo(2),
            createdAt: daysAgo(9),
        },
    });

    const ticket5 = await prisma.consolidatedTicket.create({
        data: {
            departmentId: puneDrainage.id,
            cityId: pune.id,
            status: "Pending",
            createdAt: daysAgo(1),
        },
    });

    const ticket6 = await prisma.consolidatedTicket.create({
        data: {
            departmentId: puneFootpath.id,
            cityId: pune.id,
            status: "Ongoing",
            createdAt: daysAgo(4),
        },
    });

    // Mumbai tickets
    const ticket7 = await prisma.consolidatedTicket.create({
        data: {
            departmentId: mumbaiSanitation.id,
            cityId: mumbai.id,
            status: "Pending",
            createdAt: daysAgo(3),
        },
    });

    const ticket8 = await prisma.consolidatedTicket.create({
        data: {
            departmentId: mumbaiDrainage.id,
            cityId: mumbai.id,
            status: "Escalated",
            escalationFlag: true,
            escalatedAt: daysAgo(3),
            createdAt: daysAgo(10),
        },
    });

    console.log("✅ Consolidated tickets created");

    // ── Issue Posts ──
    const issue1 = await prisma.issuePost.create({
        data: {
            title: "Garbage Accumulation Near FC Road",
            description:
                "Large pile of garbage has been collecting near the FC Road junction for over a week. The bins are overflowing and waste is scattered on the footpath, creating an unhygienic condition for pedestrians.",
            category: "Garbage",
            location: "FC Road, Deccan, Pune",
            lat: 18.5204,
            lng: 73.8567,
            status: "Pending",
            image: "/uploads/seed-garbage.jpg",
            reporters: 5,
            reportedById: citizen1.id,
            cityId: pune.id,
            consolidatedTicketId: ticket1.id,
            createdAt: daysAgo(2),
        },
    });

    const issue2 = await prisma.issuePost.create({
        data: {
            title: "Large Pothole on MG Road",
            description:
                "A deep pothole has formed on MG Road near Camp area, causing accidents for two-wheelers. Multiple vehicles have been damaged. Immediate repair needed.",
            category: "Pothole",
            location: "MG Road, Camp, Pune",
            lat: 18.5196,
            lng: 73.879,
            status: "Ongoing",
            image: "/uploads/seed-pothole.jpg",
            reporters: 12,
            reportedById: citizen2.id,
            cityId: pune.id,
            consolidatedTicketId: ticket2.id,
            createdAt: daysAgo(5),
        },
    });

    const issue3 = await prisma.issuePost.create({
        data: {
            title: "Water Pipe Burst Near Market",
            description:
                "Major water pipe burst near Laxmi Road market. Water is flooding the road and several shops are affected. Water supply has been disrupted in the area.",
            category: "WaterOverflow",
            location: "Laxmi Road, Pune",
            lat: 18.513,
            lng: 73.857,
            status: "Resolved",
            image: "/uploads/seed-water.jpg",
            reporters: 3,
            reportedById: citizen1.id,
            cityId: pune.id,
            consolidatedTicketId: ticket3.id,
            createdAt: daysAgo(10),
        },
    });

    const issue4 = await prisma.issuePost.create({
        data: {
            title: "Non-functional Street Lights",
            description:
                "An entire stretch of street lights on the main road in Kothrud are non-functional for over a week. This is a safety hazard for pedestrians and vehicles at night.",
            category: "StreetLight",
            location: "Kothrud, Pune",
            lat: 18.5074,
            lng: 73.8077,
            status: "Escalated",
            image: "/uploads/seed-streetlight.jpg",
            reporters: 8,
            reportedById: citizen2.id,
            cityId: pune.id,
            consolidatedTicketId: ticket4.id,
            createdAt: daysAgo(9),
        },
    });

    const issue5 = await prisma.issuePost.create({
        data: {
            title: "Blocked Storm Drain Causing Flooding",
            description:
                "The storm drain near Hadapsar main road is completely blocked. During rains, the entire road floods up to knee level, making it impassable.",
            category: "Drainage",
            location: "Hadapsar, Pune",
            lat: 18.5089,
            lng: 73.9259,
            status: "Pending",
            image: "/uploads/seed-drainage.jpg",
            reporters: 7,
            reportedById: citizen1.id,
            cityId: pune.id,
            consolidatedTicketId: ticket5.id,
            createdAt: daysAgo(1),
        },
    });

    const issue6 = await prisma.issuePost.create({
        data: {
            title: "Damaged Footpath Near School",
            description:
                "The footpath near the school in Aundh has broken tiles and exposed iron rods. Children walking to school are at risk of injury.",
            category: "Footpath",
            location: "Aundh, Pune",
            lat: 18.559,
            lng: 73.8077,
            status: "Ongoing",
            image: "/uploads/seed-footpath.jpg",
            reporters: 4,
            reportedById: citizen2.id,
            cityId: pune.id,
            consolidatedTicketId: ticket6.id,
            createdAt: daysAgo(4),
        },
    });

    // Mumbai issues
    const issue7 = await prisma.issuePost.create({
        data: {
            title: "Overflowing Dustbin at Andheri Station",
            description:
                "The dustbin near Andheri West station exit has been overflowing for 3 days. Waste is scattered all around the entrance.",
            category: "Garbage",
            location: "Andheri West, Mumbai",
            lat: 19.1197,
            lng: 72.8464,
            status: "Pending",
            image: "/uploads/seed-garbage.jpg",
            reporters: 6,
            reportedById: citizen3.id,
            cityId: mumbai.id,
            consolidatedTicketId: ticket7.id,
            createdAt: daysAgo(3),
        },
    });

    const issue8 = await prisma.issuePost.create({
        data: {
            title: "Water Logging on Western Express",
            description:
                "Severe waterlogging on Western Express Highway near Jogeshwari. Traffic has come to a standstill during morning rush hours.",
            category: "Drainage",
            location: "Jogeshwari, Mumbai",
            lat: 19.1367,
            lng: 72.849,
            status: "Escalated",
            image: "/uploads/seed-water.jpg",
            reporters: 22,
            reportedById: citizen3.id,
            cityId: mumbai.id,
            consolidatedTicketId: ticket8.id,
            createdAt: daysAgo(10),
        },
    });

    console.log("✅ Issue posts created");

    // ── Comments ──
    await prisma.comment.createMany({
        data: [
            {
                content: "This has been here for days. Please clean up urgently.",
                userId: citizen2.id,
                issuePostId: issue1.id,
                createdAt: daysAgo(1),
            },
            {
                content: "The smell is unbearable during mornings.",
                userId: citizen1.id,
                issuePostId: issue1.id,
                createdAt: daysAgo(0),
            },
            {
                content: "Our team has been dispatched. Repair work will begin tomorrow.",
                isDepartmentUpdate: true,
                userId: deptRoads.id,
                issuePostId: issue2.id,
                createdAt: daysAgo(2),
            },
            {
                content: "Pipe has been repaired and water supply restored.",
                isDepartmentUpdate: true,
                userId: deptWater.id,
                issuePostId: issue3.id,
                createdAt: daysAgo(7),
            },
            {
                content: "It's very dangerous to walk here at night.",
                userId: citizen1.id,
                issuePostId: issue4.id,
                createdAt: daysAgo(5),
            },
            {
                content: "Assessment completed. Repair scheduled for next week.",
                isDepartmentUpdate: true,
                userId: deptRoads.id,
                issuePostId: issue6.id,
                createdAt: daysAgo(1),
            },
        ],
    });

    console.log("✅ Comments created");

    // ── Notifications ──
    await prisma.notification.createMany({
        data: [
            {
                userId: citizen1.id,
                title: "Issue Submitted",
                message: "Your report 'Garbage Accumulation Near FC Road' has been sent to the Sanitation department of Pune.",
                type: "info",
                issueId: issue1.id,
            },
            {
                userId: citizen2.id,
                title: "Status Updated",
                message: "Your report 'Large Pothole on MG Road' is now marked as Ongoing.",
                type: "success",
                issueId: issue2.id,
            },
            {
                userId: citizen1.id,
                title: "Issue Resolved",
                message: "Water Pipe Burst Near Market has been resolved. A proof image has been uploaded.",
                type: "success",
                read: true,
                issueId: issue3.id,
            },
            {
                userId: citizen2.id,
                title: "Issue Escalated",
                message: "Non-functional Street Lights in Kothrud has been escalated to the Municipal Corporation after 7 days without resolution.",
                type: "warning",
                issueId: issue4.id,
            },
            {
                userId: deptSanitation.id,
                title: "New Issue Assigned",
                message: "A new garbage issue has been reported at FC Road, Deccan. 5 citizens have reported this.",
                type: "info",
                issueId: issue1.id,
            },
            {
                userId: pmcAdmin.id,
                title: "Escalation Alert",
                message: "Non-functional Street Lights in Kothrud has been escalated. The Electrical department has not responded for 7 days.",
                type: "error",
                issueId: issue4.id,
            },
        ],
    });

    console.log("✅ Notifications created");

    console.log("\n🎉 Database seeded successfully!");
    console.log("\n📋 Test Credentials (all use password: password123):");
    console.log("   Citizen:    citizen@civictrack.in");
    console.log("   Department: sanitation@pune.gov.in");
    console.log("   Municipal:  admin@pmc.gov.in");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error("Seed error:", e);
        await prisma.$disconnect();
        process.exit(1);
    });
