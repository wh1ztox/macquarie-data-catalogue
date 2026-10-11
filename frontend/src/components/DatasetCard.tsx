import type { Dataset } from '../types/dataset';
export default function DatasetCard({ dataset, deleting, onDelete }: { dataset: Dataset; deleting: boolean; onDelete: () => void }) {
  return <article className="dataset-card">
    <div className="card-heading"><div><h3>{dataset.name}</h3><p className="owner">{dataset.owner}</p></div><button className="delete" onClick={onDelete} disabled={deleting} aria-label={`Delete ${dataset.name}`}>{deleting ? 'Deleting…' : 'Delete'}</button></div>
    <p className="description">{dataset.description}</p>
    <div className="tags" aria-label="Dataset tags">{dataset.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
    <div className="summary"><span className="summary-label">SUMMARY</span><p>{dataset.summary || 'Automatic curation was unavailable for this dataset.'}</p></div>
  </article>;
}
