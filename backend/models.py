from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    devices = relationship("Device", back_populates="owner")


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    device_name = Column(String)
    os = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="devices")
    events = relationship("ActivityEvent", back_populates="device")


class ActivityEvent(Base):
    __tablename__ = "activity_events"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), index=True)
    application = Column(String, index=True)
    window_title = Column(String)
    url = Column(String, nullable=True)
    started_at = Column(DateTime, index=True)
    ended_at = Column(DateTime)
    duration_seconds = Column(Integer)
    idle = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    device = relationship("Device", back_populates="events")
