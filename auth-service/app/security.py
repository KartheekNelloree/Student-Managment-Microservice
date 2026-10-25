import os
from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()


def _jwt_settings() -> tuple[str, str, int]:
    secret = os.getenv("JWT_SECRET_KEY")
    if not secret:
        raise RuntimeError("JWT_SECRET_KEY must be configured")
    algorithm = os.getenv("JWT_ALGORITHM", "HS256")
    expires_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    return secret, algorithm, expires_minutes


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)


def create_access_token(user_id: int) -> str:
    secret, algorithm, expires_minutes = _jwt_settings()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    return jwt.encode(
        {"sub": str(user_id), "exp": expires_at},
        secret,
        algorithm=algorithm,
    )


def decode_access_token(token: str) -> int:
    secret, algorithm, _ = _jwt_settings()
    payload = jwt.decode(token, secret, algorithms=[algorithm])
    subject = payload.get("sub")
    if not subject or not subject.isdigit():
        raise jwt.InvalidTokenError("Invalid token subject")
    return int(subject)
