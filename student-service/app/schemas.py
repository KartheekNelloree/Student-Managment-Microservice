from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, ValidationInfo, field_validator


class StudentBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(default="", max_length=40)
    department: str = Field(min_length=2, max_length=120)
    course_id: int | None = Field(default=None, gt=0)

    @field_validator("name", "department", "phone")
    @classmethod
    def trim_text(cls, value: str, info: ValidationInfo) -> str:
        value = value.strip()
        if not value and info.field_name != "phone":
            raise ValueError("This field cannot be blank")
        return value


class StudentCreate(StudentBase):
    pass


class StudentUpdate(StudentBase):
    pass


class StudentPublic(StudentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
