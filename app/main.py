from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

# Custom CORS configuration with dynamic origin
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https://intellibus-hack2026.*\.vercel\.app|http://localhost:(8080|5173|3000)",
    allow_credentials=True,  # Now you can keep this True
    allow_methods=["*"],
    allow_headers=["*"],
)