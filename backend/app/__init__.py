import logging
from contextlib import contextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.config import Config
from app.db import Database
from app.middleware import AuthException
from app.utils.responses import error_response

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

def create_app(config_class=Config, mongo_client=None):
    Config.set_active(config_class)

    app = FastAPI(
        title="Amicus Legal Text Analyzer API",
        version="1.0.0"
    )

    # Store config dictionary & state for compatibility
    app.config = {
        "DB_NAME": getattr(config_class, "DB_NAME", Config.DB_NAME),
        "MONGODB_URI": getattr(config_class, "MONGODB_URI", Config.MONGODB_URI),
        "TESTING": getattr(config_class, "TESTING", False),
    }
    app.state.config = config_class

    # Lightweight app_context context manager for testing compatibility
    @contextmanager
    def app_context():
        yield

    app.app_context = app_context

    # Enable CORS
    cors_origins = getattr(
        config_class,
        "CORS_ORIGINS",
        ["http://localhost:3000", "http://localhost:5173", "https://*.vercel.app"]
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_origin_regex=r"https://.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )

    # Initialize Database
    Database.init_app(app, client=mongo_client)

    # Register Routers
    from app.routes.auth import router as auth_router
    from app.routes.documents import router as documents_router
    from app.routes.health import router as health_router

    app.include_router(auth_router)
    app.include_router(documents_router)
    app.include_router(health_router)

    # Global Exception Handlers
    @app.exception_handler(AuthException)
    async def auth_exception_handler(request: Request, exc: AuthException):
        return exc.response

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return error_response(
            message=str(exc),
            error_code="VALIDATION_ERROR",
            status_code=400
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        if exc.status_code == 400:
            return error_response(
                message=exc.detail if isinstance(exc.detail, str) else "Bad request",
                error_code="BAD_REQUEST",
                status_code=400
            )
        elif exc.status_code == 404:
            return error_response(
                message="The requested endpoint or resource was not found.",
                error_code="RESOURCE_NOT_FOUND",
                status_code=404
            )
        elif exc.status_code == 405:
            return error_response(
                message="The HTTP method is not allowed for this endpoint.",
                error_code="METHOD_NOT_ALLOWED",
                status_code=405
            )
        elif exc.status_code == 413:
            return error_response(
                message="Uploaded file exceeds the 20 MB size limit.",
                error_code="PAYLOAD_TOO_LARGE",
                status_code=413
            )
        return error_response(
            message=str(exc.detail),
            error_code="HTTP_ERROR",
            status_code=exc.status_code
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled server error: {exc}", exc_info=True)
        return error_response(
            message="An unexpected internal server error occurred.",
            error_code="INTERNAL_SERVER_ERROR",
            status_code=500,
            details=str(exc)
        )

    return app

app = create_app()

