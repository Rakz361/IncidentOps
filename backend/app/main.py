from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.auth import router as auth_router
from app.api.routes.rbac_test import router as rbac_test_router
from app.api.routes.admin import router as admin_router
from app.api.routes.services import router as services_router
from app.api.routes.incidents import router as incidents_router
from app.api.routes.alerts import router as alerts_router
from app.api.routes.websocket import router as websocket_router
from app.api.routes.invitations import router as invitations_router
from app.api.routes.dashboard import router as dashboard_router

from fastapi import FastAPI
from sqlalchemy import text

from app.core.database import engine 

app= FastAPI(
    title ="IncidentOps API",
    description="Enterprise Incident Management and Response platform",
    version="1.0.0"
)

app.include_router(auth_router)
app.include_router(rbac_test_router)
app.include_router(admin_router)
app.include_router(services_router)
app.include_router(incidents_router)
app.include_router(alerts_router)
app.include_router(websocket_router)
app.include_router(invitations_router)
app.include_router(dashboard_router)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],

    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "Welcome to the IncidentOps API!",
        "status": "running"
        }

@app.get("/health")
def health_check():
    return {
        "stauts" : "healthy"
    }

@app.get("/health/database")
def database_health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "connected",
            "database": "Supabase PostgreSQL"
        }

    except Exception as e:
        return {
            "status": "error",
            "detail": str(e)
        }