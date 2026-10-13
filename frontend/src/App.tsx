import { useState } from "react";
import DatasetForm from "./components/DatasetForm";
import DatasetList from "./components/DatasetList";
import AskCatalogue from "./components/AskCatalogue";
import { useDatasets } from "./hooks/useDatasets";
export default function App() {
  const data = useDatasets();
  const [search, setSearch] = useState("");
  const [piiOnly, setPiiOnly] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [highlight, setHighlight] = useState("");
  const filtered = data.datasets.filter(
    (d) =>
      (!piiOnly || d.tags.some((t) => t.toLowerCase() === "pii")) &&
      `${d.name} ${d.owner} ${d.description} ${d.tags.join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  function showSource(id: string) {
    setSearch("");
    setPiiOnly(false);
    setHighlight(id);
    window.setTimeout(() => {
      const card = document.getElementById("dataset-" + id);
      card?.scrollIntoView({ behavior: "smooth", block: "center" });
      card?.focus({ preventScroll: true });
    }, 0);
  }
  return (
    <>
      <header className="topbar">
        <a href="/" className="wordmark">
          <span className="logo" aria-hidden="true">
            ▦
          </span>{" "}
          Data Catalogue
        </a>
        <span className="topbar-note">Discover what your data holds</span>
      </header>
      <main>
        <div className="hero">
          <div className="section-kicker">DATA, WITH CONTEXT</div>
          <h1>A clearer view of your data.</h1>
          <p>
            Discover datasets, understand their contents, and ask questions
            about what’s available.
          </p>
        </div>
        <div className="discovery-workspace">
          <div className="results">
            <div className="catalogue-toolbar">
              <label className="sr-only" htmlFor="search">
                Search datasets
              </label>
              <input
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search datasets…"
              />
              <button
                className={piiOnly ? "filter selected-filter" : "filter"}
                aria-pressed={piiOnly}
                onClick={() => setPiiOnly(!piiOnly)}
              >
                PII only
              </button>
              <button
                className="primary add-toggle"
                aria-expanded={registerOpen}
                aria-controls="registration"
                onClick={() => setRegisterOpen(!registerOpen)}
              >
                {registerOpen ? "Close form" : "+ Add dataset"}
              </button>
            </div>
            <div id="registration" hidden={!registerOpen}>
              <DatasetForm onCreate={data.create} />
            </div>
            {data.notice && (
              <div className="notice" role="status">
                {data.notice}
              </div>
            )}
            {data.error && (
              <div className="error" role="alert">
                {data.error}{" "}
                <button className="retry" onClick={() => void data.load()}>
                  Reload catalogue
                </button>
              </div>
            )}
            {data.loading ? (
              <p role="status" className="empty">
                Loading catalogue…
              </p>
            ) : filtered.length === 0 && data.datasets.length > 0 ? (
              <div className="empty">
                No datasets match your filters.{" "}
                <button
                  className="retry"
                  onClick={() => {
                    setSearch("");
                    setPiiOnly(false);
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <DatasetList
                datasets={filtered}
                deleting={data.deleting}
                highlight={highlight}
                onDelete={(id) => void data.remove(id)}
              />
            )}
          </div>
          <AskCatalogue onSource={showSource} />
        </div>
      </main>
      <footer>Data Catalogue · Technical assessment</footer>
    </>
  );
}
