<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Where it runs and how to deploy

Production is **Atom**, Andre's Ubuntu home-lab server: `ssh atom`, LAN IP 192.168.1.178.
The app is at http://192.168.1.178:3007.

| What | Where |
| --- | --- |
| Image | `ghcr.io/andrevdmerwe/pirssonite:main`, built by `.github/workflows/docker-publish.yml` on every push to `main` |
| Compose file | `atom:/opt/docker-compose/pirssonite/docker-compose.yml` (port 3007 → 3000) |
| Database | `atom:/opt/pirssonite/data/main.db`, bind-mounted at `/data` |
| Container | `pirssonite`, `restart: always`; no auto-updater, so a new image goes live only when pulled |

## Project notes

`Spec/` (gitignored) holds symlinks into Andre's Obsidian vault. Read them before changing behaviour:

- `Spec/piRSSonite.md`: where things live, local dev against a copy of Atom's database, the deploy flow
- `Spec/piRSSonite - Spec.md`: data model, API routes, the refresh pipeline, the container
- `Spec/piRSSonite - Feed Refresh Fix.md`: the open "feeds not updating" bug, its diagnosis and the task list

Editing a file in `Spec/` edits the vault note itself. Do it only when Andre asks, or to tick off a task you finished.

## Deploying

```bash
scripts/deploy.sh --status   # what Atom runs: commit, build date, last 30 log lines. Read-only; run any time.
scripts/deploy.sh            # deploy. ASK ANDRE FIRST, every time.
```

The deploy refuses a dirty tree or a branch other than `main`, pushes, waits for the CI build of that commit
(a failed build stops it), copies the database to `atom:~/backups/pirssonite/`, runs `docker compose pull && up -d`,
and checks that Atom answers and runs the pushed commit.

There are no tests. Run `npm run build` (it type-checks) before committing; CI runs the same build.

## Read-only checks on Atom

```bash
ssh atom 'docker logs --since 30m pirssonite 2>&1 | tail -50'
curl -s http://192.168.1.178:3007/api/feeds | jq -r '.[] | [.title, .lastFetched, .failureCount, .isAvailable] | @tsv'
scp atom:/opt/pirssonite/data/main.db prisma/atom-copy.db   # query locally with sqlite3; Atom has no sqlite3
```

## Do not

- Edit files on Atom by hand, or start the container with `docker run`. Change the repo and deploy.
- Write to `/opt/pirssonite/data/` directly.
- Change `prisma/schema.prisma` without reading "Task 4" in the fix note. The image runs `prisma db push`
  only when the database file is missing, so a schema change does not reach Atom's existing database by itself.
