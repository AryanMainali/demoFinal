FROM python:3.11-slim

WORKDIR /workspace

# Install multiple language compilers/interpreters
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    default-jdk \
    g++ \
    gcc \
    mono-mcs \
    mono-runtime \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install TypeScript
RUN npm install -g typescript ts-node

# Create non-root user for code execution
RUN useradd -m -u 1000 -s /bin/bash sandbox

# Set permissions
RUN chown -R sandbox:sandbox /workspace

USER sandbox

CMD ["python3", "--version"]
