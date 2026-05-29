from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(subject: str, extra_claims: dict | None = None) -> str:
    now = datetime.now(timezone.utc)
    payload: dict = {
        "sub": subject,
        "iat": now,
        "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise ValueError("Invalid token") from exc
