import pytest
from datetime import date, time, timedelta
from app.models.user import User
from app.core.security import get_password_hash


@pytest.fixture
def admin_headers(client, db_session):
    """Fixture providing auth headers for an administrator."""
    admin = User(
        full_name="Center Incharge",
        mobile_number="9111122222",
        password_hash=get_password_hash("AdminPass123"),
        role="ADMIN",
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()

    login_resp = client.post("/api/v1/auth/login", json={
        "mobile_number": "9111122222",
        "password": "AdminPass123",
    })
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def farmer_headers(client):
    """Fixture providing auth headers for a farmer."""
    reg = client.post("/api/v1/auth/register", json={
        "full_name": "Kisan Bhai",
        "mobile_number": "9222233333",
        "password": "FarmerPass123",
    })
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_admin_create_and_list_centres(client, admin_headers):
    """Test admin creating centres and listing them."""
    payload = {
        "name": "Karnal Grain Hub",
        "district": "Karnal",
        "address": "Near Mandi Gate, GT Road, Karnal",
        "notes": "Open Mon-Sat 8AM-5PM",
        "is_active": True,
    }
    resp = client.post("/api/v1/admin/centres", json=payload, headers=admin_headers)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["name"] == "Karnal Grain Hub"
    assert data["district"] == "Karnal"
    centre_id = data["id"]

    # List centres
    list_resp = client.get("/api/v1/admin/centres", headers=admin_headers)
    assert list_resp.status_code == 200
    assert any(c["id"] == centre_id for c in list_resp.json())


def test_centre_deactivation_prevents_slot_creation(client, admin_headers):
    """Test that deactivating a centre prevents new slot creation."""
    # 1. Create centre
    c_resp = client.post("/api/v1/admin/centres", json={
        "name": "Panipat Sub-Center",
        "district": "Panipat",
        "address": "Sectors 11-12 Mandi",
        "is_active": True,
    }, headers=admin_headers)
    centre_id = c_resp.json()["id"]

    # 2. Deactivate centre
    patch_resp = client.patch(
        f"/api/v1/admin/centres/{centre_id}",
        json={"is_active": False},
        headers=admin_headers,
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["is_active"] is False

    # 3. Attempt slot creation on deactivated centre
    tomorrow = date.today() + timedelta(days=1)
    slot_resp = client.post("/api/v1/admin/slots", json={
        "centre_id": centre_id,
        "slot_date": tomorrow.isoformat(),
        "start_time": "09:00:00",
        "end_time": "11:00:00",
        "capacity": 10,
        "status": "OPEN",
    }, headers=admin_headers)
    assert slot_resp.status_code == 400
    assert "inactive" in slot_resp.json()["detail"].lower()


def test_slot_creation_validations(client, admin_headers):
    """Test slot validation: past dates, end_time <= start_time, capacity <= 0."""
    c_resp = client.post("/api/v1/admin/centres", json={
        "name": "Ambala Mandi Hub",
        "district": "Ambala",
        "address": "NH 44 Ambala Cantt",
    }, headers=admin_headers)
    centre_id = c_resp.json()["id"]

    tomorrow = date.today() + timedelta(days=1)
    yesterday = date.today() - timedelta(days=1)

    # 1. Past date rejected
    resp_past = client.post("/api/v1/admin/slots", json={
        "centre_id": centre_id,
        "slot_date": yesterday.isoformat(),
        "start_time": "10:00:00",
        "end_time": "12:00:00",
        "capacity": 5,
    }, headers=admin_headers)
    assert resp_past.status_code == 422

    # 2. End time before start time rejected
    resp_time = client.post("/api/v1/admin/slots", json={
        "centre_id": centre_id,
        "slot_date": tomorrow.isoformat(),
        "start_time": "14:00:00",
        "end_time": "12:00:00",
        "capacity": 5,
    }, headers=admin_headers)
    assert resp_time.status_code == 422

    # 3. Non-positive capacity rejected
    resp_cap = client.post("/api/v1/admin/slots", json={
        "centre_id": centre_id,
        "slot_date": tomorrow.isoformat(),
        "start_time": "10:00:00",
        "end_time": "12:00:00",
        "capacity": 0,
    }, headers=admin_headers)
    assert resp_cap.status_code == 422


def test_overlapping_slots_prevented(client, admin_headers):
    """Test that two overlapping slots at the same centre on the same day are rejected."""
    c_resp = client.post("/api/v1/admin/centres", json={
        "name": "Rohtak Central Mandi",
        "district": "Rohtak",
        "address": "Old Grain Market, Rohtak",
    }, headers=admin_headers)
    centre_id = c_resp.json()["id"]

    target_date = (date.today() + timedelta(days=3)).isoformat()

    # Create initial slot: 10:00 - 12:00
    s1 = client.post("/api/v1/admin/slots", json={
        "centre_id": centre_id,
        "slot_date": target_date,
        "start_time": "10:00:00",
        "end_time": "12:00:00",
        "capacity": 8,
    }, headers=admin_headers)
    assert s1.status_code == 201

    # Attempt overlapping slot: 11:00 - 13:00 (overlaps with 10-12)
    s2 = client.post("/api/v1/admin/slots", json={
        "centre_id": centre_id,
        "slot_date": target_date,
        "start_time": "11:00:00",
        "end_time": "13:00:00",
        "capacity": 8,
    }, headers=admin_headers)
    assert s2.status_code == 400
    assert "overlapping" in s2.json()["detail"].lower()

    # Non-overlapping slot: 12:00 - 14:00 (touches boundary, should succeed)
    s3 = client.post("/api/v1/admin/slots", json={
        "centre_id": centre_id,
        "slot_date": target_date,
        "start_time": "12:00:00",
        "end_time": "14:00:00",
        "capacity": 8,
    }, headers=admin_headers)
    assert s3.status_code == 201


def test_public_centres_and_slot_listing(client, admin_headers, farmer_headers):
    """Test public listing of centres and slots with capacity."""
    # Create centre and slot
    c_resp = client.post("/api/v1/admin/centres", json={
        "name": "Kurukshetra Grain Market",
        "district": "Kurukshetra",
        "address": "Near Railway Station",
    }, headers=admin_headers)
    centre_id = c_resp.json()["id"]

    slot_date = (date.today() + timedelta(days=2)).isoformat()
    client.post("/api/v1/admin/slots", json={
        "centre_id": centre_id,
        "slot_date": slot_date,
        "start_time": "08:00:00",
        "end_time": "10:00:00",
        "capacity": 15,
    }, headers=admin_headers)

    # Public get centres
    centres_resp = client.get("/api/v1/centres")
    assert centres_resp.status_code == 200
    centre_match = next((c for c in centres_resp.json() if c["id"] == centre_id), None)
    assert centre_match is not None
    assert centre_match["active_slots"] >= 1

    # Public get slots for centre
    slots_resp = client.get(f"/api/v1/centres/{centre_id}/slots?date={slot_date}")
    assert slots_resp.status_code == 200
    slots = slots_resp.json()
    assert len(slots) == 1
    assert slots[0]["capacity"] == 15
    assert slots[0]["remaining_capacity"] == 15
    assert slots[0]["booked_count"] == 0

