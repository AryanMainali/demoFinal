FROM python:3.11-slim

WORKDIR /app

# Install system deps for supported languages (Python + Java only)
RUN apt-get update \
    && apt-get install -y --no-install-recommends default-jdk-headless ca-certificates \
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
