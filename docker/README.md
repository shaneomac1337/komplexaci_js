# Docker Deployment Guide

## Overview

This project uses GitHub Actions to automatically build and push Docker images to GitHub Container Registry (GHCR) on every push to master.

## Files

| File | Purpose |
|------|---------|
| `../Dockerfile` | Main Dockerfile used by GitHub Actions (multi-stage, Next.js standalone output, non-root runtime). |
| `../.dockerignore` | Build-context exclusions (keeps `.env`, `.git`, `node_modules`, etc. out of the image). |
| `docker-compose.yml` | Local/dev compose — builds the image from source. |
| `docker-compose.production.yml` | Production compose — pulls the pre-built image from GHCR. |

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
