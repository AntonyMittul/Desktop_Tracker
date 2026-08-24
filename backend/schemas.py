from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

# Users
class UserCreate(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime
    class Config:
        from_attributes = True

# Devices
class DeviceCreate(BaseModel):
    user_id: int
    device_name: str
    os: str

class DeviceResponse(BaseModel):
    id: int
    user_id: int
    device_name: str
    os: str
    created_at: datetime
    class Config:
        from_attributes = True

# Events
class ActivityEventCreate(BaseModel):
    application: str
    window_title: str
    url: Optional[str] = None
    started_at: datetime
    ended_at: datetime
    duration_seconds: int
    idle: bool = False

class ActivityEventResponse(ActivityEventCreate):
    id: int
    device_id: int
    created_at: datetime
    class Config:
        from_attributes = True
