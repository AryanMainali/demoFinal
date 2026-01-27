#!/bin/bash

# Kriterion Setup Script
# This script sets up the Kriterion application from scratch

set -e

echo "🚀 Kriterion Setup Script"
echo "========================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ Docker is not installed${NC}"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}❌ Docker Compose is not installed${NC}"; exit 1; }

echo -e "${GREEN}✅ Prerequisites met${NC}"
echo ""

# Create .env file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    
    # Generate secure secret key
    SECRET_KEY=$(openssl rand -hex 32)
    DB_PASSWORD=$(openssl rand -hex 16)
    
    # Update .env file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your-secret-key-change-in-production-min-32-chars/$SECRET_KEY/" .env
        sed -i '' "s/kriterion_dev_password/$DB_PASSWORD/" .env
    else
        # Linux
        sed -i "s/your-secret-key-change-in-production-min-32-chars/$SECRET_KEY/" .env
        sed -i "s/kriterion_dev_password/$DB_PASSWORD/" .env
    fi
    
    echo -e "${GREEN}✅ .env file created with secure credentials${NC}"
else
    echo -e "${YELLOW}⚠️  .env file already exists, skipping${NC}"
fi
echo ""

# Build Docker images
echo "🏗️  Building Docker images..."
docker-compose build
echo -e "${GREEN}✅ Docker images built${NC}"
echo ""

# Start services
echo "🚢 Starting services..."
docker-compose up -d
echo -e "${GREEN}✅ Services started${NC}"
echo ""

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

until docker-compose exec -T db pg_isready -U kriterion > /dev/null 2>&1; do
    echo "   Waiting for database..."
    sleep 2
done
echo -e "${GREEN}✅ Database is ready${NC}"
echo ""

# Run migrations
echo "📊 Running database migrations..."
docker-compose exec -T backend alembic upgrade head
echo -e "${GREEN}✅ Migrations completed${NC}"
echo ""

# Seed database
echo "🌱 Seeding database with initial data..."
docker-compose exec -T backend python scripts/seed_data.py
echo -e "${GREEN}✅ Database seeded${NC}"
echo ""

# Build sandbox container
echo "🏗️  Building sandbox container..."
docker build -t kriterion-sandbox:latest ./sandbox
echo -e "${GREEN}✅ Sandbox container built${NC}"
echo ""

echo "✨ Setup complete!"
echo ""
echo "📋 Application Information:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/api/docs"
echo ""
echo "🔑 Default Credentials:"
echo "   Admin:    admin@kriterion.edu / Admin@123456"
echo "   Faculty:  faculty@kriterion.edu / Faculty@123"
echo "   Student:  student1@kriterion.edu / Student1@123"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Change these passwords immediately!${NC}"
echo ""
echo "📚 Useful Commands:"
echo "   make logs          - View logs"
echo "   make restart       - Restart services"
echo "   make down          - Stop services"
echo "   make help          - See all commands"
echo ""
echo -e "${GREEN}🎉 Happy grading!${NC}"
