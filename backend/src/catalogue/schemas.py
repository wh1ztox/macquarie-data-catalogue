from typing import Literal
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
    curation_status: Literal["ok", "failed"] = "ok"


class ErrorResponse(BaseModel):
    error: str
    fields: dict[str, str] = Field(default_factory=dict)


class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)
    previous_questions: list[str] = Field(default_factory=list, max_length=6)

    @field_validator("question")
    @classmethod
    def question_nonblank(cls, value):
        if not value.strip():
            raise ValueError("Question must not be blank")
        return value.strip()

    @field_validator("previous_questions")
    @classmethod
    def history_bounded(cls, values):
        if any(len(v) > 1000 for v in values):
            raise ValueError("Previous questions must be at most 1000 characters")
        return values


class AskResult(BaseModel):
    answer: str
    sources: list[Dataset]
    mode: Literal["mock", "llm"]


class GroundedAnswer(BaseModel):
    answer: str = Field(min_length=1, max_length=3000)
    source_ids: list[str] = Field(max_length=10)
