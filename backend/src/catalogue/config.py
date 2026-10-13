import os
from pathlib import Path
from dotenv import load_dotenv
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    curation_mode: str = "mock"
    llm_provider: str = "openai-compatible"
    llm_api_key: str = ""
    llm_base_url: str = "https://api.openai.com/v1"
    llm_model: str = "gpt-4.1-mini"
    frontend_origin: str = "http://localhost:5173"

    @classmethod
    def from_env(cls):
        # Resolve the project root independently of the working directory.
        # Explicit process environment values take precedence over the local file.
        load_dotenv(Path(__file__).resolve().parents[3] / ".env", override=False)
        return cls(
            curation_mode=os.getenv("CURATION_MODE", "mock"),
            llm_provider=os.getenv("LLM_PROVIDER", "openai-compatible"),
            llm_api_key=os.getenv("LLM_API_KEY", ""),
            llm_base_url=os.getenv("LLM_BASE_URL", "https://api.openai.com/v1"),
            llm_model=os.getenv("LLM_MODEL", "gpt-4.1-mini"),
            frontend_origin=os.getenv("FRONTEND_ORIGIN", "http://localhost:5173"),
        )
