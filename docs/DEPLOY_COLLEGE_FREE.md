# Deploy PredixRoute for Free (College Project)

This guide deploys the full stack at **$0/month** using free tiers. Best for demos, viva, and portfolio projects.

## Recommended stack (easiest)

| Service | Free provider | Role |
|---------|---------------|------|
| **App server** | [Oracle Cloud Always Free VM](https://www.oracle.com/cloud/free/) | Runs Docker Compose (backend, worker, AI, frontend, nginx) |
| **Database** | [MongoDB Atlas M0](https://www.mongodb.com/cloud/atlas/register) | 512 MB cluster (optional — you can use MongoDB inside Docker on the VM instead) |
| **Redis** | [Upstash Redis](https://upstash.com/) | 500K commands/month (optional — Redis in Docker on VM works too) |
| **Frontend CDN** | [Vercel](https://vercel.com) or Render static site | Optional; nginx on the VM already serves the UI |

**Simplest path:** one Oracle VM + Docker Compose with MongoDB and Redis included (no extra accounts needed).

---

## Option A — Single Oracle VM (recommended)

### 1. Create the VM

1. Sign up at [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/).
2. **Compute → Instances → Create instance**
3. Shape: **VM.Standard.A1.Flex** (Ampere ARM) — **2 OCPUs, 12 GB RAM**
4. Image: **Ubuntu 22.04** (ARM)
5. Add your SSH public key
6. Open ports in the **Security List / Network Security Group**:
   - `22` (SSH)
   - `80` (HTTP)
   - `443` (HTTPS, optional for now)
7. Note the **public IP**

### 2. Install Docker on the VM

SSH in, then:

```bash
sudo apt update && sudo apt install -y git
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
```

### 3. Clone and configure

```bash
git clone https://github.com/YOUR_USERNAME/PredixRoute.git
cd PredixRoute
cp .env.production.example .env
nano .env   # fill in secrets (see below)
```

**Generate strong secrets:**

```bash
openssl rand -hex 32   # use for JWT_ACCESS_SECRET
openssl rand -hex 32   # use for JWT_REFRESH_SECRET
openssl rand -hex 24   # use for AI_SERVICE_INTERNAL_TOKEN
```

Set `FRONTEND_URL=http://YOUR_VM_PUBLIC_IP` (or your domain later).

### 4. Deploy

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Wait 3–5 minutes for builds. Then open:

- **App:** `http://YOUR_VM_PUBLIC_IP`
- **Health:** `http://YOUR_VM_PUBLIC_IP/api/v1/health`

### 5. Seed demo data (optional)

```bash
docker compose exec backend npm run seed
```

Demo logins (after seed):

| Portal | Email | Password |
|--------|-------|----------|
| Customer | `admin@demo-logistics.com` | `Demo@123456` |
| Admin | `superadmin@predixroute.com` | `Demo@123456` |

### 6. Train the ML model (first time)

```bash
docker compose exec ai-service python scripts/train_risk_model.py
```

Or upload a CSV via **Admin → Model Training** in the UI.

### 7. Keep the VM alive

Oracle may reclaim **idle** Always Free VMs (low CPU/network/memory for 7 days). For a college demo:

- Hit `/api/v1/health` daily, or
- Use [UptimeRobot](https://uptimerobot.com) (free) to ping every 5 minutes

---

## Option B — Split free services (no VM)

Use this if Oracle signup fails or you prefer managed services.

| Component | Deploy to | Notes |
|-----------|-----------|-------|
| MongoDB | MongoDB Atlas M0 | Free forever |
| Redis | Upstash | Free tier |
| Backend | Render free web service | Sleeps after 15 min idle (~30–60s cold start) |
| AI service | Render free web service | Second web service |
| Frontend | Vercel (static) | Always on, free |
| Worker | **Problem** | Render free has no background workers — run worker in backend process for demo only |

This option needs code/config changes and is **harder** than Option A. Prefer Option A.

---

## Environment variables (production)

Copy `.env.production.example` → `.env` on the server.

**Required:**

- `MONGO_ROOT_PASSWORD` — strong password
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — 32+ chars each
- `AI_SERVICE_INTERNAL_TOKEN` — 16+ chars
- `FRONTEND_URL` — public URL (IP or domain)
- `ADMIN_REGISTRATION_SECRET` — blocks random admin signups

**Optional (features):**

- `SMTP_*` — email verification / password reset
- `TWILIO_*` + `OPENAI_API_KEY` — COD WhatsApp verification

---

## Custom domain (optional)

1. Buy a domain (~$1–10/year) or use a free subdomain.
2. Point an **A record** to your VM IP.
3. Update `FRONTEND_URL=https://yourdomain.com` in `.env`.
4. Add TLS with Caddy or Certbot on the VM (see Phase 26 DevOps doc).

---

## Troubleshooting

```bash
# View logs
docker compose logs -f backend
docker compose logs -f ai-service

# Restart everything
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Check health
curl http://localhost/api/v1/health
```

**Build fails on ARM (Oracle A1):** Docker images use multi-arch; if a package fails, ensure you are on Ubuntu ARM64, not x86.

**Out of memory:** Use external MongoDB Atlas + Upstash and remove `mongodb` / `redis` services from compose, pointing `MONGODB_URI` and `REDIS_URL` to cloud URLs.

---

## Cost summary

| Item | Cost |
|------|------|
| Oracle VM (2 OCPU, 12 GB) | $0 |
| MongoDB Atlas M0 | $0 |
| Upstash Redis | $0 |
| UptimeRobot ping | $0 |
| **Total** | **$0/month** |

Good for college demos. Not for production traffic.
