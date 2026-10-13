from catalogue.config import Settings
from catalogue import config


def test_local_env_loaded_without_overriding_exports(monkeypatch):

    calls = []

    def fake_load(path, override):
        calls.append((path, override))
        return True

    monkeypatch.setattr(config, "load_dotenv", fake_load)
    monkeypatch.setenv("LLM_MODEL", "exported-model")
    assert Settings.from_env().llm_model == "exported-model"
    assert calls[0][0].name == ".env"
    assert (calls[0][0].parent / ".env.example").exists()
    assert calls[0][1] is False
