# Kriterion - Quick Start Guide

## 🚀 Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 16 (or use Docker)

### 1. Setup Environment Variables

**Backend (.env)**

```bash
cd backend
cp .env.example .env
```

Edit `.env` with:

```
DATABASE_URL=postgresql://kriterion:kriterion@db:5432/kriterion
SECRET_KEY=your-super-secret-key-change-this-in-production
DEBUG=True
ENVIRONMENT=development
```

**Frontend (.env.local)**

```bash
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local
```

### 2. Install Dependencies

**Frontend:**

```bash
cd frontend
npm install
npm install date-fns axios
```

**Backend:**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Start Database

```bash
# From project root
docker-compose up -d db
```

### 4. Run Database Migrations

```bash
cd backend
source venv/bin/activate
alembic upgrade head
```

### 5. Create Initial Admin User

```bash
cd backend
python scripts/create_admin.py
# Or use Python console:
python
>>> from app.core.database import SessionLocal
>>> from app.models.user import User, UserRole
>>> from app.core.security import get_password_hash
>>> db = SessionLocal()
>>> admin = User(
...     email="admin@kriterion.edu",
...     hashed_password=get_password_hash("Admin@123456"),
...     full_name="System Administrator",
...     role=UserRole.ADMIN,
...     is_active=True,
...     is_verified=True
... )
>>> db.add(admin)
>>> db.commit()
>>> exit()
```

### 6. Start Backend Server

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 7. Start Frontend Development Server

```bash
cd frontend
npm run dev
```

### 8. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/api/docs
- **API Redoc**: http://localhost:8000/api/redoc

### 9. Login

**Admin Account:**

- Email: `admin@kriterion.edu`
- Password: `Admin@123456`

---

## 📋 Current Implementation Status

### ✅ COMPLETED

**Backend:**

- ✅ Authentication (JWT with refresh tokens)
- ✅ Role-based access control (Student/Faculty/Admin)
- ✅ User management endpoints
- ✅ Course & enrollment endpoints
- ✅ Assignment creation & management
- ✅ Submission upload & tracking
- ✅ Autograding service (Docker sandbox)
- ✅ Rubric management
- ✅ Test case management
- ✅ Reports & analytics
- ✅ Canvas gradebook export
- ✅ Admin panel APIs
- ✅ Audit logging
- ✅ Security features (rate limiting, RBAC, etc.)

**Frontend:**

- ✅ Authentication flow (login/logout)
- ✅ Auth context & protected routes
- ✅ API client with auto token refresh
- ✅ Form validation (Zod schemas)
- ✅ Login page (professional UI)
- ✅ Student dashboard (basic)
- ✅ Faculty dashboard (basic)
- ✅ Admin dashboard (basic)

### ⚠️ NEEDS COMPLETION

**Backend:**

- ⚠️ Missing Pydantic schemas (some endpoints may error)
- ⚠️ Submission model needs SubmissionStatus enum
- ⚠️ Test case model needs TestCaseType enum
- ⚠️ Create seed data script

**Frontend:**

- ⚠️ Complete student pages (assignment view, submission form)
- ⚠️ Complete faculty pages (create assignment, grade submissions)
- ⚠️ Complete admin pages (user management)
- ⚠️ Shared components (sidebar, tables, forms)
- ⚠️ File upload component
- ⚠️ Reports & analytics pages

---

## 🔨 Next Steps to Make It Fully Functional

### Priority 1: Fix Missing Backend Schemas

Create these files in `backend/app/schemas/`:

**assignment.py:**

```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class AssignmentBase(BaseModel):
    title: str
    description: str
    language: str
    due_date: datetime
    late_penalty_per_day: float = 10.0
    max_attempts: int = 0
    allow_groups: bool = False
    max_group_size: int = 3

class AssignmentCreate(AssignmentBase):
    course_id: int
    required_files: Optional[List[str]] = None
    rubric: Optional[dict] = None

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    is_published: Optional[bool] = None

class Assignment(AssignmentBase):
    id: int
    course_id: int
    is_published: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AssignmentDetail(Assignment):
    rubric: Optional[dict] = None
    test_suites: List[dict] = []
```

**submission.py:**

```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class SubmissionCreate(BaseModel):
    assignment_id: int
    group_id: Optional[int] = None

class Submission(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    group_id: Optional[int] = None
    submitted_at: datetime
    status: str
    is_late: bool
    late_penalty: float
    final_score: Optional[float] = None

    class Config:
        from_attributes = True

class SubmissionWithResults(Submission):
    test_results: List[dict] = []
    files: List[dict] = []
```

**reports.py:**

```python
from pydantic import BaseModel
from typing import Optional

class DashboardStats(BaseModel):
    # Student stats
    enrolled_courses: Optional[int] = None
    total_submissions: Optional[int] = None
    graded_submissions: Optional[int] = None
    average_score: Optional[float] = None
    upcoming_assignments: Optional[int] = None

    # Faculty stats
    total_courses: Optional[int] = None
    total_students: Optional[int] = None
    total_assignments: Optional[int] = None
    pending_grading: Optional[int] = None
```

