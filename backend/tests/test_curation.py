import asyncio
import httpx
import pytest
from catalogue.config import Settings
from catalogue.curation.llm import LLMCurator
from catalogue.curation.mock import KeywordCurator
from catalogue.curation.base import CurationUnavailable
from catalogue.schemas import DatasetInput


def test_mock_distinguishes_domains():
    curator = KeywordCurator()
    hr = asyncio.run(
        curator.curate(
            DatasetInput(
                name="Directory",
                owner="HR",
                description="Employee roles updated weekly.",
            )
        )
    )
    stock = asyncio.run(
        curator.curate(
            DatasetInput(
                name="Stock",
                owner="Warehouse",
                description="Inventory quantities by SKU.",
            )
        )
    )
    assert "PII" in hr.tags and "weekly" in hr.tags
    assert "inventory" in stock.tags and "PII" not in stock.tags


@pytest.mark.parametrize(
    "content",
    ["not json", '{"tags":"bad","summary":"bad"}', '{"tags":[],"summary":"   "}'],
)
def test_malformed_llm_output_becomes_recoverable_failure(monkeypatch, content):
    async def fake_post(self, url, **kwargs):
        return httpx.Response(
            200,
            json={"choices": [{"message": {"content": content}}]},
            request=httpx.Request("POST", url),
        )

    monkeypatch.setattr(httpx.AsyncClient, "post", fake_post)
    with pytest.raises(CurationUnavailable):
        asyncio.run(
            LLMCurator(Settings(llm_api_key="test")).curate(
                DatasetInput(
                    name="Trades", owner="Finance", description="Daily trades."
                )
            )
        )


def test_llm_timeout_becomes_recoverable_failure(monkeypatch):
    async def fake_post(self, url, **kwargs):
        raise httpx.ReadTimeout("timeout")

    monkeypatch.setattr(httpx.AsyncClient, "post", fake_post)
    with pytest.raises(CurationUnavailable):
        asyncio.run(
            LLMCurator(Settings(llm_api_key="test")).curate(
                DatasetInput(
                    name="Trades", owner="Finance", description="Daily trades."
                )
            )
        )
