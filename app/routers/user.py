from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from app.middleware.auth import get_current_user
from app.models.schemas import MonitoredAccountRequest, MonitoredAccountResponse
from app.services import supabase_service, XposedorNot

router = APIRouter()


def _to_monitored_response(row: dict) -> MonitoredAccountResponse:
    return MonitoredAccountResponse(
        email=row.get("email", ""),
        score=row.get("risk_score", 0),
        breaches=row.get("breach_count", 0),
        risk_label=row.get("risk_label", "Low"),
        exposed_data=row.get("exposed_data") or [],
        recent_breaches=row.get("recent_breaches") or [],
        added_at=row.get("created_at") or "",
        last_checked_at=row.get("last_checked_at") or row.get("updated_at") or "",
    )


@router.get("/dashboard")
async def dashboard(user=Depends(get_current_user)):
    return supabase_service.get_dashboard_summary(str(user.id))


@router.get("/breach-history")
async def breach_history(user=Depends(get_current_user)):
    return supabase_service.get_breach_history(str(user.id))


@router.get("/email-history")
async def email_history(user=Depends(get_current_user)):
    return supabase_service.get_analysis_history(str(user.id))

@router.get("/media-history")
async def media_history(user=Depends(get_current_user)):
    return supabase_service.get_media_history(str(user.id))

@router.get("/monitored-accounts", response_model=list[MonitoredAccountResponse])
async def monitored_accounts(user=Depends(get_current_user)):
    rows = supabase_service.get_monitored_accounts(str(user.id))
    return [_to_monitored_response(row) for row in rows]


@router.post("/monitored-accounts", response_model=MonitoredAccountResponse)
async def add_monitored_account(request: MonitoredAccountRequest, user=Depends(get_current_user)):
    email = request.email.strip().lower()

    try:
        breaches = await XposedorNot.check_email_breaches(email)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Breach provider error: {str(e)}")

    all_data_classes = [cls for b in breaches for cls in b.data_classes]
    risk_score, risk_label = XposedorNot.calculate_breach_risk_score(
        len(breaches), all_data_classes
    )

    recent_breaches = [
        {
            "source": b.name,
            "date": b.breach_date,
            "records": "Unknown",
        }
        for b in breaches[:3]
    ]

    exposed_data = list(dict.fromkeys(all_data_classes))
    if not breaches:
        risk_score = 0
        risk_label = "Low"

    saved = supabase_service.upsert_monitored_account(
        user_id=str(user.id),
        email=email,
        breach_count=len(breaches),
        risk_score=risk_score,
        risk_label=risk_label,
        exposed_data=exposed_data,
        recent_breaches=recent_breaches,
    )

    if not saved:
        saved = {
            "email": email,
            "breach_count": len(breaches),
            "risk_score": risk_score,
            "risk_label": risk_label,
            "exposed_data": exposed_data,
            "recent_breaches": recent_breaches,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_checked_at": datetime.now(timezone.utc).isoformat(),
        }

    return _to_monitored_response(saved)


@router.delete("/monitored-accounts/{email}")
async def remove_monitored_account(email: str, user=Depends(get_current_user)):
    supabase_service.delete_monitored_account(str(user.id), email.strip().lower())
    return {"ok": True}
