import re
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from bson import ObjectId
from app.config import Config
from app.db import Database, serialize_doc

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

class AuthService:

    @staticmethod
    def generate_token(user_id: str, email: str) -> str:
        """Generate a signed JWT token."""
        secret_key = Config.get_jwt_secret_key()
        expiration_hours = Config.get_jwt_expiration_hours()
        
        now = datetime.now(timezone.utc)
        payload = {
            "sub": str(user_id),
            "email": email,
            "iat": now,
            "exp": now + timedelta(hours=expiration_hours)
        }
        return jwt.encode(payload, secret_key, algorithm="HS256")

    @staticmethod
    def decode_token(token: str) -> dict:
        """Decode and validate a JWT token."""
        secret_key = Config.get_jwt_secret_key()
        return jwt.decode(token, secret_key, algorithms=["HS256"])


    @classmethod
    def register_user(cls, email: str, password: str, full_name: str):
        """Register a new user, hash password with bcrypt, and return token."""
        if not email or not isinstance(email, str):
            raise ValueError("A valid email address is required.")
        email_clean = email.strip().lower()
        if not EMAIL_REGEX.match(email_clean):
            raise ValueError("Invalid email address format.")
        
        if not password or not isinstance(password, str) or len(password) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        
        if not full_name or not isinstance(full_name, str) or not full_name.strip():
            raise ValueError("Full name is required.")
        full_name_clean = full_name.strip()

        users_col = Database.get_users_collection()
        
        # Check if user already exists
        existing_user = users_col.find_one({"email": email_clean})
        if existing_user:
            raise KeyError("An account with this email address already exists.")

        # Hash password with bcrypt
        salt = bcrypt.gensalt(rounds=12)
        password_hash = bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

        now = datetime.now(timezone.utc)
        user_doc = {
            "email": email_clean,
            "password_hash": password_hash,
            "full_name": full_name_clean,
            "created_at": now,
            "updated_at": now
        }

        result = users_col.insert_one(user_doc)
        user_id = str(result.inserted_id)
        user_doc["_id"] = result.inserted_id

        # Generate JWT
        token = cls.generate_token(user_id, email_clean)

        user_clean = {
            "id": user_id,
            "email": email_clean,
            "full_name": full_name_clean,
            "created_at": now.isoformat()
        }

        return user_clean, token

    @classmethod
    def login_user(cls, email: str, password: str):
        """Authenticate user and return JWT token."""
        if not email or not password:
            raise ValueError("Email and password are required.")
        
        email_clean = email.strip().lower()
        users_col = Database.get_users_collection()
        
        user = users_col.find_one({"email": email_clean})
        if not user:
            raise PermissionError("Invalid email or password.")
        
        # Verify bcrypt hash
        stored_hash = user.get("password_hash", "")
        if not bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8")):
            raise PermissionError("Invalid email or password.")
        
        user_id = str(user["_id"])
        token = cls.generate_token(user_id, email_clean)

        user_clean = {
            "id": user_id,
            "email": user["email"],
            "full_name": user.get("full_name", ""),
            "created_at": user.get("created_at", datetime.now(timezone.utc)).isoformat()
        }

        return user_clean, token

    @classmethod
    def get_user_by_id(cls, user_id: str):
        """Fetch user by id."""
        try:
            obj_id = ObjectId(user_id)
        except Exception:
            return None
        
        users_col = Database.get_users_collection()
        user = users_col.find_one({"_id": obj_id})
        if not user:
            return None
        
        return {
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user.get("full_name", ""),
            "created_at": user.get("created_at", datetime.now(timezone.utc)).isoformat()
        }
