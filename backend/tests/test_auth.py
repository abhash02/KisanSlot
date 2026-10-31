import pytest
from app.models.user import User
from app.core.security import get_password_hash, create_access_token


def test_farmer_registration_success(client, db_session):
    """Test successful farmer registration with valid payload."""
    payload = {
        "full_name": "Ramesh Kumar",
        "mobile_number": "9876543210",
        "password": "FarmerPassword123",
        "village": "Rampur",
        "preferred_language": "hi",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201, response.text
    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["full_name"] == "Ramesh Kumar"
    assert data["user"]["mobile_number"] == "9876543210"
    assert data["user"]["role"] == "FARMER"
    assert data["user"]["village"] == "Rampur"
    assert data["user"]["preferred_language"] == "hi"

    # Verify database persistence & password hashing
    user_in_db = db_session.query(User).filter(User.mobile_number == "9876543210").first()
    assert user_in_db is not None
    assert user_in_db.password_hash.startswith("$argon2")
    assert user_in_db.password_hash != "FarmerPassword123"


def test_farmer_registration_duplicate_mobile_rejected(client):
    """Test that registering an existing mobile number returns 400 Bad Request."""
    payload = {
        "full_name": "Suresh Patel",
        "mobile_number": "9811122233",
        "password": "Password123",
    }
    # First registration
    resp1 = client.post("/api/v1/auth/register", json=payload)
    assert resp1.status_code == 201

    # Second registration with duplicate mobile
    resp2 = client.post("/api/v1/auth/register", json=payload)
    assert resp2.status_code == 400
    assert "already registered" in resp2.json()["detail"].lower()


def test_farmer_registration_invalid_mobile_rejected(client):
    """Test that malformed mobile numbers are rejected by validation."""
    # Too short
    res_short = client.post("/api/v1/auth/register", json={
        "full_name": "Test User",
        "mobile_number": "98765",
        "password": "Password123",
    })
    assert res_short.status_code == 422

    # Invalid starting digit (e.g. starting with 2)
    res_start = client.post("/api/v1/auth/register", json={
        "full_name": "Test User",
        "mobile_number": "2876543210",
        "password": "Password123",
    })
    assert res_start.status_code == 422


def test_mobile_normalization(client):
    """Test that numbers with +91 and spaces normalize to 10 digits."""
    payload = {
        "full_name": "Kavita Devi",
        "mobile_number": "+91 99887 76655",
        "password": "Password123",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    assert response.json()["user"]["mobile_number"] == "9988776655"

    # Login using raw 10 digits
    login_resp = client.post("/api/v1/auth/login", json={
        "mobile_number": "9988776655",
        "password": "Password123",
    })
    assert login_resp.status_code == 200


def test_login_success(client):
    """Test login with valid credentials returns token and user profile."""
    # Register user
    client.post("/api/v1/auth/register", json={
        "full_name": "Anil Verma",
        "mobile_number": "9812345678",
        "password": "CorrectPassword123",
    })

    # Login
    response = client.post("/api/v1/auth/login", json={
        "mobile_number": "9812345678",
        "password": "CorrectPassword123",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["full_name"] == "Anil Verma"


def test_login_invalid_password_rejected(client):
    """Test login with incorrect password returns 401 Unauthorized."""
    client.post("/api/v1/auth/register", json={
        "full_name": "Sunita Rao",
        "mobile_number": "9765432109",
        "password": "ValidPassword123",
    })

    response = client.post("/api/v1/auth/login", json={
        "mobile_number": "9765432109",
        "password": "WrongPassword999",
    })
    assert response.status_code == 401
    assert "Invalid mobile number or password" in response.json()["detail"]


def test_login_unregistered_mobile_rejected(client):
    """Test login with non-existent mobile number returns 401."""
    response = client.post("/api/v1/auth/login", json={
        "mobile_number": "9999999999",
        "password": "SomePassword123",
    })
    assert response.status_code == 401


def test_inactive_user_cannot_login_or_access(client, db_session):
    """Test that deactivated users cannot authenticate or access endpoints."""
    # Register user
    reg_resp = client.post("/api/v1/auth/register", json={
        "full_name": "Inactive Farmer",
        "mobile_number": "9555544444",
        "password": "Password123",
    })
    token = reg_resp.json()["access_token"]

    # Deactivate in database
    user = db_session.query(User).filter(User.mobile_number == "9555544444").first()
    user.is_active = False
    db_session.commit()

    # Login attempt fails with 403
    login_resp = client.post("/api/v1/auth/login", json={
        "mobile_number": "9555544444",
        "password": "Password123",
    })
    assert login_resp.status_code == 403
    assert "deactivated" in login_resp.json()["detail"].lower()

    # Attempt to access /me using existing token fails with 403
    me_resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_resp.status_code == 403


def test_auth_me_endpoint(client):
    """Test GET /api/v1/auth/me returns the profile for authenticated user."""
    reg = client.post("/api/v1/auth/register", json={
        "full_name": "Mohan Lal",
        "mobile_number": "9123456789",
        "password": "Password123",
        "village": "Sonpur",
    })
    token = reg.json()["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Mohan Lal"
    assert data["mobile_number"] == "9123456789"
    assert data["village"] == "Sonpur"


def test_unauthenticated_request_rejected(client):
    """Test accessing protected endpoints without token returns 401."""
    resp_me = client.get("/api/v1/auth/me")
    assert resp_me.status_code == 401

    resp_admin = client.get("/api/v1/admin/verify")
    assert resp_admin.status_code == 401


def test_farmer_cannot_access_admin_endpoint(client):
    """Test that a user with FARMER role cannot access ADMIN protected endpoints (403 Forbidden)."""
    reg = client.post("/api/v1/auth/register", json={
        "full_name": "Farmer Attempting Admin",
        "mobile_number": "9887766554",
        "password": "Password123",
    })
    farmer_token = reg.json()["access_token"]

    response = client.get(
        "/api/v1/admin/verify",
        headers={"Authorization": f"Bearer {farmer_token}"},
    )
    assert response.status_code == 403
    assert "restricted to administrators" in response.json()["detail"].lower()


def test_admin_can_access_admin_endpoint(client, db_session):
    """Test that a user with ADMIN role can access ADMIN protected endpoints."""
    # Create an admin user in DB
    admin = User(
        full_name="Center Officer",
        mobile_number="9000011111",
        password_hash=get_password_hash("AdminPass123"),
        role="ADMIN",
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)

    # Login as admin
    login_resp = client.post("/api/v1/auth/login", json={
        "mobile_number": "9000011111",
        "password": "AdminPass123",
    })
    assert login_resp.status_code == 200
    admin_token = login_resp.json()["access_token"]
    assert login_resp.json()["user"]["role"] == "ADMIN"

    # Access admin endpoint
    response = client.get(
        "/api/v1/admin/verify",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["verified"] is True
    assert response.json()["role"] == "ADMIN"


def test_logout_endpoint(client):
    """Test POST /api/v1/auth/logout acknowledges session termination."""
    reg = client.post("/api/v1/auth/register", json={
        "full_name": "Logout Tester",
        "mobile_number": "9333322221",
        "password": "Password123",
    })
    token = reg.json()["access_token"]

    response = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert "Signed out" in response.json()["message"]

