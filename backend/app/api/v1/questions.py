from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_system_admin
from app.core.database import get_db
from app.models import Question, User
from app.schemas import QuestionCreate, QuestionOut, QuestionUpdate

router = APIRouter(prefix="/questions", tags=["questions"])


@router.get("", response_model=list[QuestionOut])
def list_questions(
    active_only: bool = True,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Question)
    if active_only:
        q = q.filter(Question.is_active.is_(True))
    return q.order_by(Question.dimension, Question.order_index, Question.question_code).all()


@router.post("", response_model=QuestionOut, status_code=status.HTTP_201_CREATED)
def create_question(
    payload: QuestionCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_system_admin),
):
    if db.query(Question).filter(Question.question_code == payload.question_code).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Question code already exists")
    q = Question(**payload.model_dump())
    db.add(q)
    db.commit()
    db.refresh(q)
    return q


@router.patch("/{question_id}", response_model=QuestionOut)
def update_question(
    question_id: int,
    payload: QuestionUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_system_admin),
):
    q = db.get(Question, question_id)
    if not q:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Question not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(q, field, value)
    db.commit()
    db.refresh(q)
    return q
