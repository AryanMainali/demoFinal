#!/bin/bash

# Kriterion - Quick Start Guide
# Run this script to see setup status and next steps

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║                 🎓 KRITERION QUICK START 🎓                    ║"
echo "║          Automated Grading System for Programming             ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "✅ Environment configuration found (.env)"
else
    echo "❌ Environment file not found!"
    echo "   Run: cp .env.example .env"
    echo "   Then edit .env with your settings"
    exit 1
fi

# Check Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker installed"
else
    echo "❌ Docker not found! Please install Docker first."
    exit 1
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose installed"
else
    echo "❌ Docker Compose not found! Please install Docker Compose first."
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    echo "📊 STATUS: Services are running"
    echo ""
    docker-compose ps
    echo ""
    echo "🌐 Access Points:"
    echo "   Frontend:  http://localhost:3000"
    echo "   Backend:   http://localhost:8000"
    echo "   API Docs:  http://localhost:8000/api/docs"
    echo ""
    echo "🔑 Default Login:"
    echo "   Admin:    admin@kriterion.edu / Admin@123456"
    echo "   Faculty:  faculty@kriterion.edu / Faculty@123"
    echo "   Student:  student1@kriterion.edu / Student1@123"
    echo ""
    echo "📝 Useful Commands:"
    echo "   make logs          View logs"
    echo "   make restart       Restart services"
    echo "   make down          Stop services"
    echo "   make help          See all commands"
else
    echo "⚠️  STATUS: Services not running"
    echo ""
    echo "🚀 QUICK START:"
    echo ""
    echo "1️⃣  Run automated setup (recommended):"
    echo "   chmod +x scripts/setup.sh"
    echo "   ./scripts/setup.sh"
    echo ""
    echo "2️⃣  Or manual setup:"
    echo "   make build         # Build Docker images"
    echo "   make up            # Start services"
    echo "   make init-db       # Initialize database"
    echo "   make sandbox-build # Build sandbox"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 DOCUMENTATION:"
echo "   README.md          Full documentation"
echo "   DEPLOYMENT.md      Deployment guide"
echo "   COMMANDS.md        Command reference"
echo "   ENVIRONMENT.md     Environment variables"
echo "   PROJECT_SUMMARY.md Complete overview"
echo ""
echo "🆘 NEED HELP?"
echo "   make help          Show all Make commands"
echo "   make logs          View application logs"
echo ""
echo "Happy Grading! 🎉"
echo ""
