from fastapi import APIRouter
from app.db import Database
from app.utils.responses import success_response

router = APIRouter(prefix="/api", tags=["health"])

@router.get("/health")
async def health_check():
    """Health check endpoint with database ping and disclaimer enforcement metadata."""
    db_status = "connected"
    try:
        if Database.client is not None:
            Database.client.admin.command("ping")
        else:
            db_status = "uninitialized"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return success_response(
        data={
            "status": "healthy",
            "database": db_status,
            "version": "1.0.0",
            "service": "Amicus Legal Text Analyzer API",
            "compliance": {
                "legal_disclaimer": "Amicus is an AI-powered document analysis tool designed for informational and educational purposes only and does not provide legal advice."
            }
        },
        message="System operational."
    )

