from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models, schemas, crud
from database import get_db, engine

# For initial setup before Alembic (optional, Alembic is preferred)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="FocusLens API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows Next.js frontend (Vercel) and desktop agent
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "FocusLens API is running"}

@app.get("/debug")
def debug_db(db: Session = Depends(get_db)):
    try:
        count = db.query(models.Device).count()
        return {"status": "ok", "device_count": count}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.post("/auth/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.post("/devices/register", response_model=schemas.DeviceResponse)
def register_device(device: schemas.DeviceCreate, db: Session = Depends(get_db)):
    return crud.create_device(db=db, device=device)

@app.post("/activity/events", response_model=List[schemas.ActivityEventResponse])
def ingest_events(device_id: int, events: List[schemas.ActivityEventCreate], db: Session = Depends(get_db)):
    return crud.create_activity_events(db=db, device_id=device_id, events=events)

@app.get("/activity/today", response_model=List[schemas.ActivityEventResponse])
def get_activity_today(user_id: int = 1, db: Session = Depends(get_db)):
    return crud.get_todays_events(db=db, user_id=user_id)

@app.get("/activity/history", response_model=List[schemas.ActivityEventResponse])
def get_activity_history(start_date: str, end_date: str, user_id: int = 1, db: Session = Depends(get_db)):
    return crud.get_historical_events(db=db, user_id=user_id, start_date_str=start_date, end_date_str=end_date)
