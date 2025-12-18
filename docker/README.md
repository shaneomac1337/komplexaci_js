# Docker Deployment Guide

## Overview

This project uses GitHub Actions to automatically build and push Docker images to GitHub Container Registry (GHCR) on every push to master.

## Files

| File | Purpose |
|------|---------|
| `../Dockerfile` | Main Dockerfile used by GitHub Actions |
| `docker-compose.production.yml` | Production compose file (pulls from GHCR) |
| `Dockerfile.server-build` | BACKUP: Old Dockerfile that cloned repo during build |
| `docker-compose.server-build.yml` | BACKUP: Old compose file that built on server |

## Setup (One-time)

### 1. Add GitHub Secrets

Go to your repo → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

### 2. Update Server

On your production server, replace docker-compose.yml with docker-compose.production.yml content.

## Deployment

### Automatic (on push to master)

1. Push to master branch
2. GitHub Actions builds and pushes image to GHCR (~3-5 minutes)
3. SSH to server and run:
   ```bash
   cd /opt/komplexaci_web
   docker compose pull
   docker compose up -d
   ```

### Manual Trigger

Go to GitHub → Actions → "Build and Push Docker Image" → Run workflow

## Rollback

If something goes wrong, use the backups in `/opt/komplexaci_web/backup/`
