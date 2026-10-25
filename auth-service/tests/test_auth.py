def test_register_login_and_current_user(client):
    response = client.post(
        "/auth/register",
        json={"name": "Jordan Lee", "email": "jordan@example.com", "password": "correct-horse"},
    )
    assert response.status_code == 201
    assert response.json()["email"] == "jordan@example.com"
    assert "password" not in response.json()
    assert "password_hash" not in response.json()

    duplicate = client.post(
        "/auth/register",
        json={"name": "Jordan Lee", "email": "jordan@example.com", "password": "correct-horse"},
    )
    assert duplicate.status_code == 409

    login = client.post(
        "/auth/login",
        json={"email": "jordan@example.com", "password": "correct-horse"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    current = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert current.status_code == 200
    assert current.json()["name"] == "Jordan Lee"


def test_login_and_me_reject_invalid_credentials(client):
    assert client.get("/auth/me").status_code == 401
    response = client.post(
        "/auth/login",
        json={"email": "nobody@example.com", "password": "incorrect-password"},
    )
    assert response.status_code == 401


def test_register_validates_password(client):
    response = client.post(
        "/auth/register",
        json={"name": "Jordan Lee", "email": "jordan@example.com", "password": "short"},
    )
    assert response.status_code == 422
