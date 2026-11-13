import os
import uvicorn
from app import app

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    reload = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1", "yes")
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=reload)

