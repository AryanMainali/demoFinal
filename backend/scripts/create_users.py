#!/usr/bin/env python3
"""
Script to create initial admin user for Kriterion
"""
import sys
import os
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent.parent / "app"))

from app.core.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.core.security import get_password_hash

def create_admin_user():
    """Create admin user if it doesn't exist"""
    db = SessionLocal()
    
    try:
        # Check if admin user already exists
        existing_admin = db.query(User).filter(User.email == "admin@kriterion.edu").first()
        if existing_admin:
            print("Admin user already exists!")
            print(f"Email: {existing_admin.email}")
            print(f"Role: {existing_admin.role}")
            return
        
        # Create admin user
        admin_user = User(
            email="admin@kriterion.edu",
            hashed_password=get_password_hash("Admin@123456"),
            full_name="System Administrator",
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("✅ Admin user created successfully!")
        print(f"Email: {admin_user.email}")
        print(f"Password: Admin@123456")
        print(f"Role: {admin_user.role}")
        print(f"ID: {admin_user.id}")
        
        # Create sample faculty user
        faculty_user = User(
            email="faculty@kriterion.edu",
            hashed_password=get_password_hash("Faculty@123456"),
            full_name="Dr. Jane Smith",
            role=UserRole.FACULTY,
            is_active=True,
            is_verified=True
        )
        
        db.add(faculty_user)
        db.commit()
        
        print("✅ Faculty user created successfully!")
        print(f"Email: faculty@kriterion.edu")
        print(f"Password: Faculty@123456")
        
        # Create sample student user
        student_user = User(
            email="student@kriterion.edu",
            hashed_password=get_password_hash("Student@123456"),
            full_name="John Doe",
            role=UserRole.STUDENT,
            student_id="STU001",
            is_active=True,
            is_verified=True
        )
        
        db.add(student_user)
        db.commit()
        
        print("✅ Student user created successfully!")
        print(f"Email: student@kriterion.edu")
        print(f"Password: Student@123456")
        print(f"Student ID: STU001")
        
    except Exception as e:
        print(f"❌ Error creating users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()