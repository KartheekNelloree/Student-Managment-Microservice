import os

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Path, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from . import models
from .auth import require_user
from .database import Base, engine, get_db
from .schemas import (
    CourseCreate,
    CoursePublic,
    CourseUpdate,
    EnrollmentPublic,
)

load_dotenv()
Base.metadata.create_all(bind=engine)
app = FastAPI(title="Student Management Course Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/courses", response_model=CoursePublic, status_code=201)
def create_course(
    payload: CourseCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(require_user),
):
    course = models.Course(**payload.model_dump(), owner_id=user_id)
    db.add(course)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A course with this code already exists") from None
    db.refresh(course)
    return course


@app.get("/courses", response_model=list[CoursePublic])
def list_courses(
    db: Session = Depends(get_db),
    user_id: int = Depends(require_user),
):
    return (
        db.query(models.Course)
        .filter(models.Course.owner_id == user_id)
        .order_by(models.Course.name)
        .all()
    )


@app.get("/courses/{course_id}", response_model=CoursePublic)
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(require_user),
):
    return _find_course(db, course_id, user_id)


@app.put("/courses/{course_id}", response_model=CoursePublic)
def update_course(
    course_id: int,
    payload: CourseUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(require_user),
):
    course = _find_course(db, course_id, user_id)
    for key, value in payload.model_dump().items():
        setattr(course, key, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A course with this code already exists") from None
    db.refresh(course)
    return course


@app.delete("/courses/{course_id}", status_code=204)
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(require_user),
):
    course = _find_course(db, course_id, user_id)
    db.delete(course)
    db.commit()
    return Response(status_code=204)


@app.post(
    "/courses/{course_id}/students/{student_id}",
    response_model=EnrollmentPublic,
    status_code=201,
)
def enroll_student(
    course_id: int,
    student_id: int = Path(gt=0),
    db: Session = Depends(get_db),
    user_id: int = Depends(require_user),
):
    _find_course(db, course_id, user_id)
    enrollment = models.Enrollment(course_id=course_id, student_id=student_id)
    db.add(enrollment)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="Student is already enrolled in this course"
        ) from None
    db.refresh(enrollment)
    return enrollment


@app.delete(
    "/courses/{course_id}/students/{student_id}",
    status_code=204,
)
def unenroll_student(
    course_id: int,
    student_id: int = Path(gt=0),
    db: Session = Depends(get_db),
    user_id: int = Depends(require_user),
):
    _find_course(db, course_id, user_id)
    enrollment = (
        db.query(models.Enrollment)
        .filter(
            models.Enrollment.course_id == course_id,
            models.Enrollment.student_id == student_id,
        )
        .first()
    )
    if enrollment is None:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    db.delete(enrollment)
    db.commit()
    return Response(status_code=204)


@app.get(
    "/courses/{course_id}/students",
    response_model=list[EnrollmentPublic],
)
def list_enrollments(
    course_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(require_user),
):
    _find_course(db, course_id, user_id)
    return (
        db.query(models.Enrollment)
        .filter(models.Enrollment.course_id == course_id)
        .order_by(models.Enrollment.student_id)
        .all()
    )


@app.get("/health")
def health():
    return {"status": "ok", "service": "courses"}


def _find_course(db: Session, course_id: int, owner_id: int) -> models.Course:
    course = (
        db.query(models.Course)
        .filter(models.Course.id == course_id, models.Course.owner_id == owner_id)
        .first()
    )
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return course
