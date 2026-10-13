import json
import httpx
import pytest
from fastapi.testclient import TestClient
from catalogue.config import Settings
from catalogue.main import create_app


def test_native_claude_curation_and_ask(monkeypatch):
    async def post(self, url, **kwargs):
        assert url == "https://api.anthropic.com/v1/messages"
        assert kwargs["headers"]["x-api-key"] == "test"
        assert kwargs["headers"]["anthropic-version"] == "2023-06-01"
        assert "Authorization" not in kwargs["headers"]
        p = kwargs["json"]
        assert "response_format" not in p
        assert p["system"] and p["messages"][0]["role"] == "user"
        data = json.loads(p["messages"][0]["content"])
        result = (
            {"answer": "Operations Team", "source_ids": ["2"]}
            if "question" in data
            else {"tags": ["finance"], "summary": "Daily trades."}
        )
        return httpx.Response(
            200,
            json={
                "stop_reason": "end_turn",
                "content": [{"type": "text", "text": json.dumps(result)}],
            },
            request=httpx.Request("POST", url),
        )

    monkeypatch.setattr(httpx.AsyncClient, "post", post)
    api = TestClient(
        create_app(
            Settings(
                curation_mode="llm",
                llm_provider="claude",
                llm_base_url="https://api.anthropic.com/v1",
                llm_api_key="test",
            )
        )
    )
    response = api.post(
        "/datasets",
        json={"name": "Trades", "owner": "Finance", "description": "Daily trades."},
    )
    assert response.status_code == 201
    assert response.json()["curation_status"] == "ok"
    answer = api.post("/ask", json={"question": "Who owns inventory?"})
    assert answer.status_code == 200
    assert answer.json()["sources"][0]["id"] == "2"


@pytest.mark.parametrize(
    "body",
    [
        {"stop_reason": "max_tokens", "content": [{"type": "text", "text": "{}"}]},
        {"stop_reason": "end_turn", "content": []},
        {"stop_reason": "end_turn", "content": [{"type": "text", "text": "not json"}]},
    ],
)
def test_claude_invalid_output_degrades_gracefully(monkeypatch, body):
    async def post(self, url, **kwargs):
        return httpx.Response(200, json=body, request=httpx.Request("POST", url))

    monkeypatch.setattr(httpx.AsyncClient, "post", post)
    api = TestClient(
        create_app(
            Settings(
                curation_mode="llm",
                llm_provider="claude",
                llm_api_key="test",
                llm_base_url="https://api.anthropic.com/v1",
            )
        )
    )
    result = api.post(
        "/datasets",
        json={"name": "Trades", "owner": "Finance", "description": "Daily trades."},
    )
    assert result.status_code == 201
    assert result.json()["curation_status"] == "failed"
    assert api.post("/ask", json={"question": "Inventory"}).status_code == 503
