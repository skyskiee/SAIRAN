from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_org_admin
from app.core.database import get_db
from app.core.security import hash_password
from app.models import Role, User
from app.schemas import UserCreate, UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), user: User = Depends(require_org_admin)):
    q = db.query(User)
    if user.role == Role.ORG_ADMIN.value:
        q = q.filter(User.organization_id == user.organization_id)
    return q.order_by(User.email).all()


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current: User = Depends(require_org_admin),
):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    # Org admins can only create users in their own org
    org_id = payload.organization_id
    if current.role == Role.ORG_ADMIN.value:
        if payload.role == Role.SYSTEM_ADMIN.value:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Cannot create system admin")
        org_id = current.organization_id

    u = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        organization_id=org_id,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u
