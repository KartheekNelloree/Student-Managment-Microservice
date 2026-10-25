import httpx
import pytest
from fastapi.testclient import TestClient

from main import app
import main


def test_health_and_invalid_route():
    with TestClient(app) as client:
        assert client.get("/health").json()["status"] == "ok"
        assert client.get("/unknown/list").status_code == 404


def test_proxy_forwards_body_query_and_auth(monkeypatch):
    received = {}

    async def fake_send_upstream(**kwargs):
        received.update(kwargs)
        return httpx.Response(
            201,
            json={"forwarded": True},
            headers={"x-upstream": "student-service", "connection": "x-internal"},
        )

    monkeypatch.setattr(main, "send_upstream", fake_send_upstream)
    with TestClient(app) as client:
        response = client.post(
            "/students?search=Taylor",
            json={"name": "Taylor"},
            headers={"Authorization": "Bearer test-token", "Connection": "x-private"},
        )

    assert response.status_code == 201
    assert response.json() == {"forwarded": True}
    assert response.headers["x-upstream"] == "student-service"
    assert "connection" not in response.headers
    assert received["method"] == "POST"
    assert received["url"].endswith("/students?search=Taylor")
    assert received["headers"]["authorization"] == "Bearer test-token"
    assert "x-private" not in received["headers"]
    assert b"Taylor" in received["body"]


@pytest.mark.parametrize(
    ("error", "expected_status", "safe_detail"),
    [
        (httpx.ReadTimeout("timed out"), 504, "Upstream service timed out"),
        (httpx.ConnectError("internal details"), 502, "Upstream service is unavailable"),
    ],
)
def test_proxy_returns_safe_upstream_errors(monkeypatch, error, expected_status, safe_detail):
    async def fake_send_upstream(**_kwargs):
        raise error

    monkeypatch.setattr(main, "send_upstream", fake_send_upstream)
    with TestClient(app) as client:
        response = client.get("/auth/auth/me")

    assert response.status_code == expected_status
    assert response.json() == {"detail": safe_detail}
