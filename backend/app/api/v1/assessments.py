from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import Assessment, AssessmentStatus, Question, Response as ResponseModel, Role, User
from app.schemas import (
    AssessmentCreate,
    AssessmentDetail,
    AssessmentOut,
    RecommendationOut,
    ResponseIn,
    ResponseOut,
)
from app.services.recommendations import generate_recommendations
from app.services.scoring import compute_scores, score_for_answer

router = APIRouter(prefix="/assessments", tags=["assessments"])


def _completion_pct(assessment: Assessment, total_required: int) -> int:
    if total_required == 0:
        return 0
    answered = len(assessment.responses)
    return min(100, int(round(answered * 100 / total_required)))


def _to_out(assessment: Assessment, db: Session) -> AssessmentOut:
    total_required = (
        db.query(Question).filter(Question.is_active.is_(True), Question.required.is_(True)).count()
    )
    data = AssessmentOut.model_validate(assessment).model_dump()
    data["completion_percentage"] = _completion_pct(assessment, total_required)
    return AssessmentOut(**data)


def _check_access(assessment: Assessment, user: User) -> None:
    if user.role == Role.SYSTEM_ADMIN.value:
        return
    if assessment.organization_id != user.organization_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Cannot access this assessment")


@router.get("", response_model=list[AssessmentOut])
def list_assessments(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Assessment)
    if user.role != Role.SYSTEM_ADMIN.value:
        if not user.organization_id:
            return []
        q = q.filter(Assessment.organization_id == user.organization_id)
    assessments = q.order_by(Assessment.updated_at.desc()).all()
    return [_to_out(a, db) for a in assessments]


@router.post("", response_model=AssessmentOut, status_code=status.HTTP_201_CREATED)
def create_assessment(
    payload: AssessmentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user.organization_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "User has no organization")
    a = Assessment(
        name=payload.name,
        organization_id=user.organization_id,
        created_by_id=user.id,
        status=AssessmentStatus.DRAFT.value,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return _to_out(a, db)


@router.get("/{assessment_id}", response_model=AssessmentDetail)
def get_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    a = db.get(Assessment, assessment_id)
    if not a:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Assessment not found")
    _check_access(a, user)
    total_required = (
        db.query(Question).filter(Question.is_active.is_(True), Question.required.is_(True)).count()
    )
    data = AssessmentDetail.model_validate(a).model_dump()
    data["completion_percentage"] = _completion_pct(a, total_required)
    return AssessmentDetail(**data)


@router.put("/{assessment_id}/responses/{question_id}", response_model=ResponseOut)
def save_response(
    assessment_id: int,
    question_id: int,
    payload: ResponseIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    a = db.get(Assessment, assessment_id)
    if not a:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Assessment not found")
    _check_access(a, user)
    if a.status in {AssessmentStatus.COMPLETED.value, AssessmentStatus.ARCHIVED.value}:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Assessment is locked and cannot be edited")

    q = db.get(Question, question_id)
    if not q or not q.is_active:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Question not found or inactive")

    try:
        score = score_for_answer(q, payload.answer_value)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))

    existing = (
        db.query(ResponseModel)
        .filter(ResponseModel.assessment_id == a.id, ResponseModel.question_id == q.id)
        .first()
    )
    if existing:
        existing.answer_value = payload.answer_value
        existing.answer_score = score
        resp = existing
    else:
        resp = ResponseModel(
            assessment_id=a.id,
            question_id=q.id,
            answer_value=payload.answer_value,
            answer_score=score,
        )
        db.add(resp)

    # advance status Draft -> In Progress on first answer
    if a.status == AssessmentStatus.DRAFT.value:
        a.status = AssessmentStatus.IN_PROGRESS.value
    db.commit()
    db.refresh(resp)
    return resp


@router.post("/{assessment_id}/submit", response_model=AssessmentOut)
def submit_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    a = db.get(Assessment, assessment_id)
    if not a:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Assessment not found")
    _check_access(a, user)
    if a.status == AssessmentStatus.COMPLETED.value:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Assessment already submitted")

    required_ids = {
        q.id
        for q in db.query(Question)
        .filter(Question.is_active.is_(True), Question.required.is_(True))
        .all()
    }
    answered_ids = {r.question_id for r in a.responses}
    missing = required_ids - answered_ids
    if missing:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"{len(missing)} required question(s) remain unanswered",
        )

    scores = compute_scores(a.responses)
    a.overall_score = scores["overall_score"]
    a.overall_level = scores["overall_level"]
    a.dimension_scores = scores["dimension_scores"]
    a.status = AssessmentStatus.COMPLETED.value
    a.submitted_at = datetime.now(timezone.utc)

    # Clear any prior recommendations, regenerate fresh
    for r in list(a.recommendations):
        db.delete(r)
    db.flush()
    for rec in generate_recommendations(a.id, a.responses):
        db.add(rec)

    db.commit()
    db.refresh(a)
    return _to_out(a, db)


@router.get("/{assessment_id}/recommendations", response_model=list[RecommendationOut])
def get_recommendations(
    assessment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    a = db.get(Assessment, assessment_id)
    if not a:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Assessment not found")
    _check_access(a, user)
    return a.recommendations
