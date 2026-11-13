import pytest
import mongomock
import sys
import os
from starlette.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.config import TestConfig
from app.db import Database

class CompatibleTestClient(TestClient):
    """Wrapper over Starlette/FastAPI TestClient to maintain Flask test client API compatibility."""

    def _prepare_kwargs(self, kwargs):
        headers = dict(kwargs.get("headers") or {})
        kwargs.pop("content_type", None)
        data = kwargs.pop("data", None)
        files = kwargs.pop("files", None)

        if data and isinstance(data, dict):
            files_dict = {}
            data_dict = {}
            for k, v in data.items():
                if isinstance(v, tuple) and len(v) >= 2:
                    content, filename = v[0], v[1]
                    if hasattr(content, "read"):
                        content_bytes = content.read()
                    else:
                        content_bytes = content
                    files_dict[k] = (filename, content_bytes)
                else:
                    data_dict[k] = v
            
            if files_dict:
                files = files_dict
                if data_dict:
                    kwargs["data"] = data_dict
                headers = {k: v for k, v in headers.items() if k.lower() != "content-type"}
            else:
                kwargs["data"] = data

        if files:
            kwargs["files"] = files
            headers = {k: v for k, v in headers.items() if k.lower() != "content-type"}

        kwargs["headers"] = headers
        return kwargs

    def request(self, method, url, **kwargs):
        kwargs = self._prepare_kwargs(kwargs)
        response = super().request(method, url, **kwargs)
        response.get_json = lambda: response.json()
        response.data = response.content
        response.content_type = response.headers.get("content-type", "")
        return response

    def post(self, url, **kwargs):
        kwargs = self._prepare_kwargs(kwargs)
        return self.request("POST", url, **kwargs)

    def get(self, url, **kwargs):
        kwargs = self._prepare_kwargs(kwargs)
        return self.request("GET", url, **kwargs)

    def delete(self, url, **kwargs):
        kwargs = self._prepare_kwargs(kwargs)
        return self.request("DELETE", url, **kwargs)

    def put(self, url, **kwargs):
        kwargs = self._prepare_kwargs(kwargs)
        return self.request("PUT", url, **kwargs)

    def patch(self, url, **kwargs):
        kwargs = self._prepare_kwargs(kwargs)
        return self.request("PATCH", url, **kwargs)



@pytest.fixture(scope="function")
def app():
    mock_client = mongomock.MongoClient()
    app_inst = create_app(config_class=TestConfig, mongo_client=mock_client)
    yield app_inst
    mock_client.drop_database(TestConfig.DB_NAME)

@pytest.fixture
def client(app):
    return CompatibleTestClient(app)

@pytest.fixture
def auth_headers(client):
    """Fixture providing headers for a registered and authenticated user."""
    res = client.post("/api/auth/register", json={
        "email": "testuser@example.com",
        "password": "Password123!",
        "full_name": "Test User"
    })
    token = res.get_json()["data"]["token"]
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

