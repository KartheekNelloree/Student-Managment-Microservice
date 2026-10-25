import jwt
import os


def test_course_crud_and_enrollment(client):
    payload = {
        "name": "Applied Physics",
        "code": "phy-201",
        "description": "Foundations of physics",
        "department": "Science",
    }
    created = client.post("/courses", json=payload)
    assert created.status_code == 201
    course_id = created.json()["id"]
    assert created.json()["code"] == "PHY-201"

    assert client.get("/courses").json()[0]["id"] == course_id
    assert client.get(f"/courses/{course_id}").status_code == 200
    enrollment = client.post(f"/courses/{course_id}/students/12")
    assert enrollment.status_code == 201
    assert client.get(f"/courses/{course_id}/students").json()[0]["student_id"] == 12
    assert client.post(f"/courses/{course_id}/students/12").status_code == 409
    assert client.delete(f"/courses/{course_id}/students/12").status_code == 204
    assert client.get(f"/courses/{course_id}/students").json() == []
    assert client.delete(f"/courses/{course_id}/students/12").status_code == 404

    updated = client.put(
        f"/courses/{course_id}",
        json={**payload, "name": "Physics II", "code": "PHY-202"},
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Physics II"
    assert client.delete(f"/courses/{course_id}").status_code == 204
    assert client.get(f"/courses/{course_id}").status_code == 404


def test_course_requires_token(client):
    client.headers.pop("Authorization")
    assert client.get("/courses").status_code == 401


def test_courses_are_private_to_their_creator(client):
    created = client.post(
        "/courses",
        json={
            "name": "Private Course",
            "code": "PRV-101",
            "department": "Arts",
        },
    )
    client.headers["Authorization"] = (
        "Bearer "
        + jwt.encode({"sub": "2"}, os.environ["JWT_SECRET_KEY"], algorithm="HS256")
    )
    assert client.get("/courses").json() == []
    assert client.get(f"/courses/{created.json()['id']}").status_code == 404
