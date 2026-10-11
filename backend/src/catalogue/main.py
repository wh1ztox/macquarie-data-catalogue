from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from catalogue.config import Settings
from catalogue.curation.llm import LLMCurator
from catalogue.curation.mock import KeywordCurator
from catalogue.repositories.memory import MemoryRepository
from catalogue.routes.datasets import router
from catalogue.services.datasets import DatasetNotFound, DatasetService


def create_app(settings: Settings | None = None, curator=None) -> FastAPI:
    settings = settings or Settings.from_env()
    if settings.curation_mode not in {"mock", "llm"}:
        raise ValueError("CURATION_MODE must be mock or llm")
    if curator is None:
        if settings.curation_mode == "llm" and not settings.llm_api_key:
            raise ValueError("LLM_API_KEY is required in llm mode")
        curator = LLMCurator(settings) if settings.curation_mode == "llm" else KeywordCurator()
    app = FastAPI(title="Data Catalogue API", version="0.1.0")
    app.state.dataset_service = DatasetService(MemoryRepository(), curator)
    app.add_middleware(CORSMiddleware, allow_origins=[settings.frontend_origin], allow_methods=["GET", "POST", "DELETE"], allow_headers=["Content-Type"])

    @app.exception_handler(RequestValidationError)
    async def invalid_input(request: Request, exc: RequestValidationError):
        fields = {str(e["loc"][-1]): e["msg"] for e in exc.errors()}
        return JSONResponse(status_code=400, content={"error": "Please check the supplied fields.", "fields": fields})

    @app.exception_handler(DatasetNotFound)
    async def missing_dataset(request: Request, exc: DatasetNotFound):
        return JSONResponse(status_code=404, content={"error": "Dataset not found.", "fields": {}})

    @app.get("/health")
    def health():
        return {"status": "ok", "curation_mode": settings.curation_mode}

    app.include_router(router)
    return app

app = create_app()
