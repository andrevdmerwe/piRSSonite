# GitHub Repository Setup Guide for piRSSonite

## Initial Setup Completed

The following steps have already been completed on 2026-01-19:

###  Phase 1: Clean Up Incorrect Git Repository

**Problem:** Git was initialized in the home directory (`C:\Users\andre\.git`) instead of the project directory.

**Solution:**
```bash
cd ~
rm -rf .git
```

**Verification:**
```bash
git status  # Shows "not a git repository"
```

---

###  Phase 2: Initialize Git in Project Directory

**Step 1: Navigate to project directory**
```bash
cd C:\Users\andre\OneDrive\Documents\ClaudeCode\piRSSonite
```

**Step 2: Create .gitignore file**

Created `.gitignore` with the following contents:
```
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js build output
.next/
out/
dist/
build/

# Production
*.tsbuildinfo
next-env.d.ts

# Debug logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Database
*.db
*.db-journal
prisma/dev.db
prisma/dev.db-journal

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Claude Code
.claude/
*.md.backup

# Temporary files
*.tmp
*.temp
reference_images/
```

**Step 3: Initialize git repository**
```bash
git init
```

Output: `Initialized empty Git repository in C:/Users/andre/OneDrive/Documents/ClaudeCode/piRSSonite/.git/`

**Step 4: Verify git user configuration**
```bash
git config --global user.name
git config --global user.email
```

Output:
```
Andre van der Merwe
andrevdmerwe@gmail.com
```

**Step 5: Add all files to staging**
```bash
git add .
```

**Step 6: Review staged files**
```bash
git status
```

**Files committed (81 files, 15,449 lines):**
- `app/` - Next.js application code
- `components/` - React components
- `lib/` - Utility functions and types
- `prisma/` - Database schema and migrations
- `openspec/` - Project specifications
- `package.json`, `package-lock.json` - Dependencies
- `tailwind.config.js`, `tsconfig.json`, etc. - Configuration files
- Documentation files: `CLAUDE.md`, `AGENTS.md`, `my_notes.md`, etc.

**Files excluded (via .gitignore):**
- `node_modules/`
- `.next/`
- `*.db` files
- `.claude/`
- `reference_images/`

**Step 7: Create initial commit**
```bash
git commit -m "Initial commit: piRSSonite RSS reader application

Features:
- Next.js 15 + React 19 + TypeScript setup
- SQLite database with Prisma ORM
- RSS/Atom feed fetching with auto-refresh
- WebSub integration for push notifications
- Entry state management (read/unread/starred)
- Folder organization for feeds
- OPML import/export
- Dark theme UI with Tailwind CSS"
```

Output: `[master (root-commit) 72b6688]`

**Step 8: Verify git setup**
```bash
git log --oneline
git status
```

Output:
```
72b6688 Initial commit: piRSSonite RSS reader application
---
On branch master
nothing to commit, working tree clean
```

---

## Next Steps: Push to GitHub

### Phase 3: Create GitHub Repository

**Option A: Via GitHub Web Interface (Recommended)**

1. Go to https://github.com/new
2. **Repository name:** `piRSSonite`
3. **Description:** `Self-hosted RSS reader with WebSub support`
4. **Visibility:** Choose Public or Private
5. **IMPORTANT:** Leave these **unchecked**:
   - L Add a README file
   - L Add .gitignore
   - L Choose a license

   (We already have these files locally)

6. Click **"Create repository"**

**Option B: Via GitHub CLI (if installed)**
```bash
gh repo create piRSSonite --public --description "Self-hosted RSS reader with WebSub support" --source=. --remote=origin
```

Note: GitHub CLI is currently not installed on this system.

---

### Phase 4: Connect Local Repository to GitHub

**Step 1: Add GitHub remote**

After creating the repo on GitHub, you'll see a URL like:
```
https://github.com/YOUR_USERNAME/piRSSonite.git
```

Add it as remote (replace YOUR_USERNAME with your actual GitHub username):
```bash
git remote add origin https://github.com/YOUR_USERNAME/piRSSonite.git
```

**Step 2: Verify remote**
```bash
git remote -v
```

