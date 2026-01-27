"""
Gamification Models - Student progress, streaks, achievements, and skills
"""
from datetime import datetime, date
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Float, Date, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class StudentProgress(Base):
    """
    StudentProgress - Tracks student's overall progress, streaks, and activity.
    One record per student.
    """
    __tablename__ = "student_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    
    # Points & XP
    total_points = Column(Integer, default=0)
    level = Column(Integer, default=1)
    xp_to_next_level = Column(Integer, default=100)
    
    # Streak tracking
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_activity_date = Column(Date, nullable=True)
    
    # Activity stats
    total_submissions = Column(Integer, default=0)
    total_assignments_completed = Column(Integer, default=0)
    total_courses_completed = Column(Integer, default=0)
    
    # Time tracking
    total_coding_time_minutes = Column(Integer, default=0)
    
    # Weekly activity (JSON array of last 52 weeks)
    weekly_activity = Column(JSON, nullable=True)  # [{"week": "2026-W01", "submissions": 5, "points": 150}, ...]
    
    # Monthly scores (JSON array of averages)
    monthly_scores = Column(JSON, nullable=True)  # [{"month": "2026-01", "average": 85.5}, ...]
    
    # Rank
    global_rank = Column(Integer, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    student = relationship("User", back_populates="progress")
    
    def __repr__(self):
        return f"<StudentProgress student={self.student_id} points={self.total_points}>"


class Achievement(Base):
    """
    Achievement - Badges and achievements students can earn.
    """
    __tablename__ = "achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic info
    name = Column(String(100), unique=True, nullable=False)
    title = Column(String(100), nullable=False)  # Display title
    description = Column(Text, nullable=False)
    
    # Visual
    icon = Column(String(50), nullable=True)  # Emoji or icon name
    color = Column(String(20), nullable=True)  # Badge color
    
    # Requirements
    requirement_type = Column(String(50), nullable=False)  # submissions, streak, points, etc.
    requirement_value = Column(Integer, nullable=False)  # Target value
    
    # Points awarded
    points_reward = Column(Integer, default=0)
    
    # Rarity
    rarity = Column(String(20), default="common")  # common, rare, epic, legendary
    
    # Status
    is_active = Column(Boolean, default=True)
    is_hidden = Column(Boolean, default=False)  # Hidden until earned
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    student_achievements = relationship("StudentAchievement", back_populates="achievement",
                                        cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Achievement {self.name}>"


class StudentAchievement(Base):
    """
    StudentAchievement - Tracks which achievements a student has earned.
    """
    __tablename__ = "student_achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id"), nullable=False)
    
    # Progress (for achievements not yet earned)
    progress = Column(Integer, default=0)
    is_completed = Column(Boolean, default=False)
    
    # Earning info
    earned_at = Column(DateTime, nullable=True)
    
    # Relationships
    student = relationship("User", back_populates="achievements")
    achievement = relationship("Achievement", back_populates="student_achievements")
    
    def __repr__(self):
        return f"<StudentAchievement student={self.student_id} achievement={self.achievement_id}>"


