# Kriterion - Terminal Commands Reference

Complete reference for all terminal commands to set up, run, and manage Kriterion.

## 🚀 Initial Setup (First Time)

### Automated Setup (Recommended)

```bash
# Make setup script executable
chmod +x scripts/setup.sh

# Run automated setup
./scripts/setup.sh
```

This script will:

1. Check prerequisites (Docker, Docker Compose)
2. Create .env file with secure credentials
3. Build all Docker images
4. Start services
5. Run database migrations
6. Seed initial data
7. Build sandbox container

### Manual Setup

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Generate secure secrets
openssl rand -hex 32  # Use for SECRET_KEY
openssl rand -hex 16  # Use for POSTGRES_PASSWORD

# 3. Edit .env file with your values
nano .env

# 4. Build Docker images
docker-compose build

# 5. Start services
docker-compose up -d

# 6. Wait for database (check readiness)
docker-compose exec db pg_isready -U kriterion

# 7. Run migrations
docker-compose exec backend alembic upgrade head

# 8. Seed database
docker-compose exec backend python scripts/seed_data.py

# 9. Build sandbox container
docker build -t kriterion-sandbox:latest ./sandbox
```

## 🎮 Using Make Commands (Simplified)

### Essential Commands

```bash
# View all available commands
make help

# Install dependencies (local development)
make install

# Build Docker images
make build

# Start all services
make up

# Stop all services
make down

# Restart services
make restart

# View logs (all services)
make logs

# View backend logs only
make logs-backend

# View frontend logs only
make logs-frontend

# Check service status
make status
```

### Database Commands

```bash
# Run database migrations
make migrate

# Create new migration
make migrate-create

# Seed database with initial data
make seed

# Initialize database (migrate + seed)
make init-db

# Open PostgreSQL shell
make shell-db

# Open backend shell
make shell-backend
```

### Testing Commands

```bash
# Run backend tests
make test-backend

# Run frontend tests
make test-frontend
```

### Development Commands

```bash
# Run backend locally (outside Docker)
make dev-backend

# Run frontend locally (outside Docker)
make dev-frontend
```

### Maintenance Commands

```bash
# Build sandbox container
make sandbox-build

# Clean up everything (containers, volumes, caches)
make clean
```

## 🐳 Direct Docker Commands

### Container Management

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend

# Start services
docker-compose up -d

# Stop services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# Restart specific service
docker-compose restart backend
docker-compose restart frontend

# View service status
docker-compose ps

# View resource usage
docker-compose stats
```

### Logs and Debugging

```bash
# View all logs
docker-compose logs

# Follow logs (real-time)
docker-compose logs -f

# View logs for specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Last 100 lines
docker-compose logs --tail=100

# Follow backend logs
docker-compose logs -f backend
```

### Shell Access

```bash
# Backend shell
docker-compose exec backend bash

# Frontend shell
docker-compose exec frontend sh

# Database shell
docker-compose exec db psql -U kriterion -d kriterion

# Run command in container
docker-compose exec backend python --version
```

## 💾 Database Management

### Migrations

```bash
# Run all pending migrations
docker-compose exec backend alembic upgrade head

# Rollback one migration
docker-compose exec backend alembic downgrade -1

# Rollback to specific version
docker-compose exec backend alembic downgrade <revision_id>

# View current version
docker-compose exec backend alembic current

# View migration history
docker-compose exec backend alembic history

# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "description"
```

### Backup and Restore

```bash
# Backup database
docker-compose exec db pg_dump -U kriterion kriterion > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
docker-compose exec -T db psql -U kriterion kriterion < backup.sql

# Backup to compressed file
docker-compose exec db pg_dump -U kriterion kriterion | gzip > backup.sql.gz

# Restore from compressed file
gunzip < backup.sql.gz | docker-compose exec -T db psql -U kriterion kriterion
```

### Database Queries