Expected output:
```
origin  https://github.com/YOUR_USERNAME/piRSSonite.git (fetch)
origin  https://github.com/YOUR_USERNAME/piRSSonite.git (push)
```

**Step 3: Rename branch to main (GitHub standard)**
```bash
git branch -M main
```

**Step 4: Push to GitHub**
```bash
git push -u origin main
```

---

### Phase 5: Authentication

When pushing, you'll be prompted for credentials:

**Username:** Your GitHub username

**Password:** Use a **Personal Access Token** (NOT your actual password)

#### To Create a Personal Access Token:

1. Go to https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Give it a name like **"piRSSonite"** or **"Development Machine"**
4. Set expiration (recommend 90 days or custom)
5. Select scopes:
   -  **`repo`** (full control of private repositories)
6. Click **"Generate token"**
7. **Copy the token** - you won't be able to see it again!
8. Use this token as your password when running `git push`

#### Alternative: SSH Authentication

If you prefer SSH (more secure, no password needed):

1. Generate SSH key (if you don't have one):
```bash
ssh-keygen -t ed25519 -C "andrevdmerwe@gmail.com"
```

2. Add SSH key to ssh-agent:
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

3. Copy your public key:
```bash
cat ~/.ssh/id_ed25519.pub
```

4. Add to GitHub:
   - Go to https://github.com/settings/keys
   - Click "New SSH key"
   - Paste your public key
   - Click "Add SSH key"

5. Change remote to SSH:
```bash
git remote set-url origin git@github.com:YOUR_USERNAME/piRSSonite.git
```

6. Push:
```bash
git push -u origin main
```

---

### Phase 6: Verification

**Step 1: Verify on GitHub**
1. Visit `https://github.com/YOUR_USERNAME/piRSSonite`
2. Confirm all files are present
3. Check that `.gitignore` is working (node_modules, .next not present)
4. Verify commit message and commit count

**Step 2: Verify locally**
```bash
git status
# Should show: "Your branch is up to date with 'origin/main'"

git log --oneline
# Should show your initial commit

git remote -v
# Should show origin pointing to GitHub
```

---

## Daily Git Workflow (After Initial Setup)

### Making Changes

```bash
# 1. Check current status
git status

# 2. See what changed
git diff

# 3. Stage all changes
git add .

# Or stage specific files
git add path/to/file.ts

# 4. Commit with descriptive message
git commit -m "Add feature X"

# 5. Push to GitHub
git push
```

### Viewing History

```bash
# Compact log
git log --oneline

# Last 5 commits
git log --oneline -5

# Visual branch graph
git log --graph --all --oneline

# Show changes in a commit
git show COMMIT_HASH
```

### Branch Management

```bash
# List all branches
git branch

# Create new branch
git checkout -b feature-name

# Switch to existing branch
git checkout branch-name

# Merge branch into current branch
git merge branch-name

# Delete branch (after merging)
git branch -d branch-name

# Push new branch to GitHub
git push -u origin branch-name
```

### Undoing Changes

```bash
# Discard changes in working directory
git checkout -- file.txt

# Unstage a file (keep changes)
git reset HEAD file.txt

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes) - DANGEROUS
git reset --hard HEAD~1
```

### Syncing with GitHub

```bash
# Fetch changes from GitHub (doesn't merge)
git fetch origin

# Pull changes from GitHub (fetches and merges)
git pull origin main

# Push local commits to GitHub
git push origin main
```

---

## Post-Setup Recommendations

### 1. Create README.md

Add a comprehensive README with:
- Project description
- Features list
- Installation instructions
- Setup guide (npm install, prisma setup, etc.)
- Usage instructions
- Screenshots
- License information

Example structure:
```markdown
# piRSSonite

Self-hosted RSS reader with WebSub support

## Features

- RSS/Atom feed aggregation
- Real-time updates with WebSub
- Folder organization
- OPML import/export
- Dark theme UI

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up database: `npx prisma migrate dev`
4. Run dev server: `npm run dev`

## License

MIT
```

### 2. Add LICENSE File

Choose an appropriate open-source license:
- **MIT License** - Most permissive
- **GPL-3.0** - Copyleft, requires derivatives to be open source
- **Apache 2.0** - Similar to MIT with patent protection

Add via GitHub web interface or create locally.

### 3. Set Up Branch Protection (Optional)

For collaborative development:
1. Go to repository **Settings ’ Branches**
2. Click **"Add rule"**
3. Branch name pattern: `main`
4. Enable:
   -  Require pull request reviews before merging
   -  Require status checks to pass before merging
5. Save changes

### 4. Configure GitHub Actions (Future)

For CI/CD automation:
- Automated testing on push
- Build verification
- Deployment to production

Create `.github/workflows/test.yml` for automated testing.

---

## Common Issues & Solutions

### Issue: "fatal: not a git repository"
**Solution:** Make sure you're in the project directory:
```bash
cd C:\Users\andre\OneDrive\Documents\ClaudeCode\piRSSonite
```

### Issue: Push rejected (authentication failed)
**Solution:**
- Use Personal Access Token instead of password
- Or set up SSH keys (see Authentication section above)

### Issue: "Updates were rejected because the remote contains work"
**Solution:** Pull first, then push:
```bash
git pull origin main --rebase
git push origin main
```

### Issue: Large files rejected (>100MB)
**Solution:** Use Git LFS for large files:
```bash
# Install Git LFS
git lfs install

# Track large files
git lfs track "*.psd"
git lfs track "*.zip"

# Commit and push
git add .gitattributes
git commit -m "Add Git LFS tracking"
git push
```

### Issue: Accidentally committed node_modules
**Solution:**
```bash
git rm -r --cached node_modules
git commit -m "Remove node_modules from tracking"
git push
```

### Issue: Wrong commit message
**Solution (if not pushed yet):**
```bash
git commit --amend -m "Correct message"
```

**Solution (if already pushed):**
```bash
git commit --amend -m "Correct message"
git push --force-with-lease
```
  Use `--force-with-lease` carefully!

---

## Quick Reference

### Essential Commands

| Command | Description |
|---------|-------------|
| `git status` | Check current status |
| `git add .` | Stage all changes |
| `git commit -m "msg"` | Commit with message |
| `git push` | Push to GitHub |
| `git pull` | Pull from GitHub |
| `git log --oneline` | View commit history |
| `git branch` | List branches |
| `git checkout -b name` | Create new branch |
| `git merge branch` | Merge branch |

### Configuration

| Command | Description |
|---------|-------------|
| `git config --global user.name "Name"` | Set username |
| `git config --global user.email "email"` | Set email |
| `git config --list` | View all config |
| `git remote -v` | View remotes |

### Inspection

| Command | Description |
|---------|-------------|
| `git diff` | Show unstaged changes |
| `git diff --staged` | Show staged changes |
| `git show HASH` | Show commit details |
| `git blame file.ts` | Show who changed what |

---

## Current Repository Status

- **Repository location:** `C:\Users\andre\OneDrive\Documents\ClaudeCode\piRSSonite`
- **Git initialized:** 2026-01-19
- **Initial commit:** `72b6688` - "Initial commit: piRSSonite RSS reader application"
- **Files tracked:** 81 files (15,449 lines)
- **Current branch:** `master` (rename to `main` when pushing to GitHub)
- **Remote:** Not yet configured (pending GitHub repository creation)

---

## Next Action Items

- [ ] Create GitHub repository at https://github.com/new
- [ ] Add remote: `git remote add origin https://github.com/YOUR_USERNAME/piRSSonite.git`
- [ ] Rename branch: `git branch -M main`
- [ ] Push to GitHub: `git push -u origin main`
- [ ] Create README.md
- [ ] Add LICENSE file
- [ ] Set up GitHub Actions (optional)

---

## Resources

- **Git Documentation:** https://git-scm.com/doc
- **GitHub Guides:** https://guides.github.com/
- **Personal Access Tokens:** https://github.com/settings/tokens
- **SSH Keys:** https://github.com/settings/keys
- **Git Cheat Sheet:** https://education.github.com/git-cheat-sheet-education.pdf

---

*Last updated: 2026-01-19*
