#!/usr/bin/env python3
"""
Seed database with initial data
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from datetime import datetime, timedelta
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.course import Course, Enrollment
from app.models.assignment import Assignment
from app.models.rubric import Rubric, DEFAULT_RUBRIC
from app.models.test_case import TestSuite, TestCase


def seed_database():
    """Seed database with initial data"""
    db = SessionLocal()
    
    try:
        print("🌱 Seeding database...")
        
        # Create admin user
        admin = db.query(User).filter(User.email == settings.INITIAL_ADMIN_EMAIL).first()
        if not admin:
            admin = User(
                email=settings.INITIAL_ADMIN_EMAIL,
                hashed_password=get_password_hash(settings.INITIAL_ADMIN_PASSWORD),
                full_name="System Administrator",
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True
            )
            db.add(admin)
            db.commit()
            print(f"✅ Created admin user: {admin.email}")
        else:
            print(f"ℹ️  Admin user already exists: {admin.email}")
        
        # Create sample faculty
        faculty = db.query(User).filter(User.email == "faculty@kriterion.edu").first()
        if not faculty:
            faculty = User(
                email="faculty@kriterion.edu",
                hashed_password=get_password_hash("Faculty@123"),
                full_name="Dr. Jane Smith",
                role=UserRole.FACULTY,
                is_active=True,
                is_verified=True
            )
            db.add(faculty)
            db.commit()
            print(f"✅ Created faculty user: {faculty.email}")
        else:
            print(f"ℹ️  Faculty user already exists: {faculty.email}")
        
        # Create sample students
        students = []
        for i in range(1, 4):
            email = f"student{i}@kriterion.edu"
            student = db.query(User).filter(User.email == email).first()
            if not student:
                student = User(
                    email=email,
                    hashed_password=get_password_hash(f"Student{i}@123"),
                    full_name=f"Student {i}",
                    role=UserRole.STUDENT,
                    student_id=f"S{1000 + i}",
                    is_active=True,
                    is_verified=True
                )
                db.add(student)
                db.commit()
                print(f"✅ Created student: {student.email}")
            else:
                print(f"ℹ️  Student already exists: {student.email}")
            students.append(student)
        
        # Create sample course
        course = db.query(Course).filter(Course.code == "CS101").first()
        if not course:
            course = Course(
                code="CS101",
                name="Introduction to Computer Science",
                description="Foundational course in computer science and programming",
                section="A",
                semester="Spring",
                year=2026,
                instructor_id=faculty.id,
                is_active=True
            )
            db.add(course)
            db.commit()
            print(f"✅ Created course: {course.code}")
            
            # Enroll students
            for student in students:
                enrollment = Enrollment(
                    user_id=student.id,
                    course_id=course.id,
                    is_active=True
                )
                db.add(enrollment)
            db.commit()
            print(f"✅ Enrolled {len(students)} students in {course.code}")
        else:
            print(f"ℹ️  Course already exists: {course.code}")
        
        # Create sample assignment
        assignment = db.query(Assignment).filter(
            Assignment.title == "Hello World"
        ).first()
        if not assignment:
            due_date = datetime.utcnow() + timedelta(days=7)
            assignment = Assignment(
                course_id=course.id,
                title="Hello World",
                description="""
# Assignment 1: Hello World

Write a simple program that prints "Hello, World!" to the console.

## Requirements:
- Create a file named `main.py`
- Print exactly: Hello, World!
- No additional output

## Submission:
Upload your `main.py` file
                """.strip(),
                language="python",
                due_date=due_date,
                late_penalty_per_day=10.0,
                max_attempts=3,
                allow_groups=False,
                required_files=["main.py"],
                is_published=True
            )
            db.add(assignment)
            db.commit()
            print(f"✅ Created assignment: {assignment.title}")
            
            # Create rubric
            rubric = Rubric(
                assignment_id=assignment.id,
                rubric_data=DEFAULT_RUBRIC,
                total_points=100.0
            )
            db.add(rubric)
            db.commit()
            print(f"✅ Created rubric for assignment: {assignment.title}")
            
            # Create test suite
            test_suite = TestSuite(
                assignment_id=assignment.id,
                name="Public Tests",
                description="Basic output validation",
                test_type="input_output",
                visibility="public",
                timeout_seconds=5
            )
            db.add(test_suite)
            db.commit()
            
            # Create test case
            test_case = TestCase(
                test_suite_id=test_suite.id,
                name="Test Hello World Output",
                description="Verify program prints 'Hello, World!'",
                input_data="",
                expected_output="Hello, World!",
                points=10.0,
                ignore_whitespace=True,
                order=1
            )
            db.add(test_case)
            db.commit()
            print(f"✅ Created test suite with 1 test case")
        else:
            print(f"ℹ️  Assignment already exists: {assignment.title}")
        
        print("\n✨ Database seeding complete!")
        print("\n📋 Default Credentials:")
        print(f"   Admin: {settings.INITIAL_ADMIN_EMAIL} / {settings.INITIAL_ADMIN_PASSWORD}")
        print(f"   Faculty: faculty@kriterion.edu / Faculty@123")
        print(f"   Student 1: student1@kriterion.edu / Student1@123")
        print(f"   Student 2: student2@kriterion.edu / Student2@123")
        print(f"   Student 3: student3@kriterion.edu / Student3@123")
        print("\n⚠️  Change these passwords in production!")
        
    except Exception as e:
        print(f"❌ Error seeding database: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
