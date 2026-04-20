#!/usr/bin/env python3
"""
Seed database with users for Kriterion.

Usage:
    docker-compose exec backend python scripts/seed_data.py
    -- or --
    cd backend && python scripts/seed_data.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models import (
    User, UserRole,
    NotificationSettings,
    UserPreferences,
    StudentProgress,
    Language, DEFAULT_LANGUAGES,
    Achievement, Skill,
    DEFAULT_ACHIEVEMENTS, DEFAULT_SKILLS,
)

# ──────────────────────────────────────────────────────────────────────────────
# Users
# ──────────────────────────────────────────────────────────────────────────────

ADMIN_USERS = [
    {"email": "admin@ulm.edu",       "password": "Admin@123456",  "full_name": "System Administrator"},
]

FACULTY_USERS = [
    {"email": "tgreer@ulm.edu",      "password": "Faculty@123",   "full_name": "Tyler Greer"},
    {"email": "ktaylor@ulm.edu",     "password": "Faculty@123",   "full_name": "Kim Taylor"},
]

ASSISTANT_USERS = [
    {"email": "charris@ulm.edu",     "password": "Assistant@123", "full_name": "Chris Harris"},
    {"email": "jsmith@ulm.edu",      "password": "Assistant@123", "full_name": "Jane Smith"},
]

STUDENT_USERS = [
    {"email": "npoudel@warhawks.ulm.edu",    "password": "Student@123", "full_name": "Niraj Poudel",    "student_id": "S10001"},
    {"email": "sthapa@warhawks.ulm.edu",     "password": "Student@123", "full_name": "Sulav Thapa",     "student_id": "S10002"},
    {"email": "amainali@warhawks.ulm.edu",   "password": "Student@123", "full_name": "Aryan Mainali",   "student_id": "S10003"},
    {"email": "bthapa@warhawks.ulm.edu",     "password": "Student@123", "full_name": "Biplov Thapa",    "student_id": "S10004"},
    {"email": "cbrown@warhawks.ulm.edu",     "password": "Student@123", "full_name": "Chris Brown",     "student_id": "S10005"},
    {"email": "aamgain@warhawks.ulm.edu",    "password": "Student@123", "full_name": "Abhishek Amgain", "student_id": "S10006"},
    {"email": "rgarcia@warhawks.ulm.edu",    "password": "Student@123", "full_name": "Rosa Garcia",     "student_id": "S10007"},
    {"email": "jlee@warhawks.ulm.edu",       "password": "Student@123", "full_name": "James Lee",       "student_id": "S10008"},
    {"email": "pmiller@warhawks.ulm.edu",    "password": "Student@123", "full_name": "Priya Miller",    "student_id": "S10009"},
    {"email": "twilson@warhawks.ulm.edu",    "password": "Student@123", "full_name": "Tyler Wilson",    "student_id": "S10010"},
]

# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def _upsert_user(db, email, password, full_name, role, student_id=None):
    user = db.query(User).filter(User.email == email).first()
    if user:
        print(f"  [exists] {email}")
        return user
    user = User(
        email=email,
        hashed_password=get_password_hash(password),
        full_name=full_name,
        role=role,
        student_id=student_id,
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"  + {role.value:10}  {full_name} <{email}>")
    return user


def _ensure_prefs(db, user_id, is_student=False):
    if not db.query(NotificationSettings).filter(NotificationSettings.user_id == user_id).first():
        db.add(NotificationSettings(user_id=user_id))
    if not db.query(UserPreferences).filter(UserPreferences.user_id == user_id).first():
        db.add(UserPreferences(user_id=user_id))
    if is_student:
        if not db.query(StudentProgress).filter(StudentProgress.student_id == user_id).first():
            db.add(StudentProgress(student_id=user_id))
    db.commit()


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

def seed_database():
    db = SessionLocal()
    try:
        print("=" * 60)
        print("  KRITERION — DATABASE SEED")
        print("=" * 60)

        # 1. Languages
        print("\n[1/4] Languages")
        allowed = {
            "name", "display_name", "file_extension",
            "compile_command", "run_command", "docker_image",
            "default_timeout_seconds", "default_memory_mb", "is_active",
        }
        for lang_data in DEFAULT_LANGUAGES:
            if not db.query(Language).filter(Language.name == lang_data["name"]).first():
                db.add(Language(**{k: v for k, v in lang_data.items() if k in allowed}))
                print(f"  + {lang_data.get('display_name', lang_data['name'])}")
        db.commit()

        # 2. Achievements & Skills
        print("\n[2/4] Achievements & Skills")
        for ach in DEFAULT_ACHIEVEMENTS:
            if not db.query(Achievement).filter(Achievement.name == ach["name"]).first():
                db.add(Achievement(**ach))
        for sk in DEFAULT_SKILLS:
            if not db.query(Skill).filter(Skill.name == sk["name"]).first():
                db.add(Skill(**sk))
        db.commit()
        print("  + seeded")

        # 3. Users
        print("\n[3/4] Admin")
        for u in ADMIN_USERS:
            admin = _upsert_user(db, u["email"], u["password"], u["full_name"], UserRole.ADMIN)
            _ensure_prefs(db, admin.id)

        print("\n[3/4] Faculty")
        for u in FACULTY_USERS:
            fac = _upsert_user(db, u["email"], u["password"], u["full_name"], UserRole.FACULTY)
            _ensure_prefs(db, fac.id)

        print("\n[3/4] Assistants")
        for u in ASSISTANT_USERS:
            ast = _upsert_user(db, u["email"], u["password"], u["full_name"], UserRole.ASSISTANT)
            _ensure_prefs(db, ast.id)

        print("\n[3/4] Students")
        for u in STUDENT_USERS:
            stu = _upsert_user(db, u["email"], u["password"], u["full_name"], UserRole.STUDENT, u["student_id"])
            _ensure_prefs(db, stu.id, is_student=True)

        # 4. Summary
        print("\n[4/4] Done")
        print("\n" + "=" * 60)
        print("  SEED COMPLETE")
        print("=" * 60)
        print()
        print("  CREDENTIALS")
        print("  ─────────────────────────────────────────────────────")
        print(f"  Admin      admin@ulm.edu              Admin@123456")
        print()
        print("  Faculty    (password: Faculty@123)")
        for u in FACULTY_USERS:
            print(f"    {u['full_name']:<20} {u['email']}")
        print()
        print("  Assistants (password: Assistant@123)")
        for u in ASSISTANT_USERS:
            print(f"    {u['full_name']:<20} {u['email']}")
        print()
        print("  Students   (password: Student@123)")
        for u in STUDENT_USERS:
            print(f"    {u['student_id']}  {u['full_name']:<20} {u['email']}")
        print()

    except Exception as e:
        print(f"\n  ERROR: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
