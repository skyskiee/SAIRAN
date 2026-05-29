from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import Assessment, AssessmentStatus, Role, User
from app.services.report import build_report, report_filename

router = APIRouter(prefix="/reports", tags=["reports"])


def _assert_access(assessment: Assessment, user: User) -> None:
    if user.role == Role.SYSTEM_ADMIN.value:
        return
    if assessment.organization_id != user.organization_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Cannot access this report")


@router.get("/{assessment_id}")
def get_report_json(
    assessment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    a = db.get(Assessment, assessment_id)
    if not a:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Assessment not found")
    _assert_access(a, user)
    if a.status != AssessmentStatus.COMPLETED.value:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Report is only available for completed assessments",
        )
    return {
        "filename": report_filename(a),
        **build_report(a),
    }
