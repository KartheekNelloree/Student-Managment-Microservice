import os
import sys
import importlib.util
from pathlib import Path

os.environ.setdefault("JWT_SECRET_KEY", "test-only-secret-that-is-long-enough-123456")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
app_path = Path(__file__).resolve().parents[1] / "app"
spec = importlib.util.spec_from_file_location(
    "course_app", app_path / "__init__.py", submodule_search_locations=[str(app_path)]
)
course_app = importlib.util.module_from_spec(spec)
sys.modules["course_app"] = course_app
spec.loader.exec_module(course_app)

import pytest
import jwt
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from course_app.database import Base, get_db
from course_app.main import app


@pytest.fixture()
def client(tmp_path):
    engine = create_engine(
        f"sqlite:///{tmp_path / 'test.db'}",
        connect_args={"check_same_thread": False},
    )
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    token = jwt.encode({"sub": "1"}, os.environ["JWT_SECRET_KEY"], algorithm="HS256")
    with TestClient(app) as test_client:
        test_client.headers.update({"Authorization": f"Bearer {token}"})
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
