from fastapi.testclient import TestClient
from catalogue.main import create_app
from catalogue.config import Settings
from catalogue.curation.base import CurationUnavailable

PAYLOAD = {
    "name": "Trade Confirmations",
    "owner": "Middle Office",
    "description": "Daily export of confirmed trades including instrument type, counterparty, notional value, and settlement date.",
}


def client(curator=None):
    return TestClient(create_app(Settings(), curator=curator))


def test_seed_and_create_and_delete():
    api = client()
    assert len(api.get("/datasets").json()) == 3
    response = api.post("/datasets", json=PAYLOAD)
    assert response.status_code == 201
    saved = response.json()
    assert {"trading", "finance", "settlements", "daily"} <= set(saved["tags"])
    assert saved["summary"] and saved["id"]
    assert "dataset" not in saved and "warning" not in saved
    assert saved["curation_status"] == "ok"
    assert len(api.get("/datasets").json()) == 4
    assert api.delete("/datasets/1").status_code == 200
    assert all(d["id"] != "1" for d in api.get("/datasets").json())
    assert api.delete("/datasets/1").status_code == 404


def test_invalid_fields_return_400_without_saving():
    api = client()
    for field in ["name", "owner", "description"]:
        payload = {**PAYLOAD, field: "   "}
        response = api.post("/datasets", json=payload)
        assert response.status_code == 400
        assert field in response.json()["fields"]
        payload.pop(field)
        assert api.post("/datasets", json=payload).status_code == 400
    assert len(api.get("/datasets").json()) == 3
    assert (
        api.post("/datasets", json={**PAYLOAD, "description": "x" * 4001}).status_code
        == 400
    )
    assert (
        api.post(
            "/datasets", content="broken", headers={"Content-Type": "application/json"}
        ).status_code
        == 400
    )


def test_curation_failure_still_saves_and_warns():
    class FailedCurator:
        async def curate(self, data):
            raise CurationUnavailable()

    api = client(FailedCurator())
    response = api.post("/datasets", json=PAYLOAD)
    assert response.status_code == 201
    body = response.json()
    assert body["curation_status"] == "failed"
    assert body["tags"] == []
    assert body["summary"] == ""
    assert len(api.get("/datasets").json()) == 4


def test_each_app_has_independent_storage():
    first, second = client(), client()
    first.delete("/datasets/1")
    assert len(second.get("/datasets").json()) == 3