```bash
# Connect to database
docker-compose exec db psql -U kriterion -d kriterion

# Run query from command line
docker-compose exec db psql -U kriterion -d kriterion -c "SELECT * FROM users;"

# List all tables
docker-compose exec db psql -U kriterion -d kriterion -c "\dt"

# Describe table
docker-compose exec db psql -U kriterion -d kriterion -c "\d users"
```

## 🔧 Local Development (Without Docker)

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# or
venv\Scripts\activate  # On Windows

# Install dependencies
pip install -r requirements.txt

# Run database migrations (needs PostgreSQL running)
alembic upgrade head

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Type check
npm run type-check
```

### Run PostgreSQL Locally

```bash
# Using Docker for PostgreSQL only
docker run -d \
  --name kriterion-db \
  -e POSTGRES_USER=kriterion \
  -e POSTGRES_PASSWORD=kriterion_dev_password \
  -e POSTGRES_DB=kriterion \
  -p 5432:5432 \
  postgres:16-alpine

# Or install PostgreSQL natively and create database
createdb kriterion
```

## 🧪 Testing

### Backend Tests

```bash
# Run all tests
cd backend
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_auth.py

# Run specific test
pytest tests/test_auth.py::test_login

# Run with verbose output
pytest -v

# Run and stop on first failure
pytest -x
```

### Frontend Tests

```bash
cd frontend

# Run tests
npm test

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

## 🔐 Security and Maintenance

### Generate Secure Keys

```bash
# Generate SECRET_KEY (32+ characters)
openssl rand -hex 32

# Generate database password
openssl rand -hex 16

# Generate UUID
uuidgen
```

### Update Dependencies

```bash
# Backend
cd backend
pip install --upgrade -r requirements.txt
pip freeze > requirements.txt

# Frontend
cd frontend
npm update
npm audit fix
```

### Clean Up

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove everything (⚠️ careful!)
docker system prune -a --volumes
```

## 📊 Monitoring

### Resource Usage

```bash
# View container stats
docker stats

# View specific container
docker stats kriterion-backend

# Disk usage
docker system df
```

### Health Checks

```bash
# Check backend health
curl http://localhost:8000/health

# Check database connection
docker-compose exec db pg_isready -U kriterion

# Check if services are responding
curl -I http://localhost:3000
curl -I http://localhost:8000
```

## 🌐 Production Deployment

### Build for Production

```bash
# Set environment to production
export ENVIRONMENT=production
export DEBUG=false

# Build optimized images
docker-compose -f docker-compose.yml build --no-cache

# Start in production mode
docker-compose -f docker-compose.yml up -d
```

### SSL/HTTPS Setup

```bash
# Using Let's Encrypt with Certbot
sudo certbot --nginx -d yourdomain.com

# Or manually with certificates
# Place certificates in infra/nginx/certs/
# Update nginx.conf with SSL configuration
```

## 🆘 Troubleshooting

### Reset Everything

```bash
# Stop all services
docker-compose down -v

# Remove all Kriterion images
docker images | grep kriterion | awk '{print $3}' | xargs docker rmi -f

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
make init-db
```

### Port Conflicts

```bash
# Find process using port 3000
lsof -i :3000
# or
netstat -an | grep 3000

# Kill process
kill -9 <PID>
```

### Permission Issues

```bash
# Fix Docker permission issues (Linux)
sudo usermod -aG docker $USER
newgrp docker

# Fix file permissions
sudo chown -R $USER:$USER .
```

## 📝 Quick Reference

### Most Used Commands

```bash
# Start everything
make up

# View logs
make logs

# Restart
make restart

# Stop
make down

# Run migrations
make migrate

# Clean up
make clean
```

### URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/api/docs
- **ReDoc:** http://localhost:8000/api/redoc

### Default Credentials

```
Admin:
  Email: admin@kriterion.edu
  Password: Admin@123456

Faculty:
  Email: faculty@kriterion.edu
  Password: Faculty@123

Student:
  Email: student1@kriterion.edu
  Password: Student1@123
```

**⚠️ Change these immediately in production!**

---

For more help: `make help` or see README.md