class Skill(Base):
    """
    Skill - Programming skills/topics students can develop.
    """
    __tablename__ = "skills"
    
    id = Column(Integer, primary_key=True, index=True)
    
    name = Column(String(100), unique=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    # Category
    category = Column(String(50), nullable=True)  # "Data Structures", "Algorithms", etc.
    
    # Visual
    color = Column(String(20), nullable=True)
    icon = Column(String(50), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    student_skills = relationship("StudentSkill", back_populates="skill", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Skill {self.name}>"


class StudentSkill(Base):
    """
    StudentSkill - Tracks student's proficiency in each skill.
    """
    __tablename__ = "student_skills"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    
    # Proficiency (0-100)
    level = Column(Integer, default=0)
    
    # Practice tracking
    practice_count = Column(Integer, default=0)
    last_practiced = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    student = relationship("User", back_populates="skills")
    skill = relationship("Skill", back_populates="student_skills")
    
    def __repr__(self):
        return f"<StudentSkill student={self.student_id} skill={self.skill_id} level={self.level}>"


# Default achievements to seed
DEFAULT_ACHIEVEMENTS = [
    {
        "name": "first_submission",
        "title": "First Steps",
        "description": "Submit your first assignment",
        "icon": "🎯",
        "requirement_type": "submissions",
        "requirement_value": 1,
        "points_reward": 10,
        "rarity": "common"
    },
    {
        "name": "perfect_score",
        "title": "Perfect!",
        "description": "Get a perfect score on an assignment",
        "icon": "💯",
        "requirement_type": "perfect_scores",
        "requirement_value": 1,
        "points_reward": 50,
        "rarity": "rare"
    },
    {
        "name": "streak_7",
        "title": "Week Warrior",
        "description": "Maintain a 7-day submission streak",
        "icon": "🔥",
        "requirement_type": "streak",
        "requirement_value": 7,
        "points_reward": 30,
        "rarity": "common"
    },
    {
        "name": "streak_30",
        "title": "Monthly Master",
        "description": "Maintain a 30-day submission streak",
        "icon": "🔥🔥",
        "requirement_type": "streak",
        "requirement_value": 30,
        "points_reward": 100,
        "rarity": "rare"
    },
    {
        "name": "submissions_10",
        "title": "Getting Started",
        "description": "Complete 10 assignments",
        "icon": "📝",
        "requirement_type": "submissions",
        "requirement_value": 10,
        "points_reward": 25,
        "rarity": "common"
    },
    {
        "name": "submissions_50",
        "title": "Dedicated Coder",
        "description": "Complete 50 assignments",
        "icon": "💻",
        "requirement_type": "submissions",
        "requirement_value": 50,
        "points_reward": 100,
        "rarity": "rare"
    },
    {
        "name": "submissions_100",
        "title": "Code Master",
        "description": "Complete 100 assignments",
        "icon": "🏆",
        "requirement_type": "submissions",
        "requirement_value": 100,
        "points_reward": 250,
        "rarity": "epic"
    },
    {
        "name": "early_bird",
        "title": "Early Bird",
        "description": "Submit 5 assignments before the deadline",
        "icon": "🐦",
        "requirement_type": "early_submissions",
        "requirement_value": 5,
        "points_reward": 20,
        "rarity": "common"
    },
    {
        "name": "all_tests_passed",
        "title": "Test Champion",
        "description": "Pass all test cases on 10 assignments",
        "icon": "✅",
        "requirement_type": "all_tests_passed",
        "requirement_value": 10,
        "points_reward": 75,
        "rarity": "rare"
    },
    {
        "name": "course_complete",
        "title": "Course Graduate",
        "description": "Complete all assignments in a course",
        "icon": "🎓",
        "requirement_type": "courses_completed",
        "requirement_value": 1,
        "points_reward": 150,
        "rarity": "epic"
    }
]


# Default skills to seed
DEFAULT_SKILLS = [
    {"name": "data_structures", "display_name": "Data Structures", "category": "Fundamentals", "color": "#3B82F6"},
    {"name": "algorithms", "display_name": "Algorithms", "category": "Fundamentals", "color": "#10B981"},
    {"name": "oop", "display_name": "Object-Oriented Programming", "category": "Paradigms", "color": "#8B5CF6"},
    {"name": "recursion", "display_name": "Recursion", "category": "Fundamentals", "color": "#F59E0B"},
    {"name": "sorting", "display_name": "Sorting Algorithms", "category": "Algorithms", "color": "#EF4444"},
    {"name": "searching", "display_name": "Searching Algorithms", "category": "Algorithms", "color": "#EC4899"},
    {"name": "dynamic_programming", "display_name": "Dynamic Programming", "category": "Advanced", "color": "#6366F1"},
    {"name": "graphs", "display_name": "Graph Algorithms", "category": "Advanced", "color": "#14B8A6"},
    {"name": "trees", "display_name": "Tree Structures", "category": "Data Structures", "color": "#22C55E"},
    {"name": "strings", "display_name": "String Manipulation", "category": "Fundamentals", "color": "#A855F7"},
    {"name": "file_io", "display_name": "File I/O", "category": "Systems", "color": "#F97316"},
    {"name": "debugging", "display_name": "Debugging", "category": "Skills", "color": "#DC2626"},
]
