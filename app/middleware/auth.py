from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.supabase_service import supabase

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    try:
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token.")
        return user.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False))
):
    """Use this on routes where auth is optional."""
    if not credentials:
        return None
    try:
        user = supabase.auth.get_user(credentials.credentials)
        return user.user if user else None
    except Exception:
        return None