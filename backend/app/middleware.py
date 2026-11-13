from fastapi import Request
from fastapi.responses import JSONResponse
import jwt
from app.services.auth_service import AuthService
from app.utils.responses import error_response

class AuthException(Exception):
    def __init__(self, response: JSONResponse):
        self.response = response

async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header:
        raise AuthException(error_response(
            message="Authorization header is missing.",
            error_code="AUTH_HEADER_MISSING",
            status_code=401
        ))
    
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise AuthException(error_response(
            message="Invalid Authorization header format. Expected 'Bearer <token>'.",
            error_code="INVALID_AUTH_HEADER",
            status_code=401
        ))
    
    token = parts[1]
    try:
        payload = AuthService.decode_token(token)
        user_id = payload.get("sub")
        user = AuthService.get_user_by_id(user_id)
        if not user:
            raise AuthException(error_response(
                message="User associated with token no longer exists.",
                error_code="USER_NOT_FOUND",
                status_code=401
            ))
        request.state.current_user = user
        return user
    except jwt.ExpiredSignatureError:
        raise AuthException(error_response(
            message="Authentication token has expired. Please log in again.",
            error_code="TOKEN_EXPIRED",
            status_code=401
        ))
    except (jwt.InvalidTokenError, Exception) as e:
        raise AuthException(error_response(
            message="Invalid or corrupted authentication token.",
            error_code="INVALID_TOKEN",
            status_code=401,
            details=str(e)
        ))

