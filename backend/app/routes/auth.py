from fastapi import APIRouter, Request, Depends
from app.services.auth_service import AuthService
from app.middleware import get_current_user
from app.utils.responses import success_response, error_response

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register")
async def register(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = None

    if not data or not isinstance(data, dict):
        return error_response(
            message="Invalid JSON payload in request body.",
            error_code="INVALID_PAYLOAD",
            status_code=400
        )
    
    email = data.get("email")
    password = data.get("password")
    full_name = data.get("full_name")

    try:
        user, token = AuthService.register_user(email, password, full_name)
        return success_response(
            data={"user": user, "token": token},
            message="User registered successfully.",
            status_code=201
        )
    except KeyError as e:
        return error_response(
            message=str(e).strip("'"),
            error_code="USER_ALREADY_EXISTS",
            status_code=409
        )
    except ValueError as e:
        return error_response(
            message=str(e),
            error_code="VALIDATION_ERROR",
            status_code=400
        )
    except Exception as e:
        return error_response(
            message="An unexpected error occurred during registration.",
            error_code="REGISTRATION_FAILED",
            status_code=500,
            details=str(e)
        )

@router.post("/login")
async def login(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = None

    if not data or not isinstance(data, dict):
        return error_response(
            message="Invalid JSON payload in request body.",
            error_code="INVALID_PAYLOAD",
            status_code=400
        )
    
    email = data.get("email")
    password = data.get("password")

    try:
        user, token = AuthService.login_user(email, password)
        return success_response(
            data={"user": user, "token": token},
            message="Login successful.",
            status_code=200
        )
    except ValueError as e:
        return error_response(
            message=str(e),
            error_code="VALIDATION_ERROR",
            status_code=400
        )
    except PermissionError as e:
        return error_response(
            message=str(e),
            error_code="INVALID_CREDENTIALS",
            status_code=401
        )
    except Exception as e:
        return error_response(
            message="An unexpected error occurred during login.",
            error_code="LOGIN_FAILED",
            status_code=500,
            details=str(e)
        )

@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    return success_response(
        data={"user": current_user},
        message="Current user profile retrieved successfully."
    )

