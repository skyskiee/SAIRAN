from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Role(str, Enum):
    ORG_USER = "ORG_USER"
    ORG_ADMIN = "ORG_ADMIN"
    SYSTEM_ADMIN = "SYSTEM_ADMIN"


class AssessmentStatus(str, Enum):
    DRAFT = "DRAFT"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"


class Dimension(str, Enum):
    PEOPLE = "People"
    PROCESS = "Process"
    TECHNOLOGY = "Technology"
    ECOSYSTEM = "Ecosystem"
    GOVERNANCE = "Governance"


DIMENSION_CODE = {
    Dimension.PEOPLE: "PPL",
    Dimension.PROCESS: "PRC",
    Dimension.TECHNOLOGY: "TEC",
    Dimension.ECOSYSTEM: "ECO",
    Dimension.GOVERNANCE: "GOV",
}


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True)
    industry: Mapped[str | None] = mapped_column(String(100), nullable=True)
    size: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)

    users: Mapped[list["User"]] = relationship(back_populates="organization", cascade="all, delete-orphan")
    assessments: Mapped[list["Assessment"]] = relationship(back_populates="organization", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(200))
    hashed_password: Mapped[str] = mapped_column(String(200))
    role: Mapped[str] = mapped_column(String(30), default=Role.ORG_USER.value)
    is_active: Mapped[bool] = mapped_column(default=True)
    organization_id: Mapped[int | None] = mapped_column(ForeignKey("organizations.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)

    organization: Mapped[Organization | None] = relationship(back_populates="users")


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    question_code: Mapped[str] = mapped_column(String(20), unique=True)  # e.g. PPL-01
    dimension: Mapped[str] = mapped_column(String(30))  # Dimension enum value
    sub_dimension: Mapped[str | None] = mapped_column(String(100), nullable=True)
    text: Mapped[str] = mapped_column(Text)
    help_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    answer_type: Mapped[str] = mapped_column(String(30), default="YES_NO_INPROGRESS")
    # answer_options: list of {value: str, score: int}
    answer_options: Mapped[list] = mapped_column(JSON, default=list)
    weight: Mapped[int] = mapped_column(Integer, default=1)
    required: Mapped[bool] = mapped_column(default=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    version: Mapped[str] = mapped_column(String(10), default="v1")
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


class Assessment(Base):
    __tablename__ = "assessments"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"))
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(30), default=AssessmentStatus.DRAFT.value)
    questionnaire_version: Mapped[str] = mapped_column(String(10), default="v1")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, onupdate=_utcnow)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # scores (set after submission)
    overall_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    overall_level: Mapped[str | None] = mapped_column(String(30), nullable=True)
    dimension_scores: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # e.g. {"People": {"score": 3.8, "level": "Advanced"}, ...}

    organization: Mapped[Organization] = relationship(back_populates="assessments")
    responses: Mapped[list["Response"]] = relationship(back_populates="assessment", cascade="all, delete-orphan")
    recommendations: Mapped[list["Recommendation"]] = relationship(back_populates="assessment", cascade="all, delete-orphan")


class Response(Base):
    __tablename__ = "responses"

    id: Mapped[int] = mapped_column(primary_key=True)
    assessment_id: Mapped[int] = mapped_column(ForeignKey("assessments.id"))
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id"))
    answer_value: Mapped[str] = mapped_column(String(50))  # "Yes" | "In Progress" | "No" | "1".."5"
    answer_score: Mapped[int] = mapped_column(Integer)  # mapped numeric score
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, onupdate=_utcnow)

    assessment: Mapped[Assessment] = relationship(back_populates="responses")
    question: Mapped[Question] = relationship()


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(primary_key=True)
    assessment_id: Mapped[int] = mapped_column(ForeignKey("assessments.id"))
    title: Mapped[str] = mapped_column(String(300))
    dimension: Mapped[str] = mapped_column(String(30))
    priority: Mapped[str] = mapped_column(String(50))  # Priority Action | Suggested Improvement | Opportunity for Enhancement
    description: Mapped[str] = mapped_column(Text)
    source_question_code: Mapped[str | None] = mapped_column(String(20), nullable=True)

    assessment: Mapped[Assessment] = relationship(back_populates="recommendations")
