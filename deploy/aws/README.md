# AWS EC2 deployment

Deploy DevConnect on **Amazon Linux 2023** + **m7i-flex.large (8 GB)** or similar.

## Files

| File | Purpose |
|------|---------|
| `docker-compose.aws.yml` | All backend services + nginx + optional postgres/ollama |
| `docker-compose.aws-rds.yml` | Overlay when using Amazon RDS |
| `.env.example` | Environment template — copy to `.env` |
| `nginx/default.conf` | SPA + `/api` + WebSocket proxy |
| `Dockerfile.nginx` | Builds frontend + nginx |
| `ec2-user-data.sh` | EC2 bootstrap (Docker, swap) |
| `deploy.sh` | One-command deploy script |

## EC2 security group

| Port | Source | Purpose |
|------|--------|---------|
| 22 | Your IP | SSH |
| 80 | 0.0.0.0/0 | HTTP (app + API) |
| 443 | 0.0.0.0/0 | HTTPS (after certbot) |

Do **not** expose 5432, 8080, or 6379 publicly.

## Quick start

### 1. Launch EC2

- AMI: **Amazon Linux 2023**
- Type: **m7i-flex.large** (8 GiB)
- Storage: **40 GiB**
- Paste `ec2-user-data.sh` into **User data** (optional)
- Create/select a **key pair**

### 2. SSH and clone

```bash
ssh -i your-key.pem ec2-user@YOUR_EC2_IP
sudo mkdir -p /opt/devconnect && sudo chown ec2-user:ec2-user /opt/devconnect
git clone YOUR_REPO_URL /opt/devconnect
cd /opt/devconnect
```

### 3. Configure secrets

```bash
cp deploy/aws/.env.example deploy/aws/.env
nano deploy/aws/.env
```

Generate JWT secrets:

```bash
openssl rand -base64 32
```

Set `APP_CORS_ALLOWED_ORIGINS` to `http://YOUR_EC2_IP` (or your domain).

Leave `VITE_API_BASE_URL` **empty** — nginx serves frontend and proxies `/api` on the same origin.

### 4. Deploy

```bash
bash deploy/aws/deploy.sh
```

First build takes **15–30 minutes** on EC2.

### 5. Verify

```bash
curl http://localhost/actuator/health
curl http://localhost/api/auth/health   # if exposed
```

Open **http://YOUR_EC2_IP** in a browser.

## Optional: Ollama AI interview

```bash
# In deploy/aws/.env:
OLLAMA_BASE_URL=http://ollama:11434

bash deploy/aws/deploy.sh
docker exec -it devconnect-aws-ollama-1 ollama pull llama3.1
```

## Optional: Amazon RDS

1. Create RDS PostgreSQL; run `docker/init-databases.sql`.
2. In `.env`, set `RDS_HOST=...` and all `*_DB_URL` to RDS endpoints with `?sslmode=require`.
3. Redeploy — `deploy.sh` auto-detects `RDS_HOST` and skips local postgres.

## HTTPS (Let's Encrypt)

```bash
sudo dnf install -y certbot python3-certbot-nginx
# Stop nginx container temporarily or map 443 in compose
sudo certbot certonly --standalone -d your-domain.com
```

Point domain A record → EC2 public IP.

## Useful commands

```bash
docker compose -f deploy/aws/docker-compose.aws.yml --env-file deploy/aws/.env --profile local-db ps
docker compose -f deploy/aws/docker-compose.aws.yml --env-file deploy/aws/.env --profile local-db logs -f gateway-service
docker compose -f deploy/aws/docker-compose.aws.yml --env-file deploy/aws/.env --profile local-db down
```
