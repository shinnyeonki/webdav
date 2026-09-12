# 단일 유저 nginx WebDAV. mod_zip + njs 커스텀 빌드.
# - mod_zip: 폴더 다운로드 스트리밍 (X-Archive-Files)
# - njs: /_zip/download 목록 생성 (in-process, CRC '-' 방식)
ARG NGINX_VERSION=1.28.3
ARG NJS_VERSION=0.8.10

FROM alpine:3.23 AS builder
ARG NGINX_VERSION NJS_VERSION
RUN apk add --no-cache build-base pcre-dev zlib-dev openssl-dev libxml2-dev libxslt-dev linux-headers git
WORKDIR /src
RUN wget -qO- https://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz | tar xz \
 && git clone --depth 1 --branch ${NJS_VERSION} https://github.com/nginx/njs.git \
 && git clone --depth 1 https://github.com/evanmiller/mod_zip.git \
 && git clone --depth 1 https://github.com/arut/nginx-dav-ext-module.git
WORKDIR /src/nginx-${NGINX_VERSION}
RUN ./configure \
      --prefix=/usr/local/nginx \
      --with-compat \
      --with-cc-opt="-Wno-error=unterminated-string-initialization" \
      --with-threads \
      --with-http_dav_module \
      --with-http_addition_module \
      --with-http_slice_module \
      --add-module=/src/mod_zip \
      --add-module=/src/nginx-dav-ext-module \
      --add-dynamic-module=/src/njs/nginx \
 && make -j$(nproc) \
 && make install

FROM alpine:3.23
RUN apk add --no-cache pcre zlib openssl apache2-utils libxml2 libxslt shadow \
 && adduser -D -H -s /sbin/nologin webdav
COPY --from=builder /usr/local/nginx /usr/local/nginx
COPY nginx.conf /usr/local/nginx/conf/nginx.conf
COPY ui/ /usr/share/webdav-ui/
COPY njs/ /usr/local/nginx/njs/
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
RUN mkdir -p /usr/share/webdav-ui && chmod 755 /usr/share/webdav-ui
VOLUME /data
EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
