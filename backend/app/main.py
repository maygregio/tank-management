from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routers import tanks, movements, properties, users, audit_log, pdf

# Load environment variables from .env file
load_dotenv()

app = FastAPI(
    title="Tank Management API",
    description="FastAPI backend for Carbon Black Oil tank management",
    version="1.0.0",
)

# CORS configuration for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tanks.router)
app.include_router(movements.router)
app.include_router(properties.router)
app.include_router(users.router)
app.include_router(audit_log.router)
app.include_router(pdf.router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
