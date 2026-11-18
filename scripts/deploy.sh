#!/usr/bin/env bash
# Deploy piRSSonite to Atom.
#
#   scripts/deploy.sh           push main, wait for the GHCR build, back up the
#                               database on Atom, pull the new image, check health
#   scripts/deploy.sh --status  show what Atom is running; changes nothing
#
# Agents: run the deploy only after Andre says so. --status is always fine.
set -euo pipefail

readonly REPO=andrevdmerwe/piRSSonite
readonly WORKFLOW=docker-publish.yml
readonly ATOM=atom
readonly COMPOSE_DIR=/opt/docker-compose/pirssonite
readonly DB=/opt/pirssonite/data/main.db
readonly HEALTH_URL=http://192.168.1.178:3007/api/counts

cd "$(dirname "$0")/.."

die() { echo "deploy: $*" >&2; exit 1; }

# Prints the commit the running image was built from.
running_revision() {
  ssh "$ATOM" 'bash -s' <<'EOF'
img=$(docker inspect -f '{{.Image}}' pirssonite)
docker image inspect "$img" -f '{{index .Config.Labels "org.opencontainers.image.revision"}}'
EOF
}

status() {
  ssh "$ATOM" 'bash -s' <<'EOF'
img=$(docker inspect -f '{{.Image}}' pirssonite)
docker inspect pirssonite -f 'container: {{.State.Status}}, started {{.State.StartedAt}}'
docker image inspect "$img" -f 'image:     {{index .RepoTags 0}}, built {{.Created}}'
docker image inspect "$img" -f 'commit:    {{index .Config.Labels "org.opencontainers.image.revision"}}'
echo '--- last 30 log lines'
docker logs --tail 30 pirssonite 2>&1
EOF
}

if [ "${1:-}" = "--status" ]; then
  status
  exit 0
fi
[ $# -eq 0 ] || die "unknown argument: $1 (use --status, or no argument to deploy)"

# 1. Only a clean, committed main is deployed.
[ "$(git rev-parse --abbrev-ref HEAD)" = main ] || die "not on main"
[ -z "$(git status --porcelain)" ] || die "uncommitted or untracked changes; commit or stash them first"
sha=$(git rev-parse HEAD)

# 2. Push. CI builds ghcr.io/andrevdmerwe/pirssonite:main from it.
git push origin main

# 3. Wait for that commit's build. A failed build stops the deploy here.
run_id=""
for _ in $(seq 1 30); do
  run_id=$(gh run list -R "$REPO" --workflow "$WORKFLOW" --commit "$sha" --event push \
    --json databaseId -q '.[0].databaseId')
  [ -n "$run_id" ] && break
  sleep 5
done
[ -n "$run_id" ] || die "no CI run appeared for $sha within 150 s"
echo "deploy: waiting for CI run $run_id"
gh run watch "$run_id" -R "$REPO" --exit-status --interval 15

# 4. Back up the database on Atom (keeps the newest 10 copies).
ssh "$ATOM" "mkdir -p ~/backups/pirssonite \
  && cp '$DB' ~/backups/pirssonite/main.db.\$(date +%Y%m%d-%H%M%S) \
  && cd ~/backups/pirssonite && ls -1t main.db.* | tail -n +11 | xargs -r rm --"
echo "deploy: database copied to atom:~/backups/pirssonite/"

# 5. Pull the new image and recreate the container.
ssh "$ATOM" "cd '$COMPOSE_DIR' && docker compose pull && docker compose up -d"

# 6. Health: 20 tries x (up to 5 s + 2 s pause), roughly 60 s.
healthy=""
for _ in $(seq 1 20); do
  if curl -fsS --connect-timeout 2 --max-time 5 "$HEALTH_URL" >/dev/null 2>&1; then
    healthy=yes
    break
  fi
  sleep 2
done
[ -n "$healthy" ] || die "piRSSonite did not answer $HEALTH_URL within 60 s; check: scripts/deploy.sh --status"

running=$(running_revision)
if [ "$running" = "$sha" ]; then
  echo "deploy: Atom is running $sha"
else
  die "Atom answers, but runs $running instead of $sha"
fi
