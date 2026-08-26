from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
import models, schemas

# User
def create_user(db: Session, user: schemas.UserCreate):
    # In a real app, hash the password!
    fake_hashed_password = user.password + "notreallyhashed"
    db_user = models.User(email=user.email, password_hash=fake_hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

# Device
def create_device(db: Session, device: schemas.DeviceCreate):
    db_device = models.Device(
        user_id=device.user_id,
        device_name=device.device_name,
        os=device.os
    )
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device

# Activity Event
def create_activity_events(db: Session, device_id: int, events: list[schemas.ActivityEventCreate]):
    db_events = []
    for e in events:
        db_event = models.ActivityEvent(
            device_id=device_id,
            application=e.application,
            window_title=e.window_title,
            url=e.url,
            started_at=e.started_at,
            ended_at=e.ended_at,
            duration_seconds=e.duration_seconds,
            idle=e.idle
        )
        db_events.append(db_event)
    
    db.add_all(db_events)
    db.commit()
    for e in db_events:
        db.refresh(e)
    return db_events

def get_todays_events(db: Session, user_id: int):
    today = date.today()
    start_of_day = datetime(today.year, today.month, today.day)
    return db.query(models.ActivityEvent)\
        .join(models.Device)\
        .filter(models.Device.user_id == user_id)\
        .filter(models.ActivityEvent.started_at >= start_of_day)\
        .all()

def get_historical_events(db: Session, user_id: int, start_date_str: str, end_date_str: str):
    start_date = datetime.fromisoformat(start_date_str)
    end_date = datetime.fromisoformat(end_date_str)
    return db.query(models.ActivityEvent)\
        .join(models.Device)\
        .filter(models.Device.user_id == user_id)\
        .filter(models.ActivityEvent.started_at >= start_date)\
        .filter(models.ActivityEvent.started_at <= end_date)\
        .order_by(models.ActivityEvent.started_at.asc())\
        .all()
