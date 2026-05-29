from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_system_admin
from app.core.database import get_db
from app.models import Organization, Role, User
from app.schemas import OrganizationCreate, OrganizationOut

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.get("", response_model=list[OrganizationOut])
def list_organizations(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role == Role.SYSTEM_ADMIN.value:
        return db.query(Organization).order_by(Organization.name).all()
    # Non-admins only see their own org
    if not user.organization_id:
        return []
    org = db.get(Organization, user.organization_id)
    return [org] if org else []


@router.post("", response_model=OrganizationOut, status_code=status.HTTP_201_CREATED)
def create_organization(
    payload: OrganizationCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_system_admin),
):
    if db.query(Organization).filter(Organization.name == payload.name).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Organization name already exists")
    org = Organization(**payload.model_dump())
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@router.get("/{org_id}", response_model=OrganizationOut)
def get_organization(
    org_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organization not found")
    if user.role != Role.SYSTEM_ADMIN.value and user.organization_id != org.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Cannot access this organization")
    return org
