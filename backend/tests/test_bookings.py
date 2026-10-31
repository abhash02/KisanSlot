import pytest
from datetime import date, timedelta
from app.models.user import User
from app.core.security import get_password_hash


@pytest.fixture
def admin_user_headers(client, db_session):
    """Fixture providing auth headers for an admin."""
    admin = User(
        full_name="Mandi Incharge",
        mobile_number="9870000001",
        password_hash=get_password_hash("AdminPass123"),
        role="ADMIN",
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()

    login_resp = client.post("/api/v1/auth/login", json={
        "mobile_number": "9870000001",
        "password": "AdminPass123",
    })
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def farmer_1_headers(client):
    """Fixture for Farmer 1."""
    reg = client.post("/api/v1/auth/register", json={
        "full_name": "Balram Singh",
        "mobile_number": "9871111111",
        "password": "FarmerPass123",
        "village": "Fatehpur",
    })
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def farmer_2_headers(client):
    """Fixture for Farmer 2."""
    reg = client.post("/api/v1/auth/register", json={
        "full_name": "Devendra Yadav",
        "mobile_number": "9872222222",
        "password": "FarmerPass123",
        "village": "Shivpur",
    })
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_centre_and_slot(client, admin_user_headers):
    """Fixture creating a test centre and a future slot with capacity=2."""
    c_resp = client.post("/api/v1/admin/centres", json={
        "name": "Hisar Regional Mandi",
        "district": "Hisar",
        "address": "Balsamand Road, Hisar",
    }, headers=admin_user_headers)
    centre_id = c_resp.json()["id"]

    slot_date = (date.today() + timedelta(days=2)).isoformat()
    s_resp = client.post("/api/v1/admin/slots", json={
        "centre_id": centre_id,
        "slot_date": slot_date,
        "start_time": "09:00:00",
        "end_time": "11:00:00",
        "capacity": 2,
    }, headers=admin_user_headers)
    slot_id = s_resp.json()["id"]

    return {"centre_id": centre_id, "slot_id": slot_id, "slot_date": slot_date}


def test_farmer_booking_creation_and_token(client, farmer_1_headers, sample_centre_and_slot):
    """Test successful booking returns unique token and reserves capacity."""
    slot_id = sample_centre_and_slot["slot_id"]
    payload = {
        "slot_id": slot_id,
        "produce_type": "Wheat",
        "quantity": 45.5,
        "quantity_unit": "quintal",
    }
    resp = client.post("/api/v1/bookings", json=payload, headers=farmer_1_headers)
    assert resp.status_code == 201, resp.text
    data = resp.json()

    # Verify token format: KS-YYYYMMDD-XXXXXX
    assert data["public_token"].startswith("KS-")
    assert len(data["public_token"]) == 18
    assert data["status"] == "BOOKED"
    assert data["produce_type"] == "Wheat"
    assert data["quantity"] == 45.5
    assert data["farmer_name"] == "Balram Singh"
    assert data["queue_number"] == 1
    assert len(data["status_history"]) == 1
    assert data["status_history"][0]["new_status"] == "BOOKED"

    # Verify slot remaining capacity decreased
    slots_resp = client.get(
        f"/api/v1/centres/{sample_centre_and_slot['centre_id']}/slots?date={sample_centre_and_slot['slot_date']}"
    )
    slot_data = next(s for s in slots_resp.json() if s["id"] == slot_id)
    assert slot_data["booked_count"] == 1
    assert slot_data["remaining_capacity"] == 1


def test_prevent_duplicate_booking_in_same_slot(client, farmer_1_headers, sample_centre_and_slot):
    """Test farmer cannot double-book the same slot."""
    slot_id = sample_centre_and_slot["slot_id"]
    payload = {
        "slot_id": slot_id,
        "produce_type": "Mustard",
        "quantity": 20.0,
    }
    resp1 = client.post("/api/v1/bookings", json=payload, headers=farmer_1_headers)
    assert resp1.status_code == 201

    # Second booking attempt by same farmer
    resp2 = client.post("/api/v1/bookings", json=payload, headers=farmer_1_headers)
    assert resp2.status_code == 400
    assert "already have an active booking" in resp2.json()["detail"].lower()


def test_slot_capacity_limit_enforced(client, farmer_1_headers, farmer_2_headers, sample_centre_and_slot, db_session):
    """Test that when capacity=2 is reached, a 3rd booking is rejected."""
    slot_id = sample_centre_and_slot["slot_id"]

    # Booking 1 (Farmer 1)
    b1 = client.post("/api/v1/bookings", json={
        "slot_id": slot_id,
        "produce_type": "Wheat",
        "quantity": 30.0,
    }, headers=farmer_1_headers)
    assert b1.status_code == 201

    # Booking 2 (Farmer 2)
    b2 = client.post("/api/v1/bookings", json={
        "slot_id": slot_id,
        "produce_type": "Wheat",
        "quantity": 25.0,
    }, headers=farmer_2_headers)
    assert b2.status_code == 201

    # Register Farmer 3
    reg3 = client.post("/api/v1/auth/register", json={
        "full_name": "Third Farmer",
        "mobile_number": "9873333333",
        "password": "FarmerPass123",
    })
    farmer_3_headers = {"Authorization": f"Bearer {reg3.json()['access_token']}"}

    # Booking 3 (Should fail because capacity=2 is full)
    b3 = client.post("/api/v1/bookings", json={
        "slot_id": slot_id,
        "produce_type": "Wheat",
        "quantity": 10.0,
    }, headers=farmer_3_headers)
    assert b3.status_code == 400
    assert "capacity has been reached" in b3.json()["detail"].lower()


def test_farmer_ownership_and_cancellation_frees_capacity(client, farmer_1_headers, farmer_2_headers, sample_centre_and_slot):
    """Test farmer can cancel own booking, frees capacity, and cannot cancel another's."""
    slot_id = sample_centre_and_slot["slot_id"]

    # Farmer 1 creates booking
    b1 = client.post("/api/v1/bookings", json={
        "slot_id": slot_id,
        "produce_type": "Rice/Paddy",
        "quantity": 50.0,
    }, headers=farmer_1_headers)
    b1_id = b1.json()["id"]

    # Farmer 2 cannot view Farmer 1's booking
    view_resp = client.get(f"/api/v1/bookings/{b1_id}", headers=farmer_2_headers)
    assert view_resp.status_code == 403

    # Farmer 2 cannot cancel Farmer 1's booking
    cancel_resp_fail = client.post(f"/api/v1/bookings/{b1_id}/cancel", headers=farmer_2_headers)
    assert cancel_resp_fail.status_code == 403

    # Farmer 1 cancels own booking
    cancel_resp = client.post(f"/api/v1/bookings/{b1_id}/cancel", headers=farmer_1_headers)
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "CANCELLED"

    # Verify capacity freed up (remaining capacity returns to 2)
    slots_resp = client.get(
        f"/api/v1/centres/{sample_centre_and_slot['centre_id']}/slots?date={sample_centre_and_slot['slot_date']}"
    )
    slot_data = next(s for s in slots_resp.json() if s["id"] == slot_id)
    assert slot_data["remaining_capacity"] == 2
    assert slot_data["booked_count"] == 0


def test_admin_queue_status_workflow(client, admin_user_headers, farmer_1_headers, sample_centre_and_slot):
    """
    Test Admin queue workflow:
    BOOKED -> ARRIVED -> IN_SERVICE -> COMPLETED.
    Invalid transition is rejected.
    """
    slot_id = sample_centre_and_slot["slot_id"]

    # Create booking
    b_resp = client.post("/api/v1/bookings", json={
        "slot_id": slot_id,
        "produce_type": "Maize",
        "quantity": 15.0,
    }, headers=farmer_1_headers)
    booking_id = b_resp.json()["id"]
    token = b_resp.json()["public_token"]

    # 1. Admin searches booking by token in queue list
    queue_list = client.get(f"/api/v1/admin/bookings?q={token}", headers=admin_user_headers)
    assert queue_list.status_code == 200
    assert queue_list.json()["total"] == 1
    assert queue_list.json()["items"][0]["id"] == booking_id

    # 2. Invalid jump: BOOKED -> COMPLETED rejected
    invalid_jump = client.patch(
        f"/api/v1/admin/bookings/{booking_id}/status",
        json={"status": "COMPLETED"},
        headers=admin_user_headers,
    )
    assert invalid_jump.status_code == 400

    # 3. Valid Step 1: Mark ARRIVED
    s1 = client.patch(
        f"/api/v1/admin/bookings/{booking_id}/status",
        json={"status": "ARRIVED", "note": "Farmer reached gate with tractor"},
        headers=admin_user_headers,
    )
    assert s1.status_code == 200
    assert s1.json()["status"] == "ARRIVED"

    # Farmer cannot cancel now that they have arrived
    farmer_cancel = client.post(f"/api/v1/bookings/{booking_id}/cancel", headers=farmer_1_headers)
    assert farmer_cancel.status_code == 400

    # 4. Valid Step 2: Mark IN_SERVICE
    s2 = client.patch(
        f"/api/v1/admin/bookings/{booking_id}/status",
        json={"status": "IN_SERVICE", "note": "Unloading at weighbridge 2"},
        headers=admin_user_headers,
    )
    assert s2.status_code == 200
    assert s2.json()["status"] == "IN_SERVICE"

    # 5. Valid Step 3: Mark COMPLETED
    s3 = client.patch(
        f"/api/v1/admin/bookings/{booking_id}/status",
        json={"status": "COMPLETED", "note": "Weighed and procurement receipt generated"},
        headers=admin_user_headers,
    )
    assert s3.status_code == 200
    assert s3.json()["status"] == "COMPLETED"

    # 6. Audit history verified
    hist_resp = client.get(f"/api/v1/bookings/{booking_id}/history", headers=farmer_1_headers)
    assert hist_resp.status_code == 200
    history = hist_resp.json()
    assert len(history) == 4
    statuses = [h["new_status"] for h in history]
    assert statuses == ["BOOKED", "ARRIVED", "IN_SERVICE", "COMPLETED"]

