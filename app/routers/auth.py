from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.supabase_service import supabase

router = APIRouter()


class AuthRequest(BaseModel):
    email: str
    password: str


@router.post("/register")
async def register(request: AuthRequest):
    try:
        res = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password
        })
        if res.user is None:
            raise HTTPException(status_code=400, detail="Registration failed.")
        return {"message": "Registration successful. Check your email to confirm."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login(request: AuthRequest):
    try:
        res = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        if res.user is None:
            raise HTTPException(status_code=401, detail="Invalid credentials.")
        return {
            "access_token": res.session.access_token,
            "token_type": "bearer",
            "user_id": str(res.user.id),
            "email": res.user.email,
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/me")
async def get_me(credentials=Depends(__import__('app.middleware.auth',
                 fromlist=['get_current_user']).get_current_user)):
    return {
        "user_id": str(credentials.id),
        "email": credentials.email,
    }