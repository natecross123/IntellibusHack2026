from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

security = HTTPBearer(auto_error=False)

class AnonymousUser:
    """Fake user object for no-auth mode"""
    def __init__(self):
        self.id = "anonymous"
        self.email = "anonymous@user.local"
        self.user_metadata = {"full_name": "Anonymous User"}

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """Always returns anonymous user - auth disabled"""
    return AnonymousUser()

async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """Always returns anonymous user - auth disabled"""
    return AnonymousUser()