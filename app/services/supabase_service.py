from supabase import create_client, Client
from datetime import datetime, timezone
from app.config import settings

def get_supabase() -> Client:
    """Create a fresh Supabase client for each request path.

    The Supabase auth client is stateful; reusing a singleton can leak session
    state across requests/users after sign-in operations.
    """
    if not settings.supabase_url or not settings.supabase_key:
        raise ValueError("Supabase credentials not configured")
    return create_client(settings.supabase_url, settings.supabase_key)

# ─── Breach History ───────────────────────────────────────────────────────────

def save_breach_result(user_id: str, email: str, breach_count: int,
                       risk_score: int, result: dict):
    supabase = get_supabase()  # Get client inside function
    supabase.table("breach_checks").insert({
        "user_id": user_id,
        "email": email,
        "breach_count": breach_count,
        "risk_score": risk_score,
        "result": result,
    }).execute()


def get_breach_history(user_id: str):
    supabase = get_supabase()
    res = supabase.table("breach_checks")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("created_at", desc=True)\
        .limit(20)\
        .execute()
    return res.data


# ─── URL Cache ────────────────────────────────────────────────────────────────

def get_cached_url(url: str):
    try:
        supabase = get_supabase()
        res = supabase.table("scanned_urls")\
            .select("*")\
            .eq("url", url)\
            .execute()
        if res.data:
            return res.data[0]
    except Exception:
        pass
    return None


def save_cached_url(url: str, risk_score: int, risk_label: str, result: dict):
    supabase = get_supabase()
    supabase.table("scanned_urls").upsert({
        "url": url,
        "risk_score": risk_score,
        "risk_label": risk_label,
        "result": result,
    }).execute()


# ─── Email Analysis History ───────────────────────────────────────────────────

def save_analysis_result(user_id: str, subject: str,
                         risk_score: int, result: dict):
    supabase = get_supabase()
    supabase.table("email_analyses").insert({
        "user_id": user_id,
        "subject": subject,
        "risk_score": risk_score,
        "result": result,
    }).execute()


def get_analysis_history(user_id: str):
    supabase = get_supabase()
    res = supabase.table("email_analyses")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("created_at", desc=True)\
        .limit(20)\
        .execute()
    return res.data


# ─── Dashboard Summary ────────────────────────────────────────────────────────

def get_dashboard_summary(user_id: str):
    supabase = get_supabase()
    breaches = supabase.table("breach_checks")\
        .select("risk_score, created_at")\
        .eq("user_id", user_id)\
        .execute().data

    analyses = supabase.table("email_analyses")\
        .select("risk_score, created_at")\
        .eq("user_id", user_id)\
        .execute().data

    return {
        "total_breach_checks": len(breaches),
        "total_email_analyses": len(analyses),
        "avg_breach_risk": round(
            sum(b["risk_score"] for b in breaches) / len(breaches), 1
        ) if breaches else 0,
        "avg_email_risk": round(
            sum(a["risk_score"] for a in analyses) / len(analyses), 1
        ) if analyses else 0,
        "high_risk_count": len([
            x for x in breaches + analyses if x["risk_score"] >= 70
        ]),
    }


# ─── media Summary ────────────────────────────────────────────────────────
def save_media_scan(user_id: str, media_type: str, filename: str,
                    risk_score: int, result: dict):
    supabase = get_supabase()
    supabase.table("media_scans").insert({
        "user_id": user_id,
        "media_type": media_type,
        "filename": filename,
        "risk_score": risk_score,
        "result": result,
    }).execute()


def get_media_history(user_id: str):
    supabase = get_supabase()
    res = supabase.table("media_scans")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("created_at", desc=True)\
        .limit(20)\
        .execute()
    return res.data


# ─── Monitored Accounts ──────────────────────────────────────────────────────

def upsert_monitored_account(
    user_id: str,
    email: str,
    breach_count: int,
    risk_score: int,
    risk_label: str,
    exposed_data: list,
    recent_breaches: list,
):
    supabase = get_supabase()
    now_iso = datetime.now(timezone.utc).isoformat()
    res = supabase.table("monitored_accounts").upsert(
        {
            "user_id": user_id,
            "email": email,
            "breach_count": breach_count,
            "risk_score": risk_score,
            "risk_label": risk_label,
            "exposed_data": exposed_data,
            "recent_breaches": recent_breaches,
            "last_checked_at": now_iso,
            "updated_at": now_iso,
        },
        on_conflict="user_id,email",
    ).execute()
    return res.data[0] if res.data else None


def get_monitored_accounts(user_id: str):
    supabase = get_supabase()
    res = supabase.table("monitored_accounts") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("last_checked_at", desc=True) \
        .execute()
    return res.data


def delete_monitored_account(user_id: str, email: str):
    supabase = get_supabase()
    res = supabase.table("monitored_accounts") \
        .delete() \
        .eq("user_id", user_id) \
        .eq("email", email) \
        .execute()
    return res.data