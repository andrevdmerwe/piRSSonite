# Docker Deployment Guide for piRSSonite

This guide details how to build and deploy the piRSSonite application using the now configured Docker setup and GitHub Actions.

## Prerequisites

1.  **Docker Installed** on your deployment server/machine.
2.  **GitHub Repository** connected.
3.  **GitHub Token** (automatically provided in Actions, but you need a Personal Access Token (PAT) for local login if pulling from GHCR).

---

## Deployment (Running the Container)

The project is now configured with a `Dockerfile` and a GitHub Actions workflow (`.github/workflows/docker-publish.yml`).
Whenever you push to the `main` branch, a new Docker image will be automatically built and pushed to the GitHub Container Registry (GHCR).

### 1. Authenticate with GitHub Container Registry
On your server or local machine:

```bash
# Create a Personal Access Token (PAT) on GitHub with 'read:packages' scope.
# Login using your GitHub username and the PAT as password.
echo "YOUR_PAT_TOKEN" | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

### 2. Prepare the Database Volume
Create a folder on your host machine to store the SQLite database so it persists across restarts.

```bash
mkdir -p pirssonite-data
# Ensure the container user (uid 1001) can write to it
chown 1001:1001 pirssonite-data
```

### 3. Run the Container
Replace `YOUR_USERNAME` with your GitHub username (lowercase).

```bash
docker run -d \
  --name pirssonite \
  --restart always \
  -p 3000:3000 \
  -v $(pwd)/pirssonite-data:/app/prisma \
  ghcr.io/your_username/pirssonite:main
```

### 4. Verify
Access the application at `http://localhost:3000`.

---

## Notes on SQLite in Docker
Since SQLite is a file-based database, mounting the volume (`-v`) is crucial. If you don't mount a volume, your data will be lost every time the container recreates.
- The `Dockerfile` sets up `/app/prisma` as the location for the DB.
- The container start command runs `prisma db push` to ensure the schema starts correctly.
