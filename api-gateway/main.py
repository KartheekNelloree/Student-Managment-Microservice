import os

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

load_dotenv()
app = FastAPI(title="Student Management API Gateway", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SERVICES = {
    "auth": os.getenv("AUTH_SERVICE_URL", "http://127.0.0.1:8001"),
    "students": os.getenv("STUDENT_SERVICE_URL", "http://127.0.0.1:8002"),
    "courses": os.getenv("COURSE_SERVICE_URL", "http://127.0.0.1:8003"),
}
METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]
HOP_BY_HOP = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "host",
}


@app.get("/health")
def health():
    return {"status": "ok", "service": "api-gateway"}


@app.api_route("/{service}", methods=METHODS)
@app.api_route("/{service}/{path:path}", methods=METHODS)
async def proxy(service: str, request: Request, path: str = ""):
    service_url = SERVICES.get(service)
    if service_url is None:
        raise HTTPException(status_code=404, detail="Route not found")

    target_url = f"{service_url.rstrip('/')}/{service}"
    if path:
        target_url = f"{target_url}/{path}"
    if request.url.query:
        target_url = f"{target_url}?{request.url.query}"
    request_headers = _filtered_headers(request.headers)
    connection_tokens = {
        token.strip().lower()
        for token in request.headers.get("connection", "").split(",")
    }
    request_headers = {
        key: value
        for key, value in request_headers.items()
        if key.lower() not in connection_tokens
    }
    try:
        upstream = await send_upstream(
            method=request.method,
            url=target_url,
            headers=request_headers,
            body=await request.body(),
        )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Upstream service timed out") from None
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Upstream service is unavailable") from None

    response_headers = _filtered_headers(upstream.headers)
    response_connection_tokens = {
        token.strip().lower()
        for token in upstream.headers.get("connection", "").split(",")
    }
    response_headers = {
        key: value
        for key, value in response_headers.items()
        if key.lower() not in response_connection_tokens
    }
    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=response_headers,
    )


async def send_upstream(
    method: str, url: str, headers: dict[str, str], body: bytes
) -> httpx.Response:
    async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
        return await client.request(method, url, headers=headers, content=body)


def _filtered_headers(headers) -> dict[str, str]:
    return {
        key: value
        for key, value in headers.items()
        if key.lower() not in HOP_BY_HOP
    }
