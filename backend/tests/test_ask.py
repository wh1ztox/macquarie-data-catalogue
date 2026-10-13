import httpx
from fastapi.testclient import TestClient
from catalogue.main import create_app
from catalogue.config import Settings
from catalogue.curation.mock import KeywordCurator
from catalogue.curation.base import CurationUnavailable


def test_ask_sources_and_no_match_and_validation():
    api = TestClient(create_app(Settings()))
    result = api.post(
        "/ask", json={"question": "Which datasets contain personal information?"}
    ).json()
    assert {d["id"] for d in result["sources"]} == {"1", "3"}
    assert result["mode"] == "mock"
    assert "Employee Directory" in result["answer"]
    assert (
        api.post("/ask", json={"question": "Satellite telemetry"}).json()["sources"]
        == []
    )
    assert api.post("/ask", json={"question": "   "}).status_code == 400
    assert api.post("/ask", json={"question": "x" * 1001}).status_code == 400
    assert len(api.get("/datasets").json()) == 3


def test_followup_and_deleted_sources():
    api = TestClient(create_app(Settings()))
    request = {
        "question": "Who owns them?",
        "previous_questions": ["What inventory data is available?"],
    }
    result = api.post("/ask", json=request).json()
    assert [d["id"] for d in result["sources"]] == ["2"]
    assert "Operations Team" in result["answer"]
    api.delete("/datasets/2")
    assert api.post("/ask", json=request).json()["sources"] == []


def test_llm_unknown_reference_rejected_and_timeout_handled(monkeypatch):
    async def fake_post(self, url, **kwargs):
        return httpx.Response(
            200,
            json={
                "choices": [
                    {
                        "message": {
                            "content": '{"answer":"Unsupported claim","source_ids":["unknown"]}'
                        }
                    }
                ]
            },
            request=httpx.Request("POST", url),
        )

    monkeypatch.setattr(httpx.AsyncClient, "post", fake_post)
    api = TestClient(
        create_app(
            Settings(curation_mode="llm", llm_api_key="test"), curator=KeywordCurator()
        )
    )
    assert api.post("/ask", json={"question": "Inventory"}).status_code == 503

    async def timeout(self, url, **kwargs):
        raise httpx.ReadTimeout("timeout")

    monkeypatch.setattr(httpx.AsyncClient, "post", timeout)
    assert api.post("/ask", json={"question": "Inventory"}).status_code == 503


def test_failed_curation_status_survives_read():
    class FailedCurator:
        async def curate(self, data):
            raise CurationUnavailable()

    api = TestClient(create_app(Settings(), curator=FailedCurator()))
    response = api.post(
        "/datasets", json={"name": "New", "owner": "Team", "description": "Example"}
    )
    assert response.json()["curation_status"] == "failed"
    assert api.get("/datasets").json()[-1]["curation_status"] == "failed"
