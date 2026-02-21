FROM python:3.11-slim

WORKDIR /app

# Install system dependencies and language compilers
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    default-jdk \
    mono-mcs \
    mono-runtime \
    nodejs \
    npm \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install TypeScript
RUN npm install -g typescript ts-node

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create uploads directory
RUN mkdir -p /tmp/kriterion/uploads

# Expose port
EXPOSE 8000

# Run application with migrations
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
