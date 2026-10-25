from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, field_validator


class CourseBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    code: str = Field(min_length=2, max_length=30)
    description: str = Field(default="", max_length=1000)
    department: str = Field(min_length=2, max_length=120)

    @field_validator("name", "code", "description", "department")
    @classmethod
    def trim_text(cls, value: str, info: ValidationInfo) -> str:
        value = value.strip()
        if not value and info.field_name != "description":
            raise ValueError("This field cannot be blank")
        return value

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        return value.strip().upper()


class CourseCreate(CourseBase):
    pass


class CourseUpdate(CourseBase):
    pass


class CoursePublic(CourseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class EnrollmentPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_id: int
    student_id: int
    enrolled_at: datetime
