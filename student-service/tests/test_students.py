import jwt
import os


def test_student_crud_and_search(client):
    payload = {
        "name": "Taylor Morgan",
        "email": "taylor@example.com",
        "phone": "555-0101",
        "department": "Science",
        "course_id": 4,
    }
    created = client.post("/students", json=payload)
    assert created.status_code == 201
    student_id = created.json()["id"]

    assert client.get("/students?search=taylor").json()[0]["course_id"] == 4
    assert client.get("/students?department=Science").status_code == 200
    assert client.get(f"/students/{student_id}").status_code == 200

    updated = client.put(
        f"/students/{student_id}",
        json={**payload, "name": "Taylor Reed", "course_id": None},
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Taylor Reed"
    assert client.delete(f"/students/{student_id}").status_code == 204
    assert client.get(f"/students/{student_id}").status_code == 404


def test_student_requires_token(client):
    client.headers.pop("Authorization")
    assert client.get("/students").status_code == 401


def test_student_validates_input(client):
    response = client.post(
        "/students",
        json={"name": "", "email": "not-an-email", "department": "Science"},
    )
    assert response.status_code == 422


def test_students_are_private_to_their_creator(client):
    created = client.post(
        "/students",
        json={
            "name": "Private Student",
            "email": "private@example.com",
            "department": "Science",
        },
    )
    client.headers["Authorization"] = (
        "Bearer "
        + jwt.encode({"sub": "2"}, os.environ["JWT_SECRET_KEY"], algorithm="HS256")
    )
    assert client.get("/students").json() == []
    assert client.get(f"/students/{created.json()['id']}").status_code == 404
