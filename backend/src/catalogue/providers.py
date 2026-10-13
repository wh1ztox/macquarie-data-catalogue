"""Shared JSON completion transport; callers validate their domain result."""

import httpx
from catalogue.config import Settings


async def complete_json(settings: Settings, payload: dict) -> str:
    headers = {"Authorization": f"Bearer {settings.llm_api_key}"}
    url = settings.llm_base_url.rstrip("/") + "/chat/completions"
    if settings.llm_provider == "claude":
        headers = {"x-api-key": settings.llm_api_key, "anthropic-version": "2023-06-01"}
        url = settings.llm_base_url.rstrip("/") + "/messages"
        payload = {
            "model": payload["model"],
            "max_tokens": payload["max_tokens"],
            "temperature": payload["temperature"],
            "system": "\n".join(
                m["content"] for m in payload["messages"] if m["role"] == "system"
            ),
            "messages": [m for m in payload["messages"] if m["role"] != "system"],
        }
    elif settings.llm_provider != "openai-compatible":
        raise ValueError("Unsupported LLM_PROVIDER")
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        body = response.json()
    if settings.llm_provider == "claude":
        if body.get("stop_reason") != "end_turn":
            raise ValueError("Claude response did not complete normally")
        content = "".join(
            block["text"] for block in body["content"] if block.get("type") == "text"
        )
        if not content.strip():
            raise ValueError("Claude returned no text")
        return content
    return body["choices"][0]["message"]["content"]