**audit_log.py:**

```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AuditLog(BaseModel):
    id: int
    user_id: int
    event_type: str
    resource_type: str
    resource_id: int
    action: str
    description: str
    created_at: datetime
    metadata: Optional[dict] = None

    class Config:
        from_attributes = True
```

### Priority 2: Add Missing Enums to Models

**backend/app/models/submission.py:**

```python
from enum import Enum as PyEnum

class SubmissionStatus(str, PyEnum):
    PENDING = "pending"
    GRADING = "grading"
    GRADED = "graded"
    ERROR = "error"
```

**backend/app/models/test_case.py:**

```python
from enum import Enum as PyEnum

class TestCaseType(str, PyEnum):
    EXACT_MATCH = "exact_match"
    CONTAINS = "contains"
    REGEX = "regex"
    IGNORE_WHITESPACE = "ignore_whitespace"
```

### Priority 3: Test the System

1. **Start all services**
2. **Login as admin**
3. **Create a test faculty user**
4. **Create a test student user**
5. **Login as faculty, create a course**
6. **Create an assignment with rubric**
7. **Login as student, submit code**
8. **Grade the submission**
9. **View results**

---

## 🐛 Troubleshooting

### Backend won't start

- Check PostgreSQL is running: `docker-compose ps`
- Check DATABASE_URL in .env
- Run migrations: `alembic upgrade head`

### Frontend can't connect to backend

- Check NEXT_PUBLIC_API_URL in .env.local
- Check backend is running on port 8000
- Check CORS settings in backend/app/main.py

### Login fails

- Check admin user was created
- Check password hash function in backend
- Check JWT SECRET_KEY is set
- Check browser console for errors

### Submissions fail

- Check SUBMISSIONS_DIR exists and is writable
- Check Docker is running (for sandbox)
- Check file upload size limits

---

## 📚 API Documentation

Visit http://localhost:8000/api/docs for interactive API documentation (Swagger UI).

### Key Endpoints:

**Auth:**

- POST `/api/v1/auth/login` - Login
- POST `/api/v1/auth/register` - Register
- POST `/api/v1/auth/refresh` - Refresh token
- GET `/api/v1/auth/me` - Get current user

**Courses:**

- GET `/api/v1/courses` - List courses
- POST `/api/v1/courses` - Create course (Faculty/Admin)
- GET `/api/v1/courses/{id}` - Get course details

**Assignments:**

- GET `/api/v1/assignments` - List assignments
- POST `/api/v1/assignments` - Create assignment (Faculty/Admin)
- GET `/api/v1/assignments/{id}` - Get assignment details
- POST `/api/v1/assignments/{id}/publish` - Publish assignment

**Submissions:**

- GET `/api/v1/submissions` - List submissions
- POST `/api/v1/submissions` - Submit code
- POST `/api/v1/submissions/{id}/grade` - Trigger grading
- GET `/api/v1/submissions/{id}/download` - Download files

**Reports:**

- GET `/api/v1/reports/dashboard` - Get dashboard stats
- GET `/api/v1/reports/export/canvas/{course_id}` - Export to Canvas

---

## 🎨 UI Theme

Primary Color: `#862733` (Maroon)

- Used for branding, buttons, highlights
- Defined in tailwind.config.ts

---

## 📝 Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload in development
2. **Database Changes**: Always create Alembic migrations
3. **API Changes**: Update both backend endpoint AND frontend API client
4. **New Components**: Use shadcn/ui components where possible
5. **Forms**: Always use react-hook-form + Zod validation
6. **State**: Use TanStack Query for server state

---

## 🔐 Security Checklist

- [x] Password hashing (bcrypt)
- [x] JWT authentication
- [x] Role-based access control
- [x] Audit logging
- [x] Input validation (Pydantic + Zod)
- [x] SQL injection prevention (SQLAlchemy)
- [x] XSS prevention (React auto-escaping)
- [x] CSRF protection (JWT in headers)
- [x] Rate limiting (SlowAPI)
- [x] Sandbox execution (Docker)
- [ ] HTTPS in production (TODO)
- [ ] Secret rotation (TODO)
- [ ] Security headers (TODO)

---

## 📦 Deployment

For production deployment:

1. Set `DEBUG=False` and `ENVIRONMENT=production`
2. Use strong SECRET_KEY (generate with `openssl rand -hex 32`)
3. Enable HTTPS
4. Use managed database (not Docker)
5. Set up proper logging
6. Configure CDN for static files
7. Enable monitoring (Prometheus/Grafana)
8. Set up automated backups
9. Configure proper CORS origins
10. Use environment-specific .env files

---

## 🆘 Need Help?

1. Check `IMPLEMENTATION_STATUS.md` for current progress
2. Check `API docs` at http://localhost:8000/api/docs
3. Check backend logs in terminal
4. Check browser console for frontend errors
5. Check database with: `docker exec -it kriterion-db psql -U kriterion`

---

Good luck! 🚀
