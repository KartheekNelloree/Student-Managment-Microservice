import os

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from . import models
from .auth import require_user
from .database import Base, engine, get_db
from .schemas import StudentCreate, StudentPublic, StudentUpdate

load_dotenv()
Base.metadata.create_all(bind=engine)
app = FastAPI(title="Student Management Student Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/students", response_model=StudentPublic, status_code=201)
def create_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(require_user),
):
    student_data = payload.model_dump()
    student_data["email"] = str(payload.email).lower()
    student_data["owner_id"] = user_id
    student = models.Student(**student_data)
    db.add(student)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A student with this email already exists") from None
    db.refresh(student)
    return student


@app.get("/students", response_model=list[StudentPublic])
def list_students(
    search: str | None = Query(default=None, max_length=120),
    department: str | None = Query(default=None, max_length=120),
    db: Session = Depends(get_db),
    user_id: int = Depends(require_user),
):
    query = db.query(models.Student).filter(models.Student.owner_id == user_id)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            models.Student.name.ilike(term) | models.Student.email.ilike(term)
        )
    if department and department.strip():
        query = query.filter(models.Student.department.ilike(department.strip()))
    return query.order_by(models.Student.name).all()


@app.get("/students/{student_id}", response_model=StudentPublic)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(require_user),
):
    return _find_student(db, student_id, user_id)


@app.put("/students/{student_id}", response_model=StudentPublic)
def update_student(
    student_id: int,
    payload: StudentUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(require_user),
):
    student = _find_student(db, student_id, user_id)
    for key, value in payload.model_dump().items():
        setattr(student, key, str(value).lower() if key == "email" else value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A student with this email already exists") from None
    db.refresh(student)
    return student


@app.delete("/students/{student_id}", status_code=204)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(require_user),
):
    student = _find_student(db, student_id, user_id)
    db.delete(student)
    db.commit()
    return Response(status_code=204)


@app.get("/health")
def health():
    return {"status": "ok", "service": "students"}


def _find_student(db: Session, student_id: int, owner_id: int) -> models.Student:
    student = (
        db.query(models.Student)
        .filter(models.Student.id == student_id, models.Student.owner_id == owner_id)
        .first()
    )
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return student
