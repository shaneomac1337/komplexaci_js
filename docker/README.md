# Docker Deployment

This project is deployed as a Docker container from GitHub Container Registry.

## Production Source Of Truth

The live production configuration is on the server:

```bash
ssh root@ssh.komplexaci.cz
cd /opt/komplexaci_web
cat docker-compose.yml
```

Use that server compose file as the source of truth for the current deployment.
The compose files in this repository are templates/reference copies and should be
kept aligned with the server when deployment behavior changes.

Current production facts verified on 2026-04-26:

- Server path: `/opt/komplexaci_web`
- Container: `komplexaci-web`
- Image: `ghcr.io/shaneomac1337/komplexaci_js:latest`
- Network mode: `host`
- Runtime env file: `/opt/komplexaci_web/.env`
- Analytics data env: `ANALYTICS_DATA_DIR=/app/data`
- Persistent Docker volume: `komplexaci_web_analytics-data`
- Container mount: `/app/data`
- Host volume path: `/var/lib/docker/volumes/komplexaci_web_analytics-data/_data`

## Files

| File | Purpose |
| --- | --- |
| `../Dockerfile` | Multi-stage Next.js standalone image used by GitHub Actions. |
| `../.dockerignore` | Excludes secrets, local DB files, build output, and scratch files from the image build context. |
| `docker-compose.yml` | Local/reference compose that builds from source. |
| `docker-compose.production.yml` | Reference production compose that pulls the GHCR image. |

## Image Publishing

GitHub Actions builds and pushes the Docker image on every push to `master`:

```text
ghcr.io/shaneomac1337/komplexaci_js:latest
```

Required GitHub Actions secrets:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Runtime secrets such as Discord tokens and NextAuth secrets are not baked into
the image. They come from `/opt/komplexaci_web/.env` on the production server.

## Deploy

On the production server:

```bash
cd /opt/komplexaci_web
docker compose pull
docker compose up -d
docker compose ps
```

Check health:

```bash
docker ps --filter name=komplexaci-web
curl -fsS http://127.0.0.1:3000/api/health
```

## Persistent Analytics Storage

Analytics data is stored in SQLite under `ANALYTICS_DATA_DIR`. In production:

```text
ANALYTICS_DATA_DIR=/app/data
```

The compose file mounts this path to a named Docker volume:

```yaml
volumes:
  - analytics-data:/app/data
```

Because the compose project directory is `/opt/komplexaci_web`, Docker names the
volume:

```text
komplexaci_web_analytics-data
```

The database files are:

```text
/app/data/analytics.db
/app/data/analytics.db-shm
/app/data/analytics.db-wal
```

They survive image pulls, container recreation, and `docker compose up -d`.
They do not survive deleting the Docker volume.

Useful checks:

```bash
docker volume inspect komplexaci_web_analytics-data
docker exec komplexaci-web ls -lah /app/data
docker exec komplexaci-web du -sh /app/data
```

## Backup

If `sqlite3` is available in the running image, create a SQLite-safe backup:

```bash
docker exec komplexaci-web sh -lc \
  "sqlite3 /app/data/analytics.db \".backup '/app/data/analytics-backup-$(date +%Y%m%d-%H%M%S).db'\""
```

If `sqlite3` is not available in the image, copy the DB files only after
stopping the app or use a temporary container with the volume mounted.

## Rollback

If the latest image is bad:

```bash
cd /opt/komplexaci_web
docker compose images
docker compose pull
docker compose up -d
```

If you need a specific historical image, edit `/opt/komplexaci_web/docker-compose.yml`
to use that tag, then run:

```bash
docker compose up -d
```
