import re
from catalogue.schemas import Curation, DatasetInput


class KeywordCurator:
    """Deterministic, domain-aware curation for an offline, reproducible demo."""

    async def curate(self, dataset: DatasetInput) -> Curation:
        text = f"{dataset.name} {dataset.description}".lower()
        words = set(re.findall(r"[a-z]+", text))
        tags = []
        rules = [
            ({"trade", "trades", "trading", "counterparty"}, ["trading", "finance"]),
            (
                {"transaction", "transactions", "amount", "currency"},
                ["finance", "transactions"],
            ),
            (
                {"inventory", "stock", "sku", "warehouse"},
                ["inventory", "operations", "warehouse"],
            ),
            ({"employee", "employees", "hr", "department"}, ["HR", "employees"]),
            (
                {"customer", "customers", "employee", "employees", "email", "address"},
                ["PII"],
            ),
            ({"settlement", "settlements"}, ["settlements"]),
            ({"daily"}, ["daily"]),
            ({"weekly"}, ["weekly"]),
        ]
        for triggers, additions in rules:
            if words & triggers:
                tags.extend(additions)
        tags = list(dict.fromkeys(tags)) or ["general"]
        first_sentence = re.split(r"(?<=[.!?])\s+", dataset.description)[0]
        summary = first_sentence[:550].rstrip()
        if summary[-1:] not in ".!?":
            summary += "."
        return Curation(tags=tags, summary=summary)
