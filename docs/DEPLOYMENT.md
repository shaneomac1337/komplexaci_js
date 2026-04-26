# Deployment Runbook

This document describes the current production deployment. Older notes about
Vercel, manual Node.js services, `/var/www/komplexaci`, `DATABASE_PATH`, and
systemd are historical and should not be used for this app unless production is
changed again.

## Current Production Source Of Truth

The live configuration is on the production server:

```bash
ssh root@ssh.komplexaci.cz
cd /opt/komplexaci_web
cat docker-compose.yml
```

Use `/opt/komplexaci_web/docker-compose.yml` as the source of truth. Repository
compose files are reference copies and must be kept aligned with the server.

Verified on 2026-04-26:

| Item | Value |
| --- | --- |
| Server | `root@ssh.komplexaci.cz` |
| Deploy directory | `/opt/komplexaci_web` |
| Runtime compose | `/opt/komplexaci_web/docker-compose.yml` |
| Container | `komplexaci-web` |
| Image | `ghcr.io/shaneomac1337/komplexaci_js:latest` |
| Network | `host` |
| Runtime env file | `/opt/komplexaci_web/.env` |
| App port | `3000` |
| Analytics data env | `ANALYTICS_DATA_DIR=/app/data` |
| Analytics volume | `komplexaci_web_analytics-data` |
| Analytics mount | `/app/data` |

## Architecture

Deployment flow:

1. Push to `master`.
2. GitHub Actions builds the Docker image from `Dockerfile`.
3. GitHub Actions pushes the image to GHCR.
4. Production pulls `ghcr.io/shaneomac1337/komplexaci_js:latest`.
5. Docker Compose recreates `komplexaci-web`.
6. Analytics data remains in the Docker named volume.

The app is a Next.js standalone Docker image. Runtime secrets are not baked into
the image; they come from `/opt/komplexaci_web/.env`.

## Deploy

Run on production:

```bash
ssh root@ssh.komplexaci.cz
cd /opt/komplexaci_web
docker compose pull
docker compose up -d
docker compose ps
```

Check the app:

```bash
curl -fsS http://127.0.0.1:3000/api/health
docker ps --filter name=komplexaci-web
```

Follow logs:

```bash
docker logs -f --tail=200 komplexaci-web
```

## Runtime Configuration

Production runtime variables live in:

```text
/opt/komplexaci_web/.env
```

Do not commit this file. Do not print it in logs or support tickets.

Important runtime variables:

| Variable | Purpose |
| --- | --- |
| `DISCORD_BOT_TOKEN` | Discord bot token for gateway/API access. |
| `DISCORD_SERVER_ID` | Discord guild ID to monitor. |
| `ENABLE_DISCORD_GATEWAY` | Enables real-time Discord gateway connection when set to `true`. |
| `NEXTAUTH_URL` | Public app URL for auth callbacks. |
| `NEXTAUTH_SECRET` | NextAuth secret. |
| `ANALYTICS_DATA_DIR` | Directory containing `analytics.db`; production uses `/app/data`. |
| `NODE_ENV` | Production uses `production`. |
| `PORT` | Production uses `3000`. |

The current analytics code reads `ANALYTICS_DATA_DIR`, not `DATABASE_PATH`.

## Persistent Analytics Storage

SQLite analytics data is persistent in production.

Compose mounts:

```yaml
volumes:
  - analytics-data:/app/data
```

Docker expands that to the actual volume:

```text
komplexaci_web_analytics-data
```

Current host path:

```text
/var/lib/docker/volumes/komplexaci_web_analytics-data/_data
```

Current container files:

```text
/app/data/analytics.db
/app/data/analytics.db-shm
/app/data/analytics.db-wal
```

Safe checks:

```bash
docker volume inspect komplexaci_web_analytics-data
docker exec komplexaci-web ls -lah /app/data
docker exec komplexaci-web du -sh /app/data
```

Do not delete the volume unless you intentionally want to remove production
analytics history.

## Backup

If `sqlite3` is available in the running image, use SQLite's online backup:

```bash
docker exec komplexaci-web sh -lc \
  "sqlite3 /app/data/analytics.db \".backup '/app/data/analytics-backup-$(date +%Y%m%d-%H%M%S).db'\""
```

If the image does not include `sqlite3`, use one of these options:

1. Stop the app, copy all `analytics.db*` files from the volume, then start it.
2. Run a temporary SQLite container with `komplexaci_web_analytics-data` mounted.

Stop/copy/start example:

```bash
cd /opt/komplexaci_web
docker compose stop
mkdir -p backup
cp /var/lib/docker/volumes/komplexaci_web_analytics-data/_data/analytics.db* backup/
docker compose up -d
```

## Restore

Restoring analytics replaces production history. Make a backup first.

```bash
cd /opt/komplexaci_web
docker compose stop
cp backup/analytics.db /var/lib/docker/volumes/komplexaci_web_analytics-data/_data/analytics.db
rm -f /var/lib/docker/volumes/komplexaci_web_analytics-data/_data/analytics.db-shm
rm -f /var/lib/docker/volumes/komplexaci_web_analytics-data/_data/analytics.db-wal
docker compose up -d
```

Then verify:

```bash
docker logs --tail=100 komplexaci-web
curl -fsS http://127.0.0.1:3000/api/health
```

## Rollback

The normal rollback path is to run a previously known-good image tag.

1. Find available tags in GHCR or from deployment history.
2. Edit `/opt/komplexaci_web/docker-compose.yml`.
3. Change the `image:` tag.
4. Recreate the container:

```bash
cd /opt/komplexaci_web
docker compose up -d
docker compose ps
```

Analytics data is not rolled back by changing the image. It remains in
`komplexaci_web_analytics-data`.

## Troubleshooting

Check container state:

```bash
docker compose ps
docker logs --tail=200 komplexaci-web
```

Check health:

```bash
curl -v http://127.0.0.1:3000/api/health
```

Check persistent data:

```bash
docker exec komplexaci-web ls -lah /app/data
docker volume inspect komplexaci_web_analytics-data
```

Check which compose file is active:

```bash
cd /opt/komplexaci_web
docker compose config
```

If docs and server disagree, trust the server and update the docs.
