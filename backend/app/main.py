from fastapi.middleware.cors import CORSMiddleware

from fastapi import FastAPI
from sqlalchemy import text

from app.core.database import engine 

app= FastAPI(
    title ="IncidentOps API",
    description="Enterprise Incident Management and Response platform",
    version="1.0.0"
)

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