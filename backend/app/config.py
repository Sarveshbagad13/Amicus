import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "amicus-dev-secret-key-change-in-prod-2026")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "amicus-jwt-secret-key-change-in-prod-2026")
    JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DB_NAME = os.getenv("DB_NAME", "amicus_legal_analyzer")
    MAX_CONTENT_LENGTH = 20 * 1024 * 1024  # 20 MB max payload (PRD Section 2 US-1)
    ALLOWED_EXTENSIONS = {"pdf", "docx"}
    
    # Model configuration
    SUMMARIZATION_MODEL_NAME = os.getenv("SUMMARIZATION_MODEL_NAME", "facebook/bart-base")
    CLAUSE_MODEL_NAME = os.getenv("CLAUSE_MODEL_NAME", "roberta-base")
    SPACY_MODEL_NAME = os.getenv("SPACY_MODEL_NAME", "en_core_web_sm")
    
    # Render environment guardrail for timeouts
    INFERENCE_TIMEOUT_SECONDS = int(os.getenv("INFERENCE_TIMEOUT_SECONDS", "45"))

    # CORS configuration
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:3000,http://localhost:5173,https://*.vercel.app"
        ).split(",")
        if origin.strip()
    ]

    _active_config = None

    @classmethod
    def set_active(cls, config_cls):
        cls._active_config = config_cls

    @classmethod
    def get_jwt_secret_key(cls):
        if cls._active_config and hasattr(cls._active_config, "JWT_SECRET_KEY"):
            return cls._active_config.JWT_SECRET_KEY
        return cls.JWT_SECRET_KEY

    @classmethod
    def get_jwt_expiration_hours(cls):
        if cls._active_config and hasattr(cls._active_config, "JWT_EXPIRATION_HOURS"):
            return cls._active_config.JWT_EXPIRATION_HOURS
        return cls.JWT_EXPIRATION_HOURS

class TestConfig(Config):
    TESTING = True
    DB_NAME = "amicus_test_db"
    JWT_SECRET_KEY = "test-jwt-secret-key-32-bytes-long-for-hmac-sha256-compliance"

