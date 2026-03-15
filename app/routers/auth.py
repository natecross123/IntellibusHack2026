#from datetime import datetime
#from fastapi import APIRouter, HTTPException, Depends, status
#from starlette.responses import RedirectResponse
#from pydantic import BaseModel, EmailStr
#from typing import Optional
#from app.services.email_service import generate_verification_code, code_expiry, send_verification_email
#from app.services.supabase_service import get_supabase  # Import the function
#import logging
#import os
#from app.middleware.auth import get_current_user
#
#router = APIRouter()
#logger = logging.getLogger(__name__)
#
#
#def _normalize_email(email: str) -> str:
#    return email.strip().lower()
#
#
#def _validate_password(password: str) -> None:
#    # Supabase stores password hashes securely; we enforce basic quality at API edge.
#    if len(password) < 8:
#        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
#
##------------------------------------------------
#class AuthRequest(BaseModel):
#    email: EmailStr
#    password: str
#    full_name: Optional[str] = None
#
#class VerifyRequest(BaseModel):
#    code: str
#
##-------------------------------------------------
#
#@router.post("/register", status_code=status.HTTP_201_CREATED)
#async def register(request: AuthRequest):
#    try:
#        email = _normalize_email(str(request.email))
#        _validate_password(request.password)
#        full_name = (request.full_name or "").strip()
#
#        supabase = get_supabase()  # Get client inside function
#        sign_up_payload = {
#            "email": email,
#            "password": request.password
#        }
#        if full_name:
#            sign_up_payload["options"] = {"data": {"full_name": full_name}}
#
#        res = supabase.auth.sign_up(sign_up_payload)
#        if res.user is None:
#            raise HTTPException(
#                status_code=400, 
#                detail="Registration failed."
#            )
#
#        code = generate_verification_code()
#        expiry = code_expiry()
#
#        supabase.table("verification_codes").insert({
#            "user_id": str(res.user.id),
#            "code": code,
#            "expires_at": expiry.isoformat()
#        }).execute()
#
#        result = send_verification_email(
#            to_email=email,
#            to_name=email.split("@")[0],
#            code=code
#        )
#
#        if not result["success"]:
#            logger.warning(f"[Register] Email failed for {email}, code logged to console.")
#
#        return {"message": "Registration successful. Check your email to confirm."}
#    except HTTPException:
#        raise
#    except Exception as e:
#        raise HTTPException(
#            status_code=400, 
#            detail=str(e)
#        )
#
#@router.post("/login")
#async def login(request: AuthRequest):
#    try:
#        email = _normalize_email(str(request.email))
#        _validate_password(request.password)
#
#        supabase = get_supabase()  # Get client inside function
#        res = supabase.auth.sign_in_with_password({
#            "email": email,
#            "password": request.password
#        })
#        if res.user is None:
#            raise HTTPException(
#                status_code=401, 
#                detail="Invalid credentials."
#            )
#        return {
#            "access_token": res.session.access_token,
#            "refresh_token": res.session.refresh_token,
#            "token_type": "bearer",
#            "user_id": str(res.user.id),
#            "email": res.user.email,
#            "full_name": (res.user.user_metadata or {}).get("full_name"),
#        }
#    except HTTPException:
#        raise
#    except Exception as e:
#        raise HTTPException(
#            status_code=401, 
#            detail=str(e)
#        )
#    
#@router.post("/verify")
#async def verify_email(request: VerifyRequest, user=Depends(get_current_user)):
#    try:
#        supabase = get_supabase()  # Get client inside function
#        res = supabase.table("verification_codes")\
#            .select("*")\
#            .eq("user_id", str(user.id))\
#            .eq("code", request.code)\
#            .eq("used", False)\
#            .execute()
#
#        if not res.data:
#            raise HTTPException(status_code=400, detail="Invalid or expired code.")
#
#        record = res.data[0]
#
#        expires_at = datetime.fromisoformat(record["expires_at"])
#        if datetime.utcnow() > expires_at:
#            raise HTTPException(status_code=400, detail="Code has expired.")
#
#        supabase.table("verification_codes")\
#            .update({"used": True})\
#            .eq("id", record["id"])\
#            .execute()
#
#        return {"message": "Email verified successfully."}
#
#    except HTTPException:
#        raise
#    except Exception as e:
#        raise HTTPException(status_code=400, detail=str(e))
#
#@router.post("/logout")
#async def logout(user=Depends(get_current_user)):
#    try:
#        supabase = get_supabase()  # Get client inside function
#        supabase.auth.sign_out()
#        return {"message": "Logged out successfully."}
#    except Exception as e:
#        raise HTTPException(
#            status_code=status.HTTP_400_BAD_REQUEST,
#            detail=str(e)
#        )
#
#@router.get("/me")
#async def get_me(credentials=Depends(__import__('app.middleware.auth',
#                 fromlist=['get_current_user']).get_current_user)):
#    return {
#        "user_id": str(credentials.id),
#        "email": credentials.email,
#        "full_name": (credentials.user_metadata or {}).get("full_name"),
#    }
#
#@router.get("/login/google")
#async def google_login():
#    try:
#        supabase = get_supabase()  # Get client inside function
#        redirect_to = os.getenv("OAUTH_REDIRECT_URL", "http://localhost:8000/api/auth/callback")
#        res = supabase.auth.sign_in_with_oauth({
#            "provider": "google",
#            "options": {"redirect_to": redirect_to}
#        })
#        return {"url": res.url}
#    except Exception as e:
#        raise HTTPException(status_code=400, detail=str(e))
#
#@router.get("/callback")
#async def oauth_callback(code: str):
#    try:
#        supabase = get_supabase()  # Get client inside function
#        res = supabase.auth.exchange_code_for_session({"auth_code": code})
#        if res.user is None:
#            raise HTTPException(status_code=401, detail="OAuth login failed.")
#        return {
#            "access_token": res.session.access_token,
#            "refresh_token": res.session.refresh_token,
#            "token_type": "bearer",
#            "user_id": str(res.user.id),
#            "email": res.user.email,
#        }
#    except HTTPException:
#        raise
#    except Exception as e:
#        raise HTTPException(status_code=400, detail=str(e))