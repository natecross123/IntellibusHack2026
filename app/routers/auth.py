from fastapi import APIRouter

router = APIRouter()

@router.get("/me")
async def get_me():
    """Auth disabled - returns anonymous user"""
    return {
        "user_id": "anonymous",
        "email": "anonymous@user.local",
        "full_name": "Anonymous User",
    }

# All other auth routes disabled
# Authentication is handled by middleware returning anonymous user