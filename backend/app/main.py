import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine

from app.api.routes.auth import router as auth_router
from app.api.routes.admin import router as admin_router
from app.api.routes.services import router as services_router
from app.api.routes.incidents import router as incidents_router
from app.api.routes.alerts import router as alerts_router
from app.api.routes.websocket import router as websocket_router
from app.api.routes.invitations import router as invitations_router
from app.api.routes.dashboard import router as dashboard_router

logger = logging.getLogger(__name__)


app = FastAPI(
    title="IncidentOps API",
    description="Enterprise Incident Management and Response platform",
    version="1.0.0",
)


# Register application routers
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(services_router)
app.include_router(incidents_router)
app.include_router(alerts_router)
app.include_router(websocket_router)
app.include_router(invitations_router)
app.include_router(dashboard_router)


# Environment-based CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Webhook-Token"],
)


@app.get("/")
def root():
    return {"message": "Welcome to the IncidentOps API!", "status": "running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/health/database")
def database_health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {"status": "connected", "database": "Supabase PostgreSQL"}

    except Exception:
        logger.error("Database health check failed")

        raise HTTPException(status_code=503, detail="Database temporarily unavailable")
