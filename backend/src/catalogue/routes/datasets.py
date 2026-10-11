from fastapi import APIRouter, Request
from catalogue.schemas import CreationResult, Dataset, DatasetInput

router = APIRouter(prefix="/datasets", tags=["datasets"])

@router.get("", response_model=list[Dataset])
def list_datasets(request: Request):
    return request.app.state.dataset_service.list()

@router.post("", status_code=201, response_model=CreationResult)
async def create_dataset(data: DatasetInput, request: Request):
    return await request.app.state.dataset_service.create(data)

@router.delete("/{dataset_id}")
def delete_dataset(dataset_id: str, request: Request):
    request.app.state.dataset_service.delete(dataset_id)
    return {"deleted": dataset_id}
