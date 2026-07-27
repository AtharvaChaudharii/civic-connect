# 🚀 CivicConnect — Deployment & DevOps Interview Guide

> This document covers **everything about deployment, infrastructure, and DevOps** for CivicConnect — aligned with what's on your resume. Each section explains the concept, how you implemented it, potential interview questions, and ready-to-use answers.

---

## Table of Contents

1. [Resume Bullets Breakdown](#1-resume-bullets-breakdown)
2. [Production Architecture (The Big Picture)](#2-production-architecture-the-big-picture)
3. [Docker & Containerization](#3-docker--containerization)
   - [3.1 What is Docker & Why I Used It](#31-what-is-docker--why-i-used-it)
   - [3.2 Multi-Stage Dockerfile Explained Line-by-Line](#32-multi-stage-dockerfile-explained-line-by-line)
   - [3.3 The arm64 vs amd64 Problem](#33-the-arm64-vs-amd64-problem)
   - [3.4 Running the Container on EC2](#34-running-the-container-on-ec2)
   - [3.5 Docker Interview Q&A](#35-docker-interview-qa)
4. [AWS EC2 Deployment](#4-aws-ec2-deployment)
   - [4.1 What is EC2 & Why I Used It](#41-what-is-ec2--why-i-used-it)
   - [4.2 EC2 Security Groups](#42-ec2-security-groups)
   - [4.3 Environment Variables on EC2](#43-environment-variables-on-ec2)
   - [4.4 EC2 Interview Q&A](#44-ec2-interview-qa)
5. [Nginx Reverse Proxy](#5-nginx-reverse-proxy)
   - [5.1 What is a Reverse Proxy & Why Nginx](#51-what-is-a-reverse-proxy--why-nginx)
   - [5.2 How Nginx is Configured](#52-how-nginx-is-configured)
   - [5.3 WebSocket Proxying for Socket.IO](#53-websocket-proxying-for-socketio)
   - [5.4 Nginx Interview Q&A](#54-nginx-interview-qa)
6. [SSL/TLS with Certbot (Let's Encrypt)](#6-ssltls-with-certbot-lets-encrypt)
   - [6.1 What is SSL/TLS & Why It Matters](#61-what-is-ssltls--why-it-matters)
   - [6.2 How Certbot Works](#62-how-certbot-works)
   - [6.3 SSL Termination at Nginx](#63-ssl-termination-at-nginx)
   - [6.4 SSL Interview Q&A](#64-ssl-interview-qa)
7. [DNS Configuration](#7-dns-configuration)
   - [7.1 How DNS Works for This Project](#71-how-dns-works-for-this-project)
   - [7.2 A Records vs CNAME Records](#72-a-records-vs-cname-records)
   - [7.3 DNS Interview Q&A](#73-dns-interview-qa)
8. [GitHub Actions CI/CD Pipeline](#8-github-actions-cicd-pipeline)
   - [8.1 What is CI/CD & Why It Matters](#81-what-is-cicd--why-it-matters)
   - [8.2 The Two-Job Pipeline Explained](#82-the-two-job-pipeline-explained)
   - [8.3 Path-Based Triggers](#83-path-based-triggers)
   - [8.4 GitHub Secrets & SSH Key Setup](#84-github-secrets--ssh-key-setup)
   - [8.5 CI/CD Interview Q&A](#85-cicd-interview-qa)
9. [Netlify Frontend Deployment](#9-netlify-frontend-deployment)
   - [9.1 How Netlify Works](#91-how-netlify-works)
   - [9.2 SPA Fallback Configuration](#92-spa-fallback-configuration)
   - [9.3 Netlify Interview Q&A](#93-netlify-interview-qa)
10. [The --restart always Flag (Auto-Recovery)](#10-the---restart-always-flag-auto-recovery)
11. [Full Request Flow (End-to-End)](#11-full-request-flow-end-to-end)
12. [Common Mistakes I Made & Fixed](#12-common-mistakes-i-made--fixed)
13. [Master Q&A (All Possible Questions)](#13-master-qa-all-possible-questions)

---

## 1. Resume Bullets Breakdown

Let's map each bullet point on your resume to what you actually did:

| Resume Bullet | What it really means | Section |
|--------------|---------------------|---------|
| *"complete UI, REST APIs, and a real-time Socket.io chat"* | Full-stack app with 25+ API endpoints, Socket.IO for live updates (new issues, upvotes, comments, status changes, notifications) | See main [README.md](README.md) |
| *"full AWS deployment – Docker, Nginx reverse proxy, SSL via Certbot, GitHub Actions CI/CD, and DNS setup across Netlify and EC2"* | You didn't just write code — you handled the entire production infrastructure yourself | Sections 3–9 |
| *"AWS EC2 inside a Docker container that restarts automatically"* | `--restart always` flag + Docker's built-in process management | [Section 10](#10-the---restart-always-flag-auto-recovery) |
| *"multi-stage Dockerfile that keeps TypeScript build and Prisma setup separate"* | Builder stage (compile TS + generate Prisma) → Production stage (only compiled JS + runtime deps) | [Section 3.2](#32-multi-stage-dockerfile-explained-line-by-line) |
| *"Nginx as a reverse proxy with SSL using Certbot"* | Nginx sits in front of Docker, handles HTTPS termination, proxies to localhost:5001 | [Section 5](#5-nginx-reverse-proxy) + [Section 6](#6-ssltls-with-certbot-lets-encrypt) |
| *"two-job GitHub Actions CI/CD pipeline that runs only when relevant files change"* | Job 1: Build Docker image + push to Docker Hub. Job 2: SSH into EC2 + deploy. Only triggers on `backend/` changes | [Section 8](#8-github-actions-cicd-pipeline) |

---

## 2. Production Architecture (The Big Picture)

```
                        ┌──────────────────────────────┐
                        │         Name.com DNS          │
                        │                              │
                        │  civic-connect.live → Netlify │
                        │  api.civic-connect.live → EC2 │
                        └──────────┬───────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    │
   ┌──────────────────┐  ┌──────────────────────┐      │
   │    Netlify CDN    │  │    AWS EC2 Instance   │      │
   │                  │  │    (Ubuntu, amd64)    │      │
   │  React Frontend  │  │                      │      │
   │  (Vite build)    │  │  ┌────────────────┐  │      │
   │                  │  │  │     Nginx      │  │      │
   │  SSL: Netlify    │  │  │  (port 80/443) │  │      │
   │  managed         │  │  │                │  │      │
   └──────────────────┘  │  │  SSL: Certbot  │  │      │
                         │  │  (Let's Encrypt)│  │      │
                         │  └───────┬────────┘  │      │
                         │          │ proxy_pass│      │
                         │          ▼           │      │
                         │  ┌────────────────┐  │      │
                         │  │    Docker      │  │      │
                         │  │  Container     │  │      │
                         │  │               │  │      │
                         │  │  Node.js      │  │      │
                         │  │  Express      │  │      │
                         │  │  Socket.IO    │  │      │
                         │  │  (port 5001)  │  │      │
                         │  │               │  │      │
                         │  │  --restart    │  │      │
                         │  │   always      │  │      │
                         │  └───────┬───────┘  │      │
                         │          │          │      │
                         └──────────┼──────────┘      │
                                    │                  │
                                    ▼                  │
                         ┌──────────────────┐          │
                         │   Supabase       │          │
                         │   PostgreSQL     │          │
                         │   (hosted DB)    │          │
                         └──────────────────┘          │
                                                       │
   ┌───────────────────────────────────────────────────┘
   │                CI/CD (GitHub Actions)
   │
   │  Push to `ashmit` branch (backend/ changes only)
   │         │
   │         ▼
   │  Job 1: Build Docker image (linux/amd64)
   │         Push to Docker Hub
   │         │
   │         ▼
   │  Job 2: SSH into EC2
   │         Pull new image
   │         Stop old container
   │         Start new container
   └───────────────────────────────────────────────────
```

### Key Design Decisions

| Decision | Reasoning |
|----------|-----------|
| **Separate frontend/backend hosts** | Frontend is static (HTML/JS/CSS) → CDN is ideal. Backend is dynamic (API + WebSocket) → needs a server. |
| **Docker on EC2** | Reproducible deploys, consistent environment, easy rollback (just run the old image). |
| **Nginx in front of Docker** | SSL termination, WebSocket upgrade handling, security (hide port 5001). |
| **DNS split across providers** | Root domain → Netlify for CDN. API subdomain → EC2 for backend. |

---

## 3. Docker & Containerization

### 3.1 What is Docker & Why I Used It

**Docker** packages your application and all its dependencies into a single unit called a **container**. This container runs the same way everywhere — your laptop, EC2, or any Linux server.

**Why I used Docker for this project:**
1. **"It works on my machine" problem** — My Mac runs arm64 (Apple Silicon). EC2 runs amd64 (x86). Docker lets me build specifically for the target platform.
2. **Dependency isolation** — The container has its own Node.js, OpenSSL, Prisma binaries. Nothing conflicts with the EC2 host OS.
3. **Easy deployment** — `docker pull` + `docker run` = deployed. No need to install Node.js, npm install, build TypeScript, etc. on the server.
4. **Easy rollback** — If a deploy is broken, just `docker run` the previous image tag.
5. **Auto-restart** — `--restart always` means the container comes back up if EC2 reboots or the process crashes.

**File:** [`backend/Dockerfile`](backend/Dockerfile)

---

### 3.2 Multi-Stage Dockerfile Explained Line-by-Line

```dockerfile
# ═══════════════════════════════════════════════════════════
# STAGE 1: BUILDER — compile TypeScript, generate Prisma
# ═══════════════════════════════════════════════════════════
FROM node:20 AS builder
# Uses the full Node.js 20 image (has npm, build tools, etc.)
# Named "builder" so Stage 2 can copy from it

WORKDIR /app
# All subsequent commands run inside /app

COPY package*.json ./
# Copy package.json AND package-lock.json first
# Docker caches this layer — if deps haven't changed,
# npm install is skipped on rebuild (faster builds)

RUN npm ci
# Clean install — uses package-lock.json for exact versions
# Installs ALL dependencies (including devDependencies like
# TypeScript, tsx, @types/*) because we need them to build

COPY . .
# Copy all source code (src/, prisma/, tsconfig.json, etc.)

RUN npx prisma generate
# Generates the Prisma client library from schema.prisma
# Creates type-safe query functions in node_modules/@prisma/client
# This is needed BEFORE TypeScript compilation because our code
# imports from @prisma/client

RUN npm run build
# Runs `tsc` — compiles TypeScript → JavaScript into dist/

# At this point, /app/dist contains the compiled JS
# But /app also has ALL node_modules (600MB+), source code, etc.
# We don't want all that in production.


# ═══════════════════════════════════════════════════════════
# STAGE 2: PRODUCTION — minimal runtime image
# ═══════════════════════════════════════════════════════════
FROM node:20-slim
# "slim" variant — much smaller than full node:20
# Has Node.js runtime but not build tools (gcc, make, python)

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl
# Prisma requires OpenSSL for database connections
# The slim image doesn't include it by default

COPY package*.json ./
RUN npm ci --omit=dev
# Install ONLY production dependencies (no TypeScript,
# no @types/*, no tsx). Much smaller node_modules.

COPY --from=builder /app/dist ./dist
# Copy the compiled JavaScript from Stage 1
# This is the ONLY code that runs in production

COPY --from=builder /app/prisma ./prisma
# Copy the Prisma schema — needed to regenerate the client

RUN npx prisma generate
# Regenerate Prisma client for THIS environment's architecture
# The builder stage generated it for the builder's OS;
# production stage needs its own binary

EXPOSE 5001
# Document that the container listens on port 5001
# This is informational — the actual port mapping is in `docker run`

CMD ["node", "dist/server.js"]
# The command that runs when the container starts
```

#### Why multi-stage?

| | Single-stage | Multi-stage |
|--|-------------|-------------|
| **Image size** | ~1.2 GB (includes TypeScript, all devDeps, source code) | ~300 MB (only compiled JS + production deps) |
| **Security** | Source code (.ts files) in the image | Only compiled .js — no source code exposure |
| **Build tools** | gcc, make, python in production (unnecessary) | Slim image with minimal attack surface |
| **Startup time** | Slower (larger image to pull) | Faster (smaller image) |

---

### 3.3 The arm64 vs amd64 Problem

This is a **real problem I faced** and is a great interview talking point.

#### What happened
1. I developed on a **MacBook with Apple Silicon (M1/M2)** — this is **arm64** architecture
2. When I ran `docker build`, it created an **arm64 image** by default
3. I pushed this image to Docker Hub
4. On EC2 (**x86_64/amd64** architecture), I ran `docker pull` + `docker run`
5. Container **immediately crashed** with: `exec format error`

#### Why it crashes
Docker images contain **compiled binaries** (Node.js itself, native npm modules like bcrypt, Prisma engine binaries). These binaries are compiled for a specific CPU architecture. An arm64 binary cannot execute on an amd64 processor — it's like trying to play a PlayStation game on an Xbox.

#### The fix
```bash
# Create a multi-platform builder (one-time setup)
docker buildx create --use

# Build explicitly for linux/amd64, even on an arm64 Mac
docker buildx build \
  --platform linux/amd64 \
  -t atharva1255/civic-backend:latest \
  --push .
```

`docker buildx` uses **QEMU emulation** under the hood — it emulates an x86 CPU on your ARM Mac to compile the binaries correctly.

#### In the CI/CD pipeline
The GitHub Actions runner is `ubuntu-latest` (amd64), so it builds natively for amd64. But the `--platform linux/amd64` flag is still included as a safety measure.

---

### 3.4 Running the Container on EC2

```bash
docker pull atharva1255/civic-backend:latest

docker run -d \
  -p 5001:5001 \
  --env-file /home/ubuntu/.env \
  --name backend \
  --restart always \
  atharva1255/civic-backend:latest
```

**Flag breakdown:**

| Flag | What it does |
|------|-------------|
| `-d` | **Detached mode** — runs in the background, gives you the terminal back |
| `-p 5001:5001` | **Port mapping** — maps EC2's port 5001 to the container's port 5001 |
| `--env-file /home/ubuntu/.env` | **Environment variables** — injects all vars from the .env file into the container at runtime (DB URL, JWT secret, etc.) |
| `--name backend` | **Container name** — so you can do `docker logs backend`, `docker stop backend` instead of using container IDs |
| `--restart always` | **Auto-restart** — container restarts if it crashes or if EC2 reboots. See [Section 10](#10-the---restart-always-flag-auto-recovery) |

---

### 3.5 Docker Interview Q&A

**Q: "What is a Docker container vs a Docker image?"**
> An **image** is a blueprint — it's a read-only template containing the OS, application code, and dependencies. A **container** is a running instance of an image. You can run multiple containers from the same image. Think of it like: image = class, container = object instance.

**Q: "Why did you use a multi-stage Dockerfile?"**
> To keep the production image small and secure. The first stage (builder) has TypeScript, all devDependencies, and build tools — it compiles the code. The second stage (production) only copies the compiled JavaScript and production dependencies. This cut the image from ~1.2GB to ~300MB, removes source code from production, and reduces the attack surface.

**Q: "Why `npm ci` instead of `npm install`?"**
> `npm ci` does a **clean install** from `package-lock.json` — it removes existing `node_modules` and installs exact versions. It's faster and deterministic (same lockfile = same install every time). `npm install` can modify the lockfile and resolve different versions, which is bad for reproducible builds.

**Q: "What's the difference between `COPY` and `ADD` in Dockerfile?"**
> `COPY` simply copies files from host to container. `ADD` can also extract tar archives and download URLs. Best practice is to use `COPY` unless you specifically need tar extraction — it's more explicit and predictable.

**Q: "Why do you run `prisma generate` twice — once in builder and once in production?"**
> Prisma generates platform-specific binary engines (query engine, migration engine). The builder stage runs on the builder's platform and generates binaries for that environment. The production stage uses `node:20-slim` (different base OS), so it needs its own generated binaries. Without the second `prisma generate`, you get runtime errors about missing engines.

**Q: "Explain the `exec format error` you faced."**
> I built the Docker image on my Apple Silicon Mac (arm64 architecture). When I deployed it to EC2 (amd64/x86_64), the container crashed immediately because the compiled binaries inside the image were for the wrong CPU architecture. It's like trying to run software compiled for an iPhone on a Windows PC. The fix was using `docker buildx build --platform linux/amd64` to cross-compile.

**Q: "What is Docker Buildx?"**
> Buildx is Docker's extended build system that supports multi-platform builds. It uses QEMU emulation to build images for architectures different from your host machine. For example, building an amd64 image on an arm64 Mac. It also supports building and pushing to a registry in a single command.

**Q: "How do you pass environment variables to the container?"**
> Using `--env-file /path/to/.env` at `docker run` time. The `.env` file lives on the EC2 instance (never in the image or version control). This separates configuration from code — the same image can run in dev, staging, and production with different env files.

**Q: "What happens if the Docker container crashes?"**
> With `--restart always`, Docker's daemon automatically restarts the container. It uses exponential backoff — if the container keeps crashing, it waits longer between restart attempts (100ms → 200ms → 400ms → ... up to a cap). This prevents a crash loop from consuming all CPU.

**Q: "How would you debug a running container?"**
> Several approaches:
> - `docker logs backend` — view stdout/stderr output
> - `docker logs -f backend` — follow logs in real-time (like `tail -f`)
> - `docker exec -it backend sh` — open a shell inside the running container
> - `docker inspect backend` — view container metadata, network, mounts
> - `docker stats` — live resource usage (CPU, memory, network)

---

## 4. AWS EC2 Deployment

### 4.1 What is EC2 & Why I Used It

**Amazon EC2 (Elastic Compute Cloud)** gives you a virtual server in the cloud. You get full control over the OS, networking, and software — it's basically a remote Linux machine.

**Why EC2 over other options:**
| Option | Why I didn't use it |
|--------|-------------------|
| **AWS Lambda** | Socket.IO needs a persistent connection — Lambda is for short-lived functions (max 15 min) |
| **AWS ECS/Fargate** | More complex setup for a single-container app; better for multi-service architectures |
| **Heroku** | Easier but less control, more expensive for always-on servers, limited free tier |
| **Railway/Render** | Good alternatives, but I wanted hands-on experience with real infrastructure |

**Why EC2 was right:**
- Full control over the machine
- Can run Docker, Nginx, and Certbot exactly as I want
- Persistent WebSocket connections (Socket.IO) work without issues
- Cost-effective (t2.micro or t3.micro for small projects)

---

### 4.2 EC2 Security Groups

Security Groups are EC2's **firewall** — they control which traffic can reach the instance.

**My final configuration:**

| Port | Protocol | Source | Purpose |
|------|----------|--------|---------|
| 22 | TCP | 0.0.0.0/0 | SSH access (for deployment, debugging) |
| 80 | TCP | 0.0.0.0/0 | HTTP (Nginx redirects to HTTPS) |
| 443 | TCP | 0.0.0.0/0 | HTTPS (Nginx terminates SSL) |

**What I removed:** Port 5001 was initially open for debugging (to directly test if the Docker container was responding). Once Nginx was working correctly, I **closed port 5001** because:
- All traffic should go through Nginx (port 443 → proxy to localhost:5001)
- Exposing the app port directly bypasses SSL — traffic would be unencrypted
- Reduces attack surface — fewer open ports = fewer entry points

---

### 4.3 Environment Variables on EC2

The `.env` file lives at `/home/ubuntu/.env` on the EC2 instance:
- **Never committed to Git** — contains secrets (DB password, JWT secret, API keys)
- **Injected at runtime** via `docker run --env-file /home/ubuntu/.env`
- **Not baked into the Docker image** — the same image works with different env files

This follows the **Twelve-Factor App** methodology: *"Store config in the environment."*

---

### 4.4 EC2 Interview Q&A

**Q: "Why did you choose EC2 over serverless (Lambda)?"**
> My app uses Socket.IO for real-time updates, which requires **persistent WebSocket connections**. Lambda functions are short-lived (max 15 minutes) and stateless — they can't maintain a WebSocket connection. EC2 gives me a long-running server that can hold open connections indefinitely.

**Q: "What EC2 instance type did you use?"**
> t2.micro or t3.micro — these are burstable instances suitable for low-to-moderate traffic. They're cost-effective for a project like this. For production scale, I'd consider t3.medium or m5.large depending on traffic patterns.

**Q: "How would you handle the server going down?"**
> Three layers of protection:
> 1. **Docker `--restart always`** — handles application crashes
> 2. **EC2 instance recovery** — AWS auto-recovers from host hardware failures
> 3. **For true high availability** — I'd add an Auto Scaling Group with a load balancer. But for this project's scale, a single instance with restart policies is sufficient.

**Q: "Why did you close port 5001 in the security group?"**
> Once Nginx is configured as a reverse proxy, all traffic should flow through ports 80/443 (which Nginx handles). Leaving port 5001 open would allow direct access to the backend **without SSL encryption**, bypassing security. It also reduces the attack surface.

**Q: "How do you SSH into the EC2 instance?"**
> Using SSH with a private key: `ssh -i ~/.ssh/my-key.pem ubuntu@<EC2_IP>`. The key pair is created during EC2 setup — the private key stays on my machine, the public key is on the server. For CI/CD, I generated a **separate SSH key pair** specifically for GitHub Actions (principle of least privilege).

---

## 5. Nginx Reverse Proxy

### 5.1 What is a Reverse Proxy & Why Nginx

A **reverse proxy** sits between the internet and your application. Clients talk to Nginx; Nginx talks to your app.

```
Client → Nginx (port 443, HTTPS) → Docker container (port 5001, HTTP)
```

**Why use Nginx instead of just exposing the Docker container directly?**

| Concern | Without Nginx | With Nginx |
|---------|--------------|------------|
| **SSL/HTTPS** | Node.js handles SSL (complex, error-prone) | Nginx handles SSL termination (Certbot auto-configures) |
| **Port** | Exposed on port 5001 (non-standard) | Standard ports 80/443 |
| **Security** | Direct access to Node.js process | Nginx buffers requests, protects against slowloris attacks |
| **Static files** | Node.js serves them (slower) | Nginx can serve static files (faster, but we use Netlify instead) |
| **WebSocket** | Works directly | Nginx handles the upgrade headers properly |
| **Logging** | Application-level only | Access logs, error logs at proxy level |

---

### 5.2 How Nginx is Configured

**Config file on EC2:** `/etc/nginx/sites-available/default`

```nginx
server {
    server_name api.civic-connect.live;

    location / {
        proxy_pass         http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade    $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host       $host;
    }

    # Certbot adds these lines automatically:
    listen 443 ssl;
    ssl_certificate     /etc/letsencrypt/live/api.civic-connect.live/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.civic-connect.live/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;
}

# HTTP → HTTPS redirect (added by Certbot)
server {
    server_name api.civic-connect.live;
    listen 80;
    return 301 https://$host$request_uri;
}
```

**Line-by-line breakdown:**

| Directive | What it does |
|-----------|-------------|
| `server_name api.civic-connect.live` | This block only handles requests for the API subdomain |
| `proxy_pass http://localhost:5001` | Forward all requests to the Docker container running on port 5001 |
| `proxy_http_version 1.1` | Required for WebSocket support (HTTP/1.0 doesn't support connection upgrade) |
| `proxy_set_header Upgrade $http_upgrade` | Passes the `Upgrade: websocket` header through — needed for Socket.IO |
| `proxy_set_header Connection "upgrade"` | Tells Nginx to keep the connection open for WebSocket |
| `proxy_set_header Host $host` | Forwards the original `Host` header so the backend knows the real domain |
| `listen 443 ssl` | Accept HTTPS connections on port 443 |
| `ssl_certificate / ssl_certificate_key` | The TLS certificate files (generated by Certbot) |
| `return 301 https://...` | Permanent redirect from HTTP to HTTPS |

---

### 5.3 WebSocket Proxying for Socket.IO

This is a common interview topic. Socket.IO uses WebSockets, which start as an HTTP request and then **upgrade** to a persistent bidirectional connection:

```
1. Client sends: GET /socket.io/?transport=websocket
                 Headers: Upgrade: websocket, Connection: Upgrade

2. Nginx sees the Upgrade header → forwards to Node.js

3. Node.js responds: 101 Switching Protocols

4. Connection is now a WebSocket — bidirectional data flows
```

**Without the `Upgrade` and `Connection` proxy headers**, Nginx would strip them, and Socket.IO would **fall back to HTTP long-polling** (much slower, more resource-intensive).

---

### 5.4 Nginx Interview Q&A

**Q: "What is a reverse proxy?"**
> A reverse proxy is a server that sits between clients and backend servers. It receives client requests, forwards them to the appropriate backend, and returns the response. Unlike a forward proxy (which hides the client), a reverse proxy hides the backend servers. In my case, Nginx receives HTTPS requests on port 443 and proxies them to my Node.js app on port 5001.

**Q: "Why not just let Node.js handle SSL directly?"**
> Three reasons: (1) **Separation of concerns** — Node.js handles application logic, Nginx handles SSL. (2) **Certbot integration** — Certbot auto-configures Nginx for SSL and handles certificate renewal. Doing this in Node.js requires manual certificate management. (3) **Performance** — Nginx is written in C and handles SSL handshakes more efficiently than Node.js.

**Q: "How does Nginx handle WebSocket connections?"**
> Socket.IO connections start as HTTP requests with `Upgrade: websocket` headers. I configured Nginx to forward these headers using `proxy_set_header Upgrade $http_upgrade` and `proxy_set_header Connection "upgrade"`. This tells Nginx to pass the upgrade request through to Node.js, which then switches the connection from HTTP to WebSocket. Without these headers, WebSocket connections would fail and Socket.IO would fall back to long-polling.

**Q: "What's the difference between `proxy_pass` and `redirect`?"**
> `proxy_pass` is **transparent** — the client doesn't know about the backend server. Nginx forwards the request internally and returns the response as if it came from Nginx. A `redirect` (301/302) tells the client to make a new request to a different URL — the client sees the redirect. I use `proxy_pass` for the API and `redirect` only for HTTP → HTTPS.

**Q: "What would happen if Nginx goes down?"**
> The entire backend becomes unreachable because Nginx is the entry point for all HTTPS traffic. The Docker container would still be running, but nobody can reach it (port 5001 is blocked by the security group). To mitigate this, I'd add Nginx health checks or use a managed load balancer (like AWS ALB) in a production environment.

---

## 6. SSL/TLS with Certbot (Let's Encrypt)

### 6.1 What is SSL/TLS & Why It Matters

**SSL/TLS** encrypts the connection between the client and server. Without it:
- Anyone on the network can read API requests (including JWT tokens, passwords)
- Browsers show "Not Secure" warnings
- Modern APIs (like geolocation) require HTTPS
- App stores reject apps that use HTTP

**HTTPS = HTTP + TLS**. TLS (Transport Layer Security) is the modern version of SSL. People still say "SSL" colloquially.

---

### 6.2 How Certbot Works

**Certbot** is a free tool that automates SSL certificate management with **Let's Encrypt** (a free Certificate Authority).

#### The process I followed:

```bash
# 1. Install Certbot + Nginx plugin
sudo apt install certbot python3-certbot-nginx -y

# 2. Run Certbot for the API domain
sudo certbot --nginx -d api.civic-connect.live
```

#### What happens behind the scenes:

```
1. Certbot contacts Let's Encrypt: "I want a cert for api.civic-connect.live"

2. Let's Encrypt issues a CHALLENGE:
   "Prove you control this domain by serving a specific token
    at http://api.civic-connect.live/.well-known/acme-challenge/..."

3. Certbot creates the token file and tells Nginx to serve it

4. Let's Encrypt verifies the token (HTTP-01 challenge)

5. Let's Encrypt issues the certificate (valid for 90 days)

6. Certbot stores the cert files:
   - /etc/letsencrypt/live/api.civic-connect.live/fullchain.pem  (certificate + chain)
   - /etc/letsencrypt/live/api.civic-connect.live/privkey.pem    (private key)

7. Certbot modifies Nginx config to add:
   - listen 443 ssl
   - ssl_certificate / ssl_certificate_key paths
   - HTTP → HTTPS redirect

8. Certbot sets up a cron job for AUTO-RENEWAL (runs twice daily,
   renews when cert is within 30 days of expiry)
```

---

### 6.3 SSL Termination at Nginx

**SSL termination** means Nginx decrypts the HTTPS traffic, then forwards plain HTTP to the backend:

```
Client ──(HTTPS/encrypted)──→ Nginx ──(HTTP/plain)──→ Docker:5001
```

The internal traffic between Nginx and Docker is plain HTTP — this is fine because:
- It stays on `localhost` (never leaves the machine)
- There's no network hop where someone could intercept
- It's faster (no encryption overhead for internal traffic)

---

### 6.4 SSL Interview Q&A

**Q: "How did you set up SSL for your project?"**
> I used Certbot with Let's Encrypt for free SSL certificates. Certbot has an Nginx plugin — running `sudo certbot --nginx -d api.civic-connect.live` automatically proves domain ownership via the HTTP-01 challenge, obtains the certificate, configures Nginx to use it, sets up HTTP-to-HTTPS redirect, and schedules auto-renewal. The whole process takes about 30 seconds.

**Q: "What is SSL termination?"**
> SSL termination is when the reverse proxy (Nginx) handles the encryption/decryption of HTTPS traffic. The client's encrypted request is decrypted at Nginx, then forwarded as plain HTTP to the backend application. This offloads the CPU-intensive cryptographic work from the application server and centralizes certificate management at one point.

**Q: "How do certificates renew?"**
> Certbot sets up a cron job that runs twice daily. It checks if any certificate is within 30 days of expiry, and if so, automatically renews it using the same HTTP-01 challenge. Let's Encrypt certificates are valid for 90 days, so with auto-renewal, no manual intervention is needed.

**Q: "What's the difference between SSL and TLS?"**
> SSL (Secure Sockets Layer) is the older protocol — SSL 3.0 was the last version. TLS (Transport Layer Security) is its successor — TLS 1.2 and 1.3 are the current standards. People still say "SSL certificate" colloquially, but technically we're using TLS. The certificates themselves work with both.

**Q: "Buying a domain gives you SSL, right?"**
> No. A domain is just a name. SSL must be provisioned separately — either through a Certificate Authority (like Let's Encrypt via Certbot) or through the hosting platform (Netlify handles it automatically for frontend). It's a common misconception that domain registration includes SSL.

---

## 7. DNS Configuration

### 7.1 How DNS Works for This Project

DNS (Domain Name System) translates domain names to IP addresses. I registered `civic-connect.live` at **Name.com** and configured these records:

```
TYPE    HOST                      ANSWER                         PURPOSE
────    ────                      ──────                         ───────
A       civic-connect.live        75.2.60.5 (Netlify)           Frontend → Netlify CDN
A       api.civic-connect.live    16.176.210.222 (EC2)          Backend → EC2 instance
CNAME   www.civic-connect.live    civic-frontend.netlify.app     www → Netlify
```

### 7.2 A Records vs CNAME Records

| Record Type | What it does | Example |
|-------------|-------------|---------|
| **A Record** | Maps a domain to an **IP address** | `api.civic-connect.live → 16.176.210.222` |
| **CNAME Record** | Maps a domain to **another domain** (alias) | `www.civic-connect.live → civic-frontend.netlify.app` |

**Why both?**
- **A Record** for `api.civic-connect.live`: Points directly to EC2's IP. Required because the API subdomain must reach my specific server.
- **A Record** for `civic-connect.live`: Points to Netlify's load balancer IP. Root domains (no subdomain) cannot use CNAME records per DNS standards (RFC 1034).
- **CNAME** for `www.civic-connect.live`: Aliases to Netlify's auto-assigned subdomain. CNAME is preferred for non-root domains because if Netlify changes their IP, the CNAME still works.

### What happens when someone types `https://api.civic-connect.live/api/health`:

```
1. Browser asks DNS resolver: "What's the IP of api.civic-connect.live?"
2. Resolver checks Name.com's DNS: A record → 16.176.210.222
3. Browser connects to 16.176.210.222 on port 443 (HTTPS)
4. Nginx on EC2 handles the TLS handshake
5. Nginx proxies the request to localhost:5001
6. Docker container processes the request and returns JSON
7. Response flows back: Container → Nginx → Client
```

---

### 7.3 DNS Interview Q&A

**Q: "How did you configure DNS for this project?"**
> I registered the domain at Name.com. For the frontend, I pointed the root domain (`civic-connect.live`) to Netlify's IP via an A record, and added a CNAME for `www` → Netlify's assigned subdomain. For the backend, I created an A record for `api.civic-connect.live` pointing to my EC2 instance's public IP. This gives me `civic-connect.live` for frontend and `api.civic-connect.live` for backend.

**Q: "Why can't you use a CNAME for a root domain?"**
> DNS standards (RFC 1034) prohibit CNAME records at the zone apex (root domain). A CNAME says "this name is an alias for another name" — but root domains must also have SOA and NS records, which would conflict. Some DNS providers offer workarounds (like ALIAS or ANAME records), but standard CNAME at root is not allowed.

**Q: "What happens if the EC2 IP changes?"**
> I'd need to update the A record for `api.civic-connect.live` in Name.com's DNS settings. The TTL is set to 300 seconds (5 minutes), so the change would propagate quickly. To avoid this problem in production, I could use an **Elastic IP** (static IP) in AWS, or put the EC2 behind an **Application Load Balancer** with a stable DNS name.

---

## 8. GitHub Actions CI/CD Pipeline

### 8.1 What is CI/CD & Why It Matters

- **CI (Continuous Integration)**: Automatically build and test code when pushed
- **CD (Continuous Deployment)**: Automatically deploy passing builds to production

**Before CI/CD** (manual deployment):
```
1. SSH into EC2
2. git pull
3. npm install
4. npm run build
5. npx prisma generate
6. Restart the server
7. Hope nothing broke
```

**After CI/CD** (automated):
```
1. git push
2. ☕ Wait 2 minutes
3. Done — deployed automatically
```

---

### 8.2 The Two-Job Pipeline Explained

**File:** [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)

```yaml
name: Deploy Backend

on:
  push:
    branches: [ashmit]       # Only triggers on pushes to 'ashmit' branch
    paths:
      - 'backend/**'         # Only if backend files changed
      - '.github/workflows/deploy.yml'  # Or if the workflow itself changed
```

#### Job 1: `build-and-push`

```yaml
jobs:
  build-and-push:
    runs-on: ubuntu-latest    # GitHub provides a fresh Ubuntu VM

    steps:
      - uses: actions/checkout@v3           # Clone the repo
      - uses: docker/setup-buildx-action@v3 # Enable multi-platform builds

      - name: Login to Docker Hub
        run: echo "${{ secrets.DOCKER_PASSWORD }}" | \
             docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin

      - name: Build and Push Image
        run: |
          docker buildx build \
            --platform linux/amd64 \        # Ensure amd64 even though runner is already amd64
            -f backend/Dockerfile \         # Dockerfile location
            -t ${{ secrets.DOCKER_USERNAME }}/civic-backend:latest \
            --push backend/                 # Build context is the backend/ directory
```

**What this job does:**
1. Spins up a fresh Ubuntu VM on GitHub's servers
2. Clones the repo
3. Logs into Docker Hub with stored credentials
4. Builds the Docker image for linux/amd64
5. Pushes the image to Docker Hub as `atharva1255/civic-backend:latest`

#### Job 2: `deploy`

```yaml
  deploy:
    needs: build-and-push      # Only runs AFTER Job 1 succeeds
    runs-on: ubuntu-latest

    steps:
      - name: Deploy to EC2
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            docker pull ${{ secrets.DOCKER_USERNAME }}/civic-backend:latest
            docker stop backend || true     # Stop old container (|| true = don't fail if not running)
            docker rm backend   || true     # Remove old container
            docker run -d \
              -p 5001:5001 \
              --env-file /home/ubuntu/.env \
              --name backend \
              --restart always \
              ${{ secrets.DOCKER_USERNAME }}/civic-backend:latest
```

**What this job does:**
1. SSHs into the EC2 instance using the stored private key
2. Pulls the latest image from Docker Hub
3. Stops and removes the old container (graceful — doesn't fail if container doesn't exist)
4. Starts a new container with the updated image

#### Why two separate jobs instead of one?

1. **Separation of concerns**: Build and deploy are independent operations
2. **Failure isolation**: If the build fails, deploy never runs. If deploy fails, the image is still on Docker Hub for manual deployment.
3. **Reusability**: Could add a third job (e.g., run tests) between build and deploy
4. **Parallelization potential**: If we had multiple deployment targets, they could run in parallel after the build

---

### 8.3 Path-Based Triggers

```yaml
paths:
  - 'backend/**'
  - '.github/workflows/deploy.yml'
```

This means the pipeline **only triggers when backend files change**. If I update a frontend component, the backend is NOT redeployed. This is important because:
- Frontend deploys are handled by Netlify (separate CI/CD)
- Avoids unnecessary Docker builds (saves GitHub Actions minutes)
- No downtime from restarting the backend container for unrelated changes

---

### 8.4 GitHub Secrets & SSH Key Setup

**Secrets stored in GitHub repo settings:**

| Secret | Purpose |
|--------|---------|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub password (or access token) |
| `EC2_HOST` | EC2 public IP address |
| `EC2_USER` | `ubuntu` (default EC2 user) |
| `EC2_SSH_KEY` | RSA private key for SSH access |

**SSH key setup for CI/CD:**

```bash
# Generated a SEPARATE key pair for GitHub Actions (not my personal key)
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github_actions

# Added the PUBLIC key to EC2's authorized_keys
# Stored the PRIVATE key in GitHub Secrets as EC2_SSH_KEY
```

**Why a separate key?**
- **Principle of least privilege** — if the GitHub secret is compromised, only the CI/CD key is exposed, not my personal SSH key
- Can be revoked independently without losing my own access
- Different keys for different purposes = better audit trail

---

### 8.5 CI/CD Interview Q&A

**Q: "Walk me through your CI/CD pipeline."**
> When I push to the `ashmit` branch and the changes include backend files, GitHub Actions triggers a two-job pipeline. Job 1 builds the Docker image for linux/amd64 and pushes it to Docker Hub. Job 2 (which depends on Job 1 succeeding) SSHs into the EC2 instance, pulls the new image, stops the old container, and starts a new one. The entire process takes about 2 minutes.

**Q: "Why two jobs instead of one?"**
> Separation of concerns and failure isolation. If the Docker build fails, the deploy job never runs — so the running production container is unaffected. If the deploy fails, the built image is still available on Docker Hub for manual deployment. It also allows me to potentially insert a testing job between build and deploy.

**Q: "Why does the pipeline only run on backend changes?"**
> Using `paths: ['backend/**']` in the trigger config. Frontend deployments are handled separately by Netlify (which watches the frontend directory). This avoids unnecessary backend redeploys when only frontend code changes, saving CI/CD minutes and preventing needless container restarts.

**Q: "How do you handle secrets in the pipeline?"**
> All sensitive values (Docker Hub credentials, EC2 SSH key, EC2 IP) are stored as **GitHub encrypted secrets**. They're injected as environment variables at runtime using `${{ secrets.SECRET_NAME }}`. They never appear in logs — GitHub automatically masks them. The SSH key is a dedicated key pair generated specifically for CI/CD, not my personal key.

**Q: "What happens if the deploy fails mid-way?"**
> The `docker stop backend || true` and `docker rm backend || true` commands use `|| true` so they don't fail if the container doesn't exist (e.g., first deploy). If `docker run` fails, there's no running container, so the site goes down until I fix it. To improve this, I could add health checks and automatic rollback to the previous image tag.

**Q: "How would you improve this pipeline?"**
> Several ways: (1) Add a **test job** between build and deploy. (2) Use **image tags** (e.g., `civic-backend:v1.2.3`) instead of just `latest` — enables easy rollback. (3) Add a **health check** after deploy — curl the health endpoint and rollback if it fails. (4) Add **Slack/Discord notifications** on success/failure. (5) Use **blue-green deployment** — run new container alongside old, switch after health check.

**Q: "What is `appleboy/ssh-action`?"**
> It's a third-party GitHub Action that handles SSH connections. It takes the host, username, and private key as inputs, establishes an SSH connection to the server, and runs the provided script. It handles SSH key formatting, known hosts, and connection timeouts — things that would be tedious to do manually in a workflow step.

---

## 9. Netlify Frontend Deployment

### 9.1 How Netlify Works

Netlify is a **static site hosting platform** with built-in CI/CD. When I push frontend changes:

```
1. Netlify detects changes in the repo
2. Runs `npm run build` (Vite compiles React → static HTML/JS/CSS)
3. Deploys the `dist/` folder to its global CDN
4. Site is live at civic-frontend.netlify.app (and civic-connect.live)
```

**Why Netlify for frontend:**
- **CDN** — static files served from edge locations worldwide (fast)
- **Auto-deploy** — no CI/CD configuration needed
- **Free SSL** — managed automatically for custom domains
- **SPA support** — handles client-side routing fallback

---

### 9.2 SPA Fallback Configuration

**File:** [`netlify.toml`](netlify.toml)

```toml
[build]
  base    = "frontend"
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from   = "/*"
  to     = "/index.html"
  status = 200
```

**Why the `/* → /index.html` redirect is critical:**

React Router handles routing **on the client side**. When a user navigates to `/dashboard/issue/abc123`:
- Client-side: React Router intercepts and shows the right page ✅
- Direct URL (refresh or share link): Browser sends request to Netlify for `/dashboard/issue/abc123`
  - **Without redirect**: Netlify returns 404 (there's no `dashboard/issue/abc123.html` file) ❌
  - **With redirect**: Netlify returns `index.html` (status 200), React loads, React Router shows the right page ✅

---

### 9.3 Netlify Interview Q&A

**Q: "Why did you use Netlify for the frontend and not EC2?"**
> The React frontend compiles to static files (HTML, JS, CSS). Serving static files from EC2 would be slower (single server, no CDN) and more work (configure Nginx, handle caching headers). Netlify serves static files from a global CDN with edge caching, provides free SSL, and auto-deploys on git push — it's the right tool for static sites.

**Q: "What is the SPA fallback and why do you need it?"**
> Single Page Applications use client-side routing — the URL changes but the browser doesn't make new requests to the server. When a user directly navigates to a route like `/dashboard/issue/123` (by refreshing or sharing a link), the server needs to return `index.html` instead of a 404, because there's no physical file at that path. The `/* → /index.html` redirect in `netlify.toml` ensures this.

---

## 10. The `--restart always` Flag (Auto-Recovery)

```bash
docker run -d --restart always --name backend ...
```

**What it does:**
- If the Node.js process crashes → Docker restarts the container
- If EC2 reboots (OS update, hardware maintenance) → Docker daemon starts, restarts all containers with `--restart always`
- Uses **exponential backoff** for rapid failures (100ms, 200ms, 400ms... up to 5 minutes)

**Docker restart policies:**

| Policy | Behavior |
|--------|----------|
| `no` | Never restart (default) |
| `on-failure` | Restart only on non-zero exit code |
| `on-failure:5` | Restart on failure, max 5 attempts |
| `always` | Always restart, regardless of exit code |
| `unless-stopped` | Like `always`, but respects manual `docker stop` across daemon restarts |

**Why `always` and not `unless-stopped`?**
For a production server that must be up after every reboot, `always` is safest. `unless-stopped` won't restart if the container was manually stopped before the reboot — which could leave the server down after a power cycle.

---

## 11. Full Request Flow (End-to-End)

### Example: Citizen reports an issue

```
1. USER opens https://civic-connect.live/dashboard/report
   │
   │  DNS: civic-connect.live → 75.2.60.5 (Netlify)
   ▼
2. NETLIFY CDN serves index.html + JS bundle
   │
   │  React loads, React Router renders ReportIssue page
   ▼
3. USER fills form, clicks "Submit"
   │
   │  Frontend: api.issues.report(formData)
   │  → POST https://api.civic-connect.live/api/issues
   │  → FormData with image file + JWT in Authorization header
   ▼
4. DNS: api.civic-connect.live → 16.176.210.222 (EC2)
   │
   ▼
5. NGINX on EC2 (port 443)
   │  TLS handshake → decrypt HTTPS → plain HTTP
   │  proxy_pass → http://localhost:5001
   ▼
6. DOCKER CONTAINER (port 5001)
   │  Express receives the request
   │
   │  Middleware chain:
   │  ├── compression()
   │  ├── cors()
   │  ├── express.json()
   │  ├── authenticate()     → verify JWT, attach req.user
   │  ├── authorize("citizen") → check role
   │  ├── upload.single("image") → Multer buffers file in memory
   │  └── uploadToCloudinary()  → stream to Cloudinary CDN
   │
   │  Controller: reportIssue()
   │  ├── Validate input (Zod)
   │  ├── Promise.all([findDepartment, findDuplicateTicket])
   │  ├── Create ConsolidatedTicket (if new)
   │  ├── Create IssuePost
   │  ├── Fire-and-forget: notifications + email
   │  └── Socket.IO: emitIssueCreated(cityId, issue)
   ▼
7. RESPONSE flows back:
   Container → Nginx (encrypt) → Client (HTTPS)
   │
   ▼
8. SOCKET.IO broadcasts "issue:created" to city room
   │  All citizens in the same city see the new issue in real-time
   │  (WebSocket connection also goes through Nginx's proxy)
```

---

## 12. Common Mistakes I Made & Fixed

| Mistake | What happened | How I fixed it |
|---------|--------------|----------------|
| **arm64 Docker image on amd64 EC2** | Container crashed with `exec format error` immediately after starting | Used `docker buildx build --platform linux/amd64` |
| **Port 5001 left open in Security Group** | Backend was accessible without SSL at `http://EC2_IP:5001` | Removed port 5001 from security group; all traffic goes through Nginx |
| **Wrong proxy_pass port** | Nginx was proxying to `localhost:5000` but container was on 5001 | Updated Nginx config to match the `EXPOSE` port in Dockerfile |
| **HTTP instead of HTTPS for `VITE_API_URL`** | After setting up SSL, frontend was still calling `http://api...` → mixed content errors | Updated `.env.production` to use `https://api.civic-connect.live` and redeployed |
| **Missing `Upgrade` headers in Nginx** | Socket.IO fell back to long-polling instead of WebSocket | Added `proxy_set_header Upgrade $http_upgrade` and `Connection "upgrade"` |
| **Using personal SSH key for CI/CD** | Security risk — personal key stored in GitHub secrets | Generated a separate key pair specifically for GitHub Actions |
| **No `--restart always` initially** | After EC2 reboot (maintenance), the container didn't start back up | Added `--restart always` flag to `docker run` command |
| **DNS not propagated** | Domain showed blank page right after DNS setup | Waited 5 minutes for DNS propagation (TTL was 300s) |

---

## 13. Master Q&A (All Possible Questions)

### Architecture & Design

**Q: "Explain the architecture of your project."**
> The frontend is a React SPA hosted on Netlify's CDN. The backend is a Node.js/Express API with Socket.IO, running in a Docker container on AWS EC2. Nginx sits in front as a reverse proxy, handling SSL termination via Certbot. The database is PostgreSQL hosted on Supabase. Images are stored on Cloudinary CDN. DNS is split — the root domain points to Netlify, the `api` subdomain points to EC2. CI/CD is handled by GitHub Actions: it builds the Docker image and deploys to EC2 on every push.

**Q: "Why separate hosting for frontend and backend?"**
> The frontend compiles to static files — CDN hosting (Netlify) is ideal because it serves from edge locations worldwide with zero server management. The backend needs a persistent server for Socket.IO WebSocket connections, cron jobs, and long-running processes — so it runs on EC2. This also allows independent scaling and deployment of each.

**Q: "How do frontend and backend communicate in production?"**
> The frontend calls `https://api.civic-connect.live/api/*` for REST endpoints and connects to `https://api.civic-connect.live` for Socket.IO. CORS is configured on the backend to allow requests from `https://civic-connect.live`. In local development, Vite's proxy redirects `/api` and `/socket.io` to `localhost:5001` to avoid CORS issues.

### Deployment & Operations

**Q: "How do you deploy a new version?"**
> I push to the `ashmit` branch. GitHub Actions automatically builds a new Docker image, pushes it to Docker Hub, SSHs into EC2, pulls the new image, stops the old container, and starts a new one. The whole process takes about 2 minutes with zero manual intervention.

**Q: "Is there any downtime during deployment?"**
> There's a brief window (a few seconds) between stopping the old container and starting the new one. For zero-downtime deployment, I'd implement blue-green deployment: start the new container on a different port, health-check it, then switch Nginx's proxy_pass to the new port.

**Q: "How do you handle database migrations?"**
> Prisma handles schema changes. I use `prisma db push` for development and `prisma migrate` for versioned migrations. Since the database is hosted on Supabase (not inside the Docker container), schema changes are applied separately from application deployments.

**Q: "What happens if the EC2 instance runs out of disk space?"**
> Old Docker images accumulate over time. I'd periodically run `docker system prune` to clean up unused images, containers, and volumes. In a production setup, I'd add a cron job for this or use Docker's built-in `--storage-opt` limits.

**Q: "How would you scale this if traffic increased 100x?"**
> Multiple approaches: (1) Put EC2 behind an **Auto Scaling Group + ALB** for horizontal scaling. (2) Move Socket.IO to a managed service or add a **Redis adapter** so multiple instances share socket state. (3) Add **Redis caching** for frequently accessed data (dashboard stats, issue feeds). (4) Use **AWS RDS** or **Aurora** for the database instead of Supabase for better connection pooling. (5) Consider breaking out background jobs into a separate service.

### Debugging & Troubleshooting

**Q: "How would you debug a production issue?"**
> Steps: (1) Check container status: `docker ps` (is it running?). (2) Check container logs: `docker logs backend` (any errors?). (3) Check Nginx logs: `sudo tail /var/log/nginx/error.log`. (4) Test internal connectivity: `curl http://localhost:5001/api/health` from EC2 (bypasses Nginx). (5) Test external: `curl https://api.civic-connect.live/api/health`. (6) Check security groups if external fails but internal works.

**Q: "The site is down. How do you diagnose it?"**
> Systematic approach:
> 1. **Is it DNS?** → `dig api.civic-connect.live` (does it resolve to the right IP?)
> 2. **Is EC2 reachable?** → `ping 16.176.210.222` (check security groups if not)
> 3. **Is Nginx running?** → `sudo systemctl status nginx`
> 4. **Is the container running?** → `docker ps` (check `docker logs backend` if not)
> 5. **Is the app healthy?** → `curl localhost:5001/api/health` (from inside EC2)
> 6. **Is SSL valid?** → Check certificate expiry with `sudo certbot certificates`

### Security

**Q: "How do you handle security in production?"**
> Multiple layers: (1) **SSL everywhere** — all traffic encrypted via Nginx + Certbot. (2) **Port lockdown** — only ports 22, 80, 443 open; app port 5001 is internal only. (3) **Secrets management** — `.env` file on EC2, never in Git; GitHub Actions uses encrypted secrets. (4) **Separate SSH keys** — dedicated key for CI/CD, separate from personal key. (5) **JWT auth** — stateless, signed tokens with expiry. (6) **CORS** — only `civic-connect.live` can call the API. (7) **Input validation** — Zod schemas on every endpoint.

**Q: "What if someone gets access to your Docker Hub account?"**
> They could push a malicious image that gets auto-deployed by the CI/CD pipeline. Mitigations: (1) Enable 2FA on Docker Hub. (2) Use Docker Hub access tokens (scoped permissions) instead of account password. (3) Add image signing/verification in the pipeline. (4) Use a private container registry (ECR) instead of public Docker Hub.

---

> **💡 Pro tip for the interview:** Don't just recite answers — explain your **thought process**. When asked "how did you deploy?", walk through the architecture diagram. When asked "what problems did you face?", tell the arm64 story with the actual error message (`exec format error`). Real stories are more convincing than textbook answers.
