import os

import jwt
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from . import models
from .database import Base, engine, get_db
from .schemas import LoginRequest, TokenResponse, UserCreate, UserPublic
from .security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)

load_dotenv()
Base.metadata.create_all(bind=engine)
app = FastAPI(title="Student Management Auth Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> models.User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        user_id = decode_access_token(credentials.credentials)
    except (jwt.InvalidTokenError, RuntimeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None
    user = db.get(models.User, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user


@app.post("/auth/register", response_model=UserPublic, status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    email = str(payload.email).lower()
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=409, detail="Email is already registered")
    user = models.User(
        name=payload.name,
        email=email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email is already registered") from None
    db.refresh(user)
    return user


@app.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = str(payload.email).lower()
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return TokenResponse(access_token=create_access_token(user.id), user=user)


@app.get("/auth/me", response_model=UserPublic)
def read_current_user(user: models.User = Depends(get_current_user)):
    return user


@app.get("/health")
def health():
    return {"status": "ok", "service": "auth"}
