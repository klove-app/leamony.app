from sqlalchemy import Column, String, Float, Boolean, REAL, DateTime
from sqlalchemy.orm import Session, relationship
from datetime import datetime
from database.base import Base, get_db
from database.models.running_log import RunningLog

class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, index=True)
    username = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    yearly_goal = Column(REAL, nullable=True)
    yearly_progress = Column(REAL, nullable=True)
    goal_km = Column(Float, default=0)
    is_active = Column(Boolean, default=True)
    chat_type = Column(String, default='group')  # 'private' или 'group'

    # Отношение к пробежкам
    runs = relationship("RunningLog", back_populates="user")

    @classmethod
    def get_by_id(cls, user_id: str) -> "User":
        db = next(get_db())
        return db.query(cls).filter(cls.user_id == user_id).first()

    @classmethod
    def create(cls, user_id: str, username: str = None) -> "User":
        db = next(get_db())
        user = cls(user_id=user_id, username=username)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def update(self):
        db = next(get_db())
        db.add(self)
        db.commit()
        db.refresh(self) 