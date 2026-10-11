from pydantic import BaseModel, ConfigDict, Field, field_validator

class DatasetInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=120)
    owner: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=4000)

    @field_validator("name", "owner", "description", mode="before")
    @classmethod
    def trim(cls, value):
        return value.strip() if isinstance(value, str) else value

class Curation(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tags: list[str] = Field(max_length=12)
    summary: str = Field(min_length=1, max_length=600)

    @field_validator("tags")
    @classmethod
    def clean_tags(cls, tags):
        clean = list(dict.fromkeys(t.strip() for t in tags))
        if any(not t or len(t) > 60 for t in clean):
            raise ValueError("Tags must be nonblank and at most 60 characters")
        return clean

    @field_validator("summary")
    @classmethod
    def nonblank_summary(cls, value):
        if not value.strip():
            raise ValueError("Summary must not be blank")
        return value.strip()

class Dataset(DatasetInput):
    id: str
    tags: list[str]
    summary: str

class CreationResult(BaseModel):
    dataset: Dataset
    warning: str | None = None

class ErrorResponse(BaseModel):
    error: str
    fields: dict[str, str] = Field(default_factory=dict)
