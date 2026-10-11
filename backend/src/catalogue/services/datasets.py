import logging
from uuid import uuid4
from catalogue.curation.base import Curator, CurationUnavailable
from catalogue.repositories.base import DatasetRepository
from catalogue.schemas import CreationResult, Dataset, DatasetInput

logger = logging.getLogger(__name__)

class DatasetNotFound(Exception):
    pass

class DatasetService:
    def __init__(self, repository: DatasetRepository, curator: Curator):
        self.repository = repository
        self.curator = curator

    def list(self) -> list[Dataset]:
        return self.repository.list()

    async def create(self, data: DatasetInput) -> CreationResult:
        warning = None
        try:
            curation = await self.curator.curate(data)
            tags, summary = curation.tags, curation.summary
        except CurationUnavailable:
            logger.warning("Dataset saved without curation: provider unavailable")
            tags, summary = [], ""
            warning = "Dataset saved, but automatic curation was unavailable. Tags and summary are empty."
        dataset = Dataset(id=str(uuid4()), **data.model_dump(), tags=tags, summary=summary)
        self.repository.add(dataset)
        return CreationResult(dataset=dataset, warning=warning)

    def delete(self, dataset_id: str) -> None:
        if not self.repository.delete(dataset_id):
            raise DatasetNotFound()
