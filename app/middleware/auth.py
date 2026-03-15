from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.supabase_service import get_supabase  # Change this import

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        supabase = get_supabase()  # Get client inside function
        res = supabase.auth.get_user(token)
        if res.user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid or expired token."
            )
        return res.user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail=str(e)
        )


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False))
):
    """Use this on routes where auth is optional."""
    if not credentials:
        return None
    try:
        supabase = get_supabase()  # Get client inside function
        user = supabase.auth.get_user(credentials.credentials)
        return user.user if user else None
    except Exception:
        return None