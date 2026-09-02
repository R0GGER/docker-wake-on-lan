FROM python:3.13-alpine

LABEL org.opencontainers.image.title="docker-wake-on-lan" \
      org.opencontainers.image.description="Wake-on-LAN with a web interface, status checks, scheduling and remote shutdown" \
      org.opencontainers.image.source="https://github.com/r0gger/docker-wake-on-lan"

# iputils: ICMP fallback when no TCP port answers
# openssh-client + sshpass: SSH remote shutdown (password or /config key)
# samba-common-tools: Windows RPC shutdown via `net rpc shutdown`
RUN apk add --no-cache iputils tzdata openssh-client sshpass samba-common-tools

WORKDIR /opt/wake-on-lan

COPY requirements.txt ./
# Build tooling is only needed on platforms without prebuilt musl wheels.
RUN apk add --no-cache --virtual .build-deps gcc musl-dev \
    && pip install --no-cache-dir -r requirements.txt \
    && apk del .build-deps

COPY app ./app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    CONFIG_DIR=/config \
    HOST=0.0.0.0 \
    PORT=8080 \
    MODE=auto \
    AUTH_ENABLED=true

VOLUME ["/config"]
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/healthz" || exit 1

ENTRYPOINT ["python", "-m", "app.entrypoint"]
