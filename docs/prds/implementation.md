implementation-plan.md

Build Philosophy
	•	Ship usable MVP fast.
	•	Enforce role boundaries early.
	•	Automate escalation from day one.
	•	Test duplicate logic before launch.

⸻

Phase 0 — Foundation Setup (Week 1)

1. Project Setup
	•	Create frontend project.
	•	Create backend API project.
	•	Set up PostgreSQL (with geolocation support).
	•	Configure cloud image storage.
	•	Define environment structure (dev / staging / prod).

Checkpoint:
	•	App runs locally.
	•	Database connected.
	•	Image upload working.

⸻

Phase 1 — Authentication & Role System (Week 2)

Step 1: User Model

Create roles:
	•	Citizen
	•	Department
	•	Municipal Corporation

Fields:
	•	id
	•	email
	•	password
	•	role
	•	city_id
	•	department_id (nullable)

Micro-Tasks:
	•	Build signup (Citizen only).
	•	Build login.
	•	Protect routes by role.
	•	Create admin-only route guards.
	•	Create city isolation middleware.

Checkpoint:
	•	Citizen can login.
	•	Department sees only their dashboard.
	•	Municipal sees only their city.

⸻

Phase 2 — Core Civic Reporting Flow (Week 3–4)

Step 1: Report Issue (Citizen)

Micro-Flow:
	1.	Click “Report Issue”
	2.	Upload image
	3.	Auto-detect location
	4.	Select category
	5.	Submit

Backend Logic:
	•	Detect city via coordinates.
	•	Assign department based on category + city.
	•	Run duplicate detection:
	•	Same category
	•	Within 20m radius

If duplicate:
	•	Attach post to existing consolidated ticket.
Else:
	•	Create new consolidated ticket.

Checkpoint:
	•	Duplicate logic tested with multiple coordinates.
	•	Department sees only one ticket for duplicates.

⸻

Phase 3 — Issue Viewing & Interaction (Week 4)

Citizen Features
	•	View issues near me
	•	Search by:
	•	Keyword
	•	Location
	•	Comment
	•	Upvote

Micro-Tasks:
	•	Build issue card UI.
	•	Add status badge logic.
	•	Add comment system (image optional).
	•	Add upvote counter.

Checkpoint:
	•	Citizens can track issue status in real time.
	•	Duplicate posts show shared resolution updates.

⸻

Phase 4 — Department Dashboard (Week 5)

Core Views
	•	Total Issues
	•	Pending
	•	Ongoing
	•	Resolved

Ticket Detail Page

Must include:
	•	Location
	•	Image
	•	Duplicate reporter count
	•	Comments
	•	Status change control

Resolution Rule

Before marking “Resolved”:
	•	Upload proof photo
	•	Add resolution comment

System should:
	•	Update all linked duplicate posts.
	•	Notify all reporting users.

Checkpoint:
	•	Cannot resolve without proof.
	•	Resolution sync works across duplicates.

⸻

Phase 5 — Escalation Automation (Week 6)

Escalation Logic

Daily background job:
	•	Find tickets:
	•	Status ≠ Resolved
	•	Created > 7 days ago
	•	Not already escalated

Then:
	•	Mark as Escalated
	•	Notify Municipal Corporation
	•	Add escalation comment to all linked posts

Checkpoint:
	•	Simulated 7-day test works.
	•	Municipal sees escalated badge.

⸻

Phase 6 — Municipal Dashboard (Week 7)

Views
	•	All issues (city only)
	•	Filter by department
	•	Escalated issues view
	•	Department performance metrics

Reports Download

Generate:
	•	Total issues
	•	Resolved count
	•	Pending count
	•	Ongoing count
	•	Escalated count
	•	Department breakdown

Export format:
	•	CSV (MVP)
	•	PDF (V1)

Checkpoint:
	•	Municipal cannot see other cities.
	•	Report exports correct city-only data.

⸻

Phase 7 — Notifications (Week 8)
	•	Issue submitted confirmation
	•	Status changed notification
	•	Escalation notification
	•	Resolution proof update notification

Channels:
	•	Email first
	•	Push (V1)

⸻

Phase 8 — Hardening & QA (Week 9)

Critical Tests
	•	Cross-city data leakage test
	•	Duplicate merge accuracy test
	•	Escalation reliability test
	•	Department cannot bypass proof upload
	•	Load test on image uploads

Abuse Protection
	•	Rate limiting per user
	•	Basic content moderation flag
	•	Spam detection rules

⸻

Suggested Timeline Summary

Week 1 → Setup
Week 2 → Auth & Roles
Week 3–4 → Reporting + Duplicate Engine
Week 5 → Department Dashboard
Week 6 → Escalation
Week 7 → Municipal Dashboard + Reports
Week 8 → Notifications
Week 9 → QA + Hardening

Total MVP: ~9 Weeks

⸻

Team Roles

Product Owner
	•	Defines categories per city
	•	Defines escalation policy

Backend Developer
	•	Role logic
	•	Duplicate detection
	•	Escalation job
	•	Report generation

Frontend Developer
	•	Citizen UX
	•	Dashboards
	•	Status UI

DevOps
	•	Hosting
	•	Storage
	•	Monitoring
	•	Backup policies

⸻

Recommended Rituals
	•	Bi-weekly 30-min usability test (3 citizens)
	•	Monthly escalation audit review
	•	Department workflow feedback loop
	•	Cross-city permission test before every release

⸻

Optional Integrations (V1+)
	•	SMS notifications
	•	WhatsApp alerts
	•	GIS map heatmaps
	•	AI image classification (auto-suggest category)
	•	SLA monitoring per department

⸻

