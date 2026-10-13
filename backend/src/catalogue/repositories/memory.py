from threading import Lock
from catalogue.schemas import Dataset
from catalogue.repositories.seed import seed_datasets


class MemoryRepository:
    """Process-local storage. Return copies so callers cannot mutate saved records."""

    def __init__(self):
        self._records = {d.id: d for d in seed_datasets()}
        self._lock = Lock()

    def list(self) -> list[Dataset]:
        with self._lock:
            return [d.model_copy(deep=True) for d in self._records.values()]

    def add(self, dataset: Dataset) -> None:
        with self._lock:
            self._records[dataset.id] = dataset.model_copy(deep=True)

    def delete(self, dataset_id: str) -> bool:
        with self._lock:
            return self._records.pop(dataset_id, None) is not None
