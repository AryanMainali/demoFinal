"""
Seed script to create initial users for testing.
Run this after starting the database:
    python -m scripts.seed_users
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from datetime import datetime

def seed_users():
    """Create test users for each role"""
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.email == "admin@kriterion.edu").first()
        if existing_admin:
            print("Admin user already exists. Skipping...")
        else:
            # Create Admin user
            admin = User(
                email="admin@kriterion.edu",
                hashed_password=get_password_hash("Admin@123456"),
                full_name="System Administrator",
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True,
                created_at=datetime.utcnow()
            )
            db.add(admin)
            print("✅ Created Admin: admin@kriterion.edu / Admin@123456")
        
        # Check if faculty already exists
        existing_faculty = db.query(User).filter(User.email == "faculty@kriterion.edu").first()
        if existing_faculty:
            print("Faculty user already exists. Skipping...")
        else:
            # Create Faculty user
            faculty = User(
                email="faculty@kriterion.edu",
                hashed_password=get_password_hash("Faculty@123456"),
                full_name="Dr. Jane Smith",
                role=UserRole.FACULTY,
                is_active=True,
                is_verified=True,
                created_at=datetime.utcnow()
            )
            db.add(faculty)
            print("✅ Created Faculty: faculty@kriterion.edu / Faculty@123456")
        
        # Check if student already exists
        existing_student = db.query(User).filter(User.email == "student@kriterion.edu").first()
        if existing_student:
            print("Student user already exists. Skipping...")
        else:
            # Create Student user
            student = User(
                email="student@kriterion.edu",
                hashed_password=get_password_hash("Student@123456"),
                full_name="John Doe",
                role=UserRole.STUDENT,
                student_id="STU001",
                is_active=True,
                is_verified=True,
                created_at=datetime.utcnow()
            )
            db.add(student)
            print("✅ Created Student: student@kriterion.edu / Student@123456")
        
        db.commit()
        print("\n🎉 Seed completed successfully!")
        print("\nTest Credentials:")
        print("─" * 50)
        print("Admin:   admin@kriterion.edu   / Admin@123456")
        print("Faculty: faculty@kriterion.edu / Faculty@123456")
        print("Student: student@kriterion.edu / Student@123456")
        print("─" * 50)
        
    except Exception as e:
        print(f"❌ Error seeding users: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
