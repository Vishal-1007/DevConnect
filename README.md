# DevConnect Backend

Spring Boot microservices for DevConnect — global developer networking and mentorship.

## Prerequisites

- **Java 21** (required; CI uses Temurin 21)
- Maven 3.9+
- **Node.js 20+** (for the React frontend)
- Docker (optional, for local Postgres/Redis and containerized services)
- PostgreSQL (one instance; multiple databases)

## Services

| Service | Port | Status |
|---------|------|--------|
| **gateway-service** | **8080** | **Single API entry — routes to all services** |
| **frontend** (Vite) | **5173** | **React UI — proxies to gateway in dev** |
| auth-service | 8081 | Auth, JWT, refresh tokens |
| user-service | 8082 | Profiles, skills, ratings |
| chat-service | 8083 | REST chat + WebSocket broadcast |
| notification-service | 8084 | In-app notifications |
| matching-service | 8085 | Skill-based matching |
| mentor-service | 8086 | Mentor profiles |
| analytics-service | 8087 | Scaffold |
| admin-service | 8088 | Scaffold |

## Quick start (local)

### Full stack (gateway + frontend)

```bash
docker compose up -d postgres redis
# Start backend services + gateway (see Option A below)
cd frontend && npm install && npm run dev
```

Open **http://localhost:5173** — the UI calls the gateway via Vite proxy.

### Option A — API Gateway (recommended for frontend)

Start Postgres/Redis, then run services + gateway. The frontend should call **only port 8080**:

```bash
docker compose up -d postgres redis

# Terminal 1..N: each service, or use your IDE
mvn -pl auth-service spring-boot:run
mvn -pl user-service spring-boot:run
# ... other services as needed

# Gateway (routes /api/* to services)
mvn -pl gateway-service spring-boot:run
```

Example: `POST http://localhost:8080/api/auth/login` → auth-service:8081

### Option B — Docker Compose (full stack)

```bash
cp .env.example .env
docker compose up --build
```

Only **8080** is exposed publicly; backend services talk on the internal Docker network.

### Option C — Direct service access (debugging)

```bash
mvn -pl auth-service spring-boot:run
```

Build all modules:

```bash
mvn clean package
```

## Production profile

Use `SPRING_PROFILES_ACTIVE=prod` for services with Flyway migrations (auth, user, matching, mentor):

- `hibernate.ddl-auto=validate`
- Flyway applies versioned SQL under `src/main/resources/db/migration/`

Example (Docker):

```bash
docker compose up --build auth-service user-service
```

## Docker

- `docker-compose.yml` — Postgres (multi-DB init), Redis, sample auth + user services
- `Dockerfile` — multi-stage build; pass `SERVICE=auth-service` (or any module)

```bash
docker compose up -d postgres redis
docker compose up --build auth-service
```

## CI

GitHub Actions workflow: `.github/workflows/ci.yml` — `mvn clean verify` on Java 21.

## Environment variables

See `.env.example`. **Never** deploy with default JWT secrets.

| Variable | Purpose |
|----------|---------|
| `JWT_ACCESS_TOKEN_SECRET` | Access token signing (32+ chars) |
| `JWT_REFRESH_TOKEN_SECRET` | Refresh token hashing (auth only) |
| `APP_CORS_ALLOWED_ORIGINS` | Frontend origins (comma-separated) |
| `*_DB_URL` | Per-service PostgreSQL JDBC URL |

## API Gateway routes

All paths below are accessed via **gateway** at `http://localhost:8080` (not individual service ports).

| Path prefix | Target service |
|-------------|----------------|
| `/api/auth/**` | auth-service |
| `/api/users/**` | user-service |
| `/api/chats/**` | chat-service |
| `/ws/chat/**` | chat-service (WebSocket) |
| `/api/notifications/**` | notification-service |
| `/api/matching/**` | matching-service |
| `/api/mentors/**` | mentor-service |
| `/api/analytics/**` | analytics-service |
| `/api/admin/**` | admin-service |

Inspect routes: `GET http://localhost:8080/actuator/gateway/routes` (when gateway is running).

Override upstream URLs with env vars (`AUTH_SERVICE_URI`, etc.) — see `.env.example`.

## AWS deployment

See **[deploy/aws/README.md](deploy/aws/README.md)** for EC2 deployment with Docker Compose, nginx, and `.env` configuration.

```bash
cp deploy/aws/.env.example deploy/aws/.env   # edit secrets
bash deploy/aws/deploy.sh
```

## API overview (MVP)

### Auth (via gateway `/api/auth`)

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me` (Bearer token)

### Users (`8082`)

- `GET /api/users/me` — auto-creates empty profile
- `PUT /api/users/me` — role, skills, experience, links
- `GET /api/users/{id}`
- `POST /api/users/{id}/ratings`

### Matching (`8085`)

- `PUT /api/matching/index` — register skills for matching
- `POST /api/matching/requests` — body: `{ "criteria": "...", "skills": ["java"], "experienceLevel": "junior" }`
- `GET /api/matching/requests/{id}/results`

### Mentors (`8086`)

- `GET /api/mentors` — available mentors
- `PUT /api/mentors/me` — mentor profile

### Chat (`8083`)

- REST: `/api/chats/conversations`, messages
- WebSocket: connect to `/ws/chat` (SockJS), subscribe to `/topic/conversations/{conversationId}`

## Production readiness roadmap

Your spec covers video (WebRTC), pair programming, mock interviews, AI, jobs, and more. Current backend covers **MVP slice**. Recommended phases:

### Phase 1 — Foundation (started in this repo)

- [x] Fix compile issues (jjwt deps, matching typo)
- [x] Docker Compose + Dockerfile + CI
- [x] Flyway + `prod` profile (auth, user, matching, mentor)
- [x] Rich profiles, ratings, skill matching, mentor list
- [x] WebSocket message broadcast (chat)
- [x] API Gateway (Spring Cloud Gateway + path routing)
- [ ] Centralized logging (ELK / CloudWatch) and metrics (Micrometer + Prometheus)

### Phase 2 — Real-time & collaboration

- [ ] Service discovery (Eureka/Consul) instead of static URIs
- [ ] **signaling-service** for WebRTC (STUN/TURN via coturn)
- [ ] **coding-room-service** (Yjs/Monaco or external CoderPad API)
- [ ] Redis for presence, match queues, session state
- [ ] Event bus (Kafka/RabbitMQ) for register → create profile, notifications

### Phase 3 — Product features

- [ ] Mock interview service + scorecards
- [ ] Community rooms
- [ ] OAuth2 (Google/GitHub) on auth-service
- [ ] Email verification (SES/SendGrid)
- [ ] Admin moderation APIs

### Phase 4 — Scale & monetization

- [ ] EKS/K8s Helm charts, HPA, CDN for static assets
- [ ] Premium billing (Stripe)
- [ ] AI matchmaking service (feature store + recommendations)

### Phase 5 — Frontend (in progress)

- [x] React + Tailwind + Redux app consuming gateway (`frontend/`)
- [ ] WebRTC client, pair-programming UI, interview flows

## Security checklist before go-live

1. Rotate all JWT secrets; use AWS Secrets Manager or similar
2. Enable HTTPS only; HSTS at load balancer
3. Rate limiting on auth and public endpoints
4. Report/moderation flows in admin-service
5. Penetration test on WebSocket and file upload paths (when added)

## Notes

- Each service owns its database (microservice pattern).
- Register in auth does not yet auto-call user-service; `GET /api/users/me` creates the profile on first access.
- Video, pair programming, and AI features require **new services** — not in this monorepo yet.
