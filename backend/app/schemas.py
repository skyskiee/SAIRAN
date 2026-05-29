from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr


class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Auth ----------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


# ---------- Users ----------
class UserOut(ORMBase):
    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    organization_id: int | None = None


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: str = "ORG_USER"
    organization_id: int | None = None


# ---------- Organization ----------
class OrganizationOut(ORMBase):
    id: int
    name: str
    industry: str | None = None
    size: str | None = None


class OrganizationCreate(BaseModel):
    name: str
    industry: str | None = None
    size: str | None = None


# ---------- Question ----------
class AnswerOption(BaseModel):
    value: str
    score: int
    label: str | None = None


class QuestionOut(ORMBase):
    id: int
    question_code: str
    dimension: str
    sub_dimension: str | None = None
    text: str
    help_text: str | None = None
    answer_type: str
    answer_options: list[AnswerOption]
    weight: int
    required: bool
    is_active: bool
    order_index: int


class QuestionCreate(BaseModel):
    question_code: str
    dimension: str
    sub_dimension: str | None = None
    text: str
    help_text: str | None = None
    answer_type: str = "YES_NO_INPROGRESS"
    answer_options: list[AnswerOption]
    weight: int = 1
    required: bool = True
    order_index: int = 0


class QuestionUpdate(BaseModel):
    text: str | None = None
    help_text: str | None = None
    weight: int | None = None
    is_active: bool | None = None
    order_index: int | None = None


# ---------- Assessment ----------
class AssessmentOut(ORMBase):
    id: int
    name: str
    organization_id: int
    status: str
    questionnaire_version: str
    created_at: datetime
    updated_at: datetime
    submitted_at: datetime | None = None
    overall_score: float | None = None
    overall_level: str | None = None
    dimension_scores: dict[str, Any] | None = None
    completion_percentage: int = 0


class AssessmentCreate(BaseModel):
    name: str


class ResponseIn(BaseModel):
    question_id: int
    answer_value: str


class ResponseOut(ORMBase):
    id: int
    question_id: int
    answer_value: str
    answer_score: int


class AssessmentDetail(AssessmentOut):
    responses: list[ResponseOut] = []


# ---------- Recommendation ----------
class RecommendationOut(ORMBase):
    id: int
    title: str
    dimension: str
    priority: str
    description: str


# ---------- Report ----------
class DimensionAnalysis(BaseModel):
    dimension_code: str
    dimension_name: str
    score: float
    readiness_level: str
    description: str
    interpretation: str


class ReportData(BaseModel):
    report_metadata: dict[str, str]
    organization: dict[str, str]
    assessment: dict[str, str]
    executive_summary: dict[str, str]
    readiness_scores: dict[str, Any]
    dimension_analysis: list[DimensionAnalysis]
    recommendations: list[RecommendationOut]
    methodology_note: dict[str, str]
    disclaimer: dict[str, str]


Token.model_rebuild()
