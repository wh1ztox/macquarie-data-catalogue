from fastapi import APIRouter, Request
from catalogue.schemas import AskRequest, AskResult

router = APIRouter(prefix="/ask", tags=["discovery"])


@router.post("", response_model=AskResult)
async def ask_catalogue(data: AskRequest, request: Request):
    return await request.app.state.ask_service.ask(data)
