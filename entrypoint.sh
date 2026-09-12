#!/bin/sh
# 단일 유저 htpasswd 생성 + /data 권한 정리 후 nginx 실행
set -eu
: "${USERNAME:?USERNAME 미설정 (.env 확인)}"
: "${PASSWORD:?PASSWORD 미설정 (.env 확인)}"
PUID=${PUID:-1000}
PGID=${PGID:-1000}
HTPASSWD=/usr/local/nginx/conf/.htpasswd

htpasswd -b -B -C 10 -c "$HTPASSWD" "$USERNAME" "$PASSWORD"
# bcrypt(cost 10) 저장. 644 유지 (워커가 읽는다).
mkdir -p /data
# 첫 기동/권한 깨짐 대비. 대용량 트리면 시간 걸릴 수 있음
chown -R "$PUID:$PGID" /data || true
# PUID/PGID에 계정을 맞춘다. 이름 고정(webdav) + 숫자만 fluid → getpwnam 항상 성공.
# usermod 실패해도 webdav 자체는 살아있어 부팅은 된다(권한 403 가능, 부팅 사망 불가).
if [ "$PUID" != "0" ] && [ "$PGID" != "0" ]; then
  groupmod -g "$PGID" webdav || echo "WARN: groupmod $PGID 실패. 기존 gid 유지."
  usermod -u "$PUID" -g "$PGID" webdav || echo "WARN: usermod $PUID 실패. 기존 uid 유지."
fi

# 설정 오류 시 무보호 기동 방지.
/usr/local/nginx/sbin/nginx -t || exit 1

exec /usr/local/nginx/sbin/nginx -g 'daemon off;'
