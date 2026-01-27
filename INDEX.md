# Kriterion - Documentation Index

Welcome to Kriterion! This index will help you find the information you need.

## 📖 Documentation Files

### 🚀 Getting Started

1. **[start.sh](start.sh)** - Quick status check and next steps

   ```bash
   ./start.sh
   ```

2. **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Complete overview of what's built
   - Project structure
   - Features implemented
   - Quick start commands
   - Default credentials

3. **[README.md](README.md)** - Main documentation
   - Feature overview
   - Architecture details
   - Prerequisites
   - Development guide

### ⚙️ Setup & Configuration

4. **[scripts/setup.sh](scripts/setup.sh)** - Automated setup script

   ```bash
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

5. **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment guide
   - Quick deployment commands
   - Environment configuration
   - Production checklist
   - Troubleshooting

6. **[ENVIRONMENT.md](ENVIRONMENT.md)** - Environment variables reference
   - Required variables
   - Optional variables
   - Security best practices
   - Examples for each environment

### 💻 Command Reference

7. **[COMMANDS.md](COMMANDS.md)** - Complete terminal commands guide
   - Initial setup commands
   - Make commands
   - Docker commands
   - Database management
   - Testing
   - Troubleshooting

8. **[Makefile](Makefile)** - Development automation
   ```bash
   make help  # See all available commands
   ```

## 🎯 Quick Navigation

### I want to...

**...get started immediately**
→ Run `./start.sh` to check status and see next steps
→ Or run `./scripts/setup.sh` for automated setup

**...understand what's been built**
→ Read [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

**...deploy to production**
→ Follow [DEPLOYMENT.md](DEPLOYMENT.md)

**...configure environment variables**
→ Check [ENVIRONMENT.md](ENVIRONMENT.md)

**...learn all terminal commands**
→ See [COMMANDS.md](COMMANDS.md)

**...understand the architecture**
→ Read [README.md](README.md) - Architecture section

**...set up for development**
→ Follow [README.md](README.md) - Development section

**...troubleshoot issues**
→ Check [DEPLOYMENT.md](DEPLOYMENT.md) - Troubleshooting section
→ Or [COMMANDS.md](COMMANDS.md) - Troubleshooting section

**...see API documentation**
→ Start services and visit http://localhost:8000/api/docs

## 📁 Project Structure

```
Kriterion/
├── 📄 start.sh                  # Quick start checker
├── 📄 README.md                 # Main documentation
├── 📄 PROJECT_SUMMARY.md        # Complete overview
├── 📄 DEPLOYMENT.md             # Deployment guide
├── 📄 COMMANDS.md               # Terminal commands
├── 📄 ENVIRONMENT.md            # Environment variables
├── 📄 Makefile                  # Development commands
├── 📄 docker-compose.yml        # Service orchestration
├── 📄 .env.example              # Environment template
│
├── 📁 backend/                  # FastAPI backend
│   ├── app/
│   │   ├── api/                # API endpoints
│   │   ├── core/               # Configuration
│   │   ├── models/             # Database models
│   │   ├── schemas/            # Pydantic schemas
│   │   └── services/           # Business logic
│   ├── alembic/                # Database migrations
│   ├── tests/                  # Backend tests
│   └── requirements.txt        # Python dependencies
│
├── 📁 frontend/                # Next.js frontend
│   ├── app/                    # Next.js pages
│   ├── components/             # React components
│   ├── lib/                    # Utilities
│   └── package.json            # Node dependencies
│
├── 📁 sandbox/                 # Code execution sandbox
│   └── Dockerfile
│
├── 📁 scripts/                 # Utility scripts
│   ├── setup.sh               # Automated setup
│   └── seed_data.py           # Database seeding
│
└── 📁 .github/                # CI/CD
    └── workflows/
        └── ci.yml             # GitHub Actions
```

## 🔗 External Links

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/api/docs
- **ReDoc:** http://localhost:8000/api/redoc

## 💡 Common Tasks

### First Time Setup

```bash
./scripts/setup.sh
```

### Start Services

```bash
make up
```

### View Logs

```bash
make logs
```

### Stop Services

```bash
make down
```

### Run Tests

```bash
make test-backend
make test-frontend
```

### Access Database

```bash
make shell-db
```

### Get Help

```bash
make help
./start.sh
```

## 🎓 Default Credentials

**Admin:**

- Email: admin@kriterion.edu
- Password: Admin@123456

**Faculty:**

- Email: faculty@kriterion.edu
- Password: Faculty@123

**Student:**

- Email: student1@kriterion.edu
- Password: Student1@123

**⚠️ Change these immediately in production!**

## 📞 Support

For issues and questions:

- Check the documentation files above
- Run `make help` for available commands
- Check logs with `make logs`
- Review troubleshooting sections in DEPLOYMENT.md

## 🎉 Ready to Begin?

1. **Check Status:** `./start.sh`
2. **Setup:** `./scripts/setup.sh`
3. **Access:** http://localhost:3000
4. **Learn:** Read [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

---

**Happy Grading! 🎓**
