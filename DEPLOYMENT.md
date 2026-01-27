# Deployment Guide

## Quick Deployment Commands

### Initial Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd Kriterion

# 2. Configure environment
cp .env.example .env
nano .env  # Edit with your settings

# 3. Setup (copy .env and install dependencies)
make setup

# 4. Build containers
make build

# 5. Start services
make up

# 6. Initialize database
make init-db

# 7. Build sandbox
make sandbox-build
```

### Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs

### Default Credentials

**Admin:**

- Email: admin@kriterion.edu
- Password: Admin@123456

**Faculty:**

- Email: faculty@kriterion.edu
- Password: Faculty@123

**Students:**

- Email: student1@kriterion.edu
- Password: Student1@123

⚠️ **IMPORTANT:** Change all default passwords immediately!

## Environment Variables to Configure

### Critical (Must Change)

```bash
# Generate a secure secret key
SECRET_KEY=$(openssl rand -hex 32)

# Set strong database password
POSTGRES_PASSWORD=$(openssl rand -hex 16)

# Update admin credentials
INITIAL_ADMIN_EMAIL=admin@yourdomain.com
INITIAL_ADMIN_PASSWORD=YourSecurePassword@123
```

### Optional (Recommended)

```bash
# Email configuration (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# File upload limits
MAX_UPLOAD_SIZE_MB=50

# Sandbox security
SANDBOX_TIMEOUT_SECONDS=30
SANDBOX_MEMORY_LIMIT_MB=512
```

## Production Deployment Checklist

- [ ] Change all default passwords
- [ ] Generate secure SECRET_KEY (min 32 chars)
- [ ] Configure production database
- [ ] Set ENVIRONMENT=production
- [ ] Set DEBUG=false
- [ ] Configure CORS origins
- [ ] Setup HTTPS/SSL certificates
- [ ] Configure email for notifications
- [ ] Setup backup strategy
- [ ] Configure monitoring and logging
- [ ] Review and adjust rate limits
- [ ] Setup firewall rules
- [ ] Enable audit logging
- [ ] Test sandbox isolation

## Maintenance Commands

```bash
# View logs
make logs

# Restart services
make restart

# Update database schema
make migrate

# Backup database
docker exec kriterion-db pg_dump -U kriterion kriterion > backup.sql

# Restore database
docker exec -i kriterion-db psql -U kriterion kriterion < backup.sql

# Clean up
make clean
```

## Monitoring

### Health Checks

```bash
# Check service status
make status

# Backend health
curl http://localhost:8000/health

# Database connection
make shell-db
```

### Logs

```bash
# All services
make logs

# Backend only
make logs-backend

# Frontend only
make logs-frontend

# Follow logs
docker-compose logs -f --tail=100
```

## Troubleshooting

### Services won't start

```bash
# Check for port conflicts
lsof -i :3000  # Frontend
lsof -i :8000  # Backend
lsof -i :5432  # Database

# Restart services
make restart

# Rebuild if needed
make clean
make build
make up
```

### Database issues

```bash
# Reset database (⚠️ destroys all data)
make down
docker volume rm kriterion_postgres_data
make up
make init-db
```

### Migration errors

```bash
# View migration status
docker-compose exec backend alembic current

# Reset migrations (⚠️ destroys data)
docker-compose exec backend alembic downgrade base
docker-compose exec backend alembic upgrade head
```

## Security Notes

1. **Never commit .env file** - Contains sensitive credentials
2. **Change default passwords** - Immediately after deployment
3. **Use HTTPS in production** - Setup SSL certificates
4. **Regular updates** - Keep dependencies updated
5. **Backup regularly** - Database and uploaded files
6. **Monitor logs** - Check for suspicious activity
7. **Rate limiting** - Configure appropriate limits
8. **Firewall rules** - Restrict access to necessary ports

## Support

For issues:

1. Check logs: `make logs`
2. Review documentation in README.md
3. Check GitHub issues
4. Contact support: support@kriterion.edu
