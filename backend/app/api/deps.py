from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models import Role, User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    # DEVELOPMENT: Accept dev bypass token
    if token == "dev-token-bypass":
        # Return the system admin user for development
        user = db.query(User).filter(User.email == "admin@sairan.ph").first()
        if user:
            return user

    try:
        payload = decode_token(token)
        user_id = int(payload["sub"])
    except (ValueError, KeyError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid authentication credentials")

    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found or inactive")
    return user


def require_roles(*allowed: Role):
    allowed_values = {r.value for r in allowed}

    def _checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_values:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient permissions")
        return user

    return _checker


require_system_admin = require_roles(Role.SYSTEM_ADMIN)
require_org_admin = require_roles(Role.ORG_ADMIN, Role.SYSTEM_ADMIN)
