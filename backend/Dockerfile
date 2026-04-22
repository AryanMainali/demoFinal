FROM python:3.11-slim

WORKDIR /app

# System deps: Java + Docker CLI (CLI only; daemon is the host socket mounted in compose)
ARG DOCKER_CLI_VERSION=26.1.4
RUN apt-get update \
    && apt-get install -y --no-install-recommends default-jdk-headless ca-certificates curl \
    && ARCH=$(dpkg --print-architecture) \
    && case "$ARCH" in \
         amd64) DOCKER_ARCH=x86_64 ;; \
         arm64) DOCKER_ARCH=aarch64 ;; \
         *) echo "unsupported arch for Docker static binary: $ARCH" && exit 1 ;; \
       esac \
    && curl -fsSL "https://download.docker.com/linux/static/stable/${DOCKER_ARCH}/docker-${DOCKER_CLI_VERSION}.tgz" \
         | tar xz --strip-components=1 -C /usr/local/bin docker/docker \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt requirements-ml.txt ./

# Install core dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install ML dependencies with CPU-only torch (avoids ~1.5GB GPU wheel download)
RUN pip install --no-cache-dir \
    --extra-index-url https://download.pytorch.org/whl/cpu \
    -r requirements-ml.txt

# Copy application
COPY . .

# Create uploads directory
RUN mkdir -p /tmp/kriterion/uploads

# Expose port
EXPOSE 8000

# Run application with migrations
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
