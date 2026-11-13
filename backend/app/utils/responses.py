from fastapi.responses import JSONResponse
from app.db import serialize_doc

def success_response(data=None, message="Success", status_code=200, meta=None):
    """Standardized API success response payload."""
    payload = {
        "success": True,
        "message": message,
        "data": serialize_doc(data)
    }
    if meta is not None:
        payload["meta"] = meta
    return JSONResponse(status_code=status_code, content=payload)

def error_response(message="An error occurred", error_code="BAD_REQUEST", status_code=400, details=None):
    """Standardized API error response payload."""
    payload = {
        "success": False,
        "error": {
            "code": error_code,
            "message": message
        }
    }
    if details is not None:
        payload["error"]["details"] = details
    return JSONResponse(status_code=status_code, content=payload)

