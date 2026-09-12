#!/bin/sh
# 단일 유저 htpasswd 생성 + /data 권한 정리 후 nginx 실행
set -eu
: "${USERNAME:?USERNAME 미설정 (.env 확인)}"
: "${PASSWORD:?PASSWORD 미설정 (.env 확인)}"
PUID=${PUID:-1000}
PGID=${PGID:-1000}
HTPASSWD=/usr/local/nginx/conf/.htpasswd

htpasswd -b -B -C 10 -c "$HTPASSWD" "$USERNAME" "$PASSWORD"
# bcrypt(cost 10) 저장. 워커(nobody)가 읽어야 해서 644.
mkdir -p /data
# 첫 기동/권한 깨짐 대비. 대용량 트리면 시간 걸릴 수 있음
chown -R "$PUID:$PGID" /data || true

# 설정 오류 시 무보호 기동 방지.
/usr/local/nginx/sbin/nginx -t || exit 1

exec /usr/local/nginx/sbin/nginx -g 'daemon off;'
