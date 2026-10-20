#!/bin/sh
set -eu

tag="${1:-perkly:local}"
name="perkly-run-check"

docker rm -f "$name" >/dev/null 2>&1 || true
docker build -f infra/Dockerfile -t "$tag" .
docker run -d --name "$name" "$tag"

ready=0
for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30; do
  if docker exec "$name" node -e "fetch('http://127.0.0.1:3001/api/v1').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"; then
    ready=1
    break
  fi
  sleep 1
done

uid="$(docker exec "$name" id -u)"
user_line="$(docker exec "$name" id)"
body="$(docker exec "$name" node -e "fetch('http://127.0.0.1:3001/api/v1').then((response) => response.text()).then((text) => console.log(text))")"
docker rm -f "$name" >/dev/null

echo "uid:${uid}"
echo "id:${user_line}"
echo "body:${body}"

if [ "$ready" -ne 1 ]; then
  echo "container did not become ready"
  exit 1
fi
if [ "$uid" = "0" ]; then
  echo "refused: container process is root"
  exit 1
fi
printf '%s' "$body" | grep -q '"payment":"disabled"'
printf '%s' "$body" | grep -q '"name":"perkly"'
