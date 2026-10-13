import type { Dataset } from "../types/dataset";
export default function DatasetCard({
  dataset,
  deleting,
  onDelete,
  highlighted,
}: {
  dataset: Dataset;
  deleting: boolean;
  onDelete: () => void;
  highlighted?: boolean;
}) {
  return (
    <article
      id={"dataset-" + dataset.id}
      tabIndex={-1}
      className={"dataset-card" + (highlighted ? " highlighted" : "")}
    >
      <div className="card-heading">
        <div>
          <h3>{dataset.name}</h3>
          <p className="owner">{dataset.owner}</p>
        </div>
        <button
          className="delete"
          onClick={onDelete}
          disabled={deleting}
          aria-label={`Delete ${dataset.name}`}
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
      {dataset.curation_status === "failed" && (
        <p className="curation-warning">
          Curation unavailable · This dataset was saved without AI-generated
          metadata.
        </p>
      )}
      <p className="description">{dataset.description}</p>
      <div className="tags" aria-label="Dataset tags">
        {dataset.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <div className="summary">
        <span className="summary-label">SUMMARY</span>
        <p>
          {dataset.summary ||
            "Automatic curation was unavailable for this dataset."}
        </p>
      </div>
    </article>
  );
}
