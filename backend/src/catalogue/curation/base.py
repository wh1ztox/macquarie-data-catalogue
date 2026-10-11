from typing import Protocol
from catalogue.schemas import Curation, DatasetInput

class Curator(Protocol):
    async def curate(self, dataset: DatasetInput) -> Curation: ...

class CurationUnavailable(Exception):
    """An external curation failure that may safely degrade to an uncurated save."""
