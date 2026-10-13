import type { Dataset } from "../types/dataset";
import DatasetCard from "./DatasetCard";
export default function DatasetList({
  datasets,
  deleting,
  onDelete,
  highlight,
}: {
  datasets: Dataset[];
  deleting: string[];
  onDelete: (id: string) => void;
  highlight?: string;
}) {
  return (
    <section aria-labelledby="catalogue-heading">
      <div className="list-heading">
        <div>
          <div className="section-kicker">02 / EXPLORE</div>
          <h2 id="catalogue-heading">Your catalogue</h2>
        </div>
        <span className="count">{datasets.length} datasets</span>
      </div>
      {datasets.length ? (
        <div className="dataset-list">
          {datasets.map((d) => (
            <DatasetCard
              key={d.id}
              highlighted={highlight === d.id}
              dataset={d}
              deleting={deleting.includes(d.id)}
              onDelete={() => onDelete(d.id)}
            />
          ))}
        </div>
      ) : (
        <div className="empty">
          No datasets yet. Register your first dataset using the form.
        </div>
      )}
    </section>
  );
}
