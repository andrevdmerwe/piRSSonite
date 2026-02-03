# Docker Deployment Guide for piRSSonite

This guide provides detailed, step-by-step instructions for deploying piRSSonite using Docker for the first time.

---

## Part 1: Triggering the Build

### Step 1.1: Push Your Code to GitHub

If you haven't already, commit and push your latest code to the `main` branch:

```bash
cd /home/andre/Documents/Development/piRSSonite
git add .
git commit -m "Deploy piRSSonite"
git push origin main
```

### Step 1.2: Wait for GitHub Actions to Complete

1. Go to your GitHub repository: `https://github.com/andrevdmerwe/piRSSonite`
2. Click on the **"Actions"** tab at the top.
3. You should see a workflow run in progress (or completed). It will be named "Docker".
4. Click on it to see the details. Wait until all steps show a green checkmark ✅.
5. If it fails, click on the failed step to see the error logs.

Once successful, your Docker image is now available at:
```
ghcr.io/andrevdmerwe/pirssonite:main
```

---

## Part 2: Setting Up Your Server

These steps are performed on the machine where you want to run piRSSonite (your server, VPS, or local machine).

### Step 2.1: Install Docker (if not already installed)

**On Ubuntu/Debian:**
```bash
# Update package index
sudo apt update

# Install Docker
sudo apt install -y docker.io

# Start Docker and enable it to run on boot
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to the docker group (so you don't need sudo)
sudo usermod -aG docker $USER

# Log out and log back in for the group change to take effect
# Or run: newgrp docker
```

**Verify Docker is working:**
```bash
docker --version
# Should output something like: Docker version 24.0.x, build xxxxxxx
```

---

## Part 3: Pulling and Running the Container

### Step 3.1: Create a Personal Access Token (PAT) on GitHub

You need a GitHub PAT to pull your private container image.

1. Go to: `https://github.com/settings/tokens`
2. Click **"Generate new token (classic)"**
3. Give it a name like `pirssonite-deploy`
4. Set an expiration (or choose "No expiration" for convenience)
5. Check the following scope:
   - ☑️ `read:packages` (Download packages from GitHub Package Registry)
6. Click **"Generate token"**
7. **COPY THE TOKEN NOW** — you won't be able to see it again!

### Step 3.2: Authenticate Docker with GitHub Container Registry

On your server, run the following command. Replace `YOUR_PAT_TOKEN` with the token you just copied:

```bash
echo "YOUR_PAT_TOKEN" | docker login ghcr.io -u andrevdmerwe --password-stdin
```

You should see:
```
Login Succeeded
```

### Step 3.3: Create a Directory for Persistent Data

The SQLite database needs to persist across container restarts. Create a directory on your server:

```bash
# Navigate to where you want to store the data (e.g., your home directory)
cd ~

# Create the data directory
mkdir -p pirssonite-data

# Set the correct ownership (the container runs as user ID 1001)
sudo chown 1001:1001 pirssonite-data
```

### Step 3.4: Pull and Run the Container

Now run the container:

```bash
docker run -d \
  --name pirssonite \
  --restart always \
  -p 3000:3000 \
  -v ~/pirssonite-data:/app/prisma \
  ghcr.io/andrevdmerwe/pirssonite:main
```

**Explanation of the flags:**
| Flag | Meaning |
|------|---------|
| `-d` | Run in detached mode (in the background) |
| `--name pirssonite` | Give the container a friendly name |
| `--restart always` | Automatically restart the container if it crashes or the server reboots |
| `-p 3000:3000` | Map port 3000 on your server to port 3000 in the container |
| `-v ~/pirssonite-data:/app/prisma` | Mount your data directory into the container |
| `ghcr.io/andrevdmerwe/pirssonite:main` | The image to run |

### Step 3.5: Verify the Container is Running

```bash
docker ps
```

You should see output like:
```
CONTAINER ID   IMAGE                                    STATUS          PORTS
abc123def456   ghcr.io/andrevdmerwe/pirssonite:main    Up 10 seconds   0.0.0.0:3000->3000/tcp
```

### Step 3.6: Access the Application

Open your web browser and navigate to:
- **Local machine:** `http://localhost:3000`
- **Remote server:** `http://YOUR_SERVER_IP:3000`

🎉 **Congratulations!** piRSSonite is now running!

---

## Part 4: Common Commands

### View Container Logs
```bash
docker logs pirssonite
```

### Follow Logs in Real-Time
```bash
docker logs -f pirssonite
```

### Stop the Container
```bash
docker stop pirssonite
```

### Start the Container Again
```bash
docker start pirssonite
```

### Restart the Container
```bash
docker restart pirssonite
```

### Remove the Container (to redeploy)
```bash
docker stop pirssonite
docker rm pirssonite
```

---

## Part 5: Updating piRSSonite

When you push new code to `main`, GitHub Actions will build a new image. To update your running container:

```bash
# Pull the latest image
docker pull ghcr.io/andrevdmerwe/pirssonite:main

# Stop and remove the old container
docker stop pirssonite
docker rm pirssonite

# Run the new container (same command as before)
docker run -d \
  --name pirssonite \
  --restart always \
  -p 3000:3000 \
  -v ~/pirssonite-data:/app/prisma \
  ghcr.io/andrevdmerwe/pirssonite:main
```

Your data in `~/pirssonite-data` will persist across updates.

---

## Troubleshooting

### "Permission denied" when accessing the data directory
```bash
sudo chown -R 1001:1001 ~/pirssonite-data
```

### Container keeps restarting
Check the logs for errors:
```bash
docker logs pirssonite
```

### Port 3000 is already in use
Either stop the other process using port 3000, or use a different port:
```bash
docker run -d \
  --name pirssonite \
  --restart always \
  -p 8080:3000 \
  -v ~/pirssonite-data:/app/prisma \
  ghcr.io/andrevdmerwe/pirssonite:main
```
Then access via `http://localhost:8080`.

### "unauthorized" when pulling the image
Your PAT may have expired or doesn't have the right permissions. Generate a new one and re-authenticate with `docker login`.
