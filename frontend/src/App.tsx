import DatasetForm from './components/DatasetForm';
import DatasetList from './components/DatasetList';
import { useDatasets } from './hooks/useDatasets';
export default function App() {
  const data = useDatasets();
  return <><header className="topbar"><a href="/" className="wordmark"><span className="logo" aria-hidden="true">▦</span> Data Catalogue</a><span className="topbar-note">Discover what your data holds</span></header>
    <main><div className="hero"><div className="section-kicker">DATA, WITH CONTEXT</div><h1>A clearer view of your data.</h1><p>Register datasets, understand their contents, and keep your team’s knowledge in one place.</p></div>
      <div className="workspace"><DatasetForm onCreate={data.create} /><div className="results">
        {data.notice && <div className="notice" role="status">{data.notice}</div>}
        {data.error && <div className="error" role="alert">{data.error} <button className="retry" onClick={() => void data.load()}>Reload catalogue</button></div>}
        {data.loading ? <p role="status" className="empty">Loading catalogue…</p> : <DatasetList datasets={data.datasets} deleting={data.deleting} onDelete={id => void data.remove(id)} />}
      </div></div>
    </main><footer>Data Catalogue · Technical assessment</footer></>;
}
