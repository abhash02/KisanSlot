def test_root_endpoint(client):
    """Test root endpoint returns API info and links."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "KisanSlot"
    assert "health" in data
    assert "docs" in data


def test_health_check_endpoint(client):
    """Test health check returns structured status without unhandled exceptions."""
    response = client.get("/api/v1/health")
    # Response code is 200 (healthy) if PostgreSQL is running, or 503 (degraded) if database is unreachable
    assert response.status_code in (200, 503)
    data = response.json()
    assert "status" in data
    assert data["app"] == "KisanSlot"
    assert "database" in data
    assert data["database"] in ("connected", "disconnected")

