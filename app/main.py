from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import breach, scanner, analysis, auth, user, media
import re

app = FastAPI()

# Function to validate origins
def is_origin_allowed(origin: str) -> bool:
    """Check if origin is allowed"""
    allowed_patterns = [
        r"^https://intellibus-hack2026\.vercel\.app$",
        r"^https://intellibus-hack2026-.*\.vercel\.app$",
        r"^http://localhost:(8080|5173|3000)$",
    ]
    
    if not origin:
        return False
    
    return any(re.match(pattern, origin) for pattern in allowed_patterns)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https://intellibus-hack2026-.*\.vercel\.app|https://cybershield.*\.vercel\.app|http://localhost:(8080|5173|3000)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(breach.router, prefix="/api/breach", tags=["Breach Check"])
app.include_router(scanner.router, prefix="/api/scan", tags=["Link Scanner"])
app.include_router(analysis.router, prefix="/api/analyze", tags=["Email Analysis"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(user.router, prefix="/api/user", tags=["User"])
app.include_router(media.router, prefix="/api/media", tags=["Media Detection"])

@app.get("/")
async def root():
    return {"status": "API is running"}