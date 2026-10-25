import os

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

load_dotenv()
security = HTTPBearer(auto_error=False)


def require_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> int:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    secret = os.getenv("JWT_SECRET_KEY")
    if not secret:
        raise RuntimeError("JWT_SECRET_KEY must be configured")
    try:
        payload = jwt.decode(
            credentials.credentials,
            secret,
            algorithms=[os.getenv("JWT_ALGORITHM", "HS256")],
        )
        user_id = payload.get("sub")
        if not user_id or not str(user_id).isdigit():
            raise jwt.InvalidTokenError("Invalid subject")
        return int(user_id)
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from None
