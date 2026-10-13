import { useCallback, useEffect, useState } from "react";
import { datasetsApi } from "../api/datasets";
import type { Dataset, DatasetInput } from "../types/dataset";
export function useDatasets() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleting, setDeleting] = useState<string[]>([]);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setDatasets(await datasetsApi.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load datasets.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function create(data: DatasetInput) {
    setNotice("");
    const result = await datasetsApi.create(data);
    setDatasets((previous) => [...previous, result]);
    setNotice(
      result.curation_status === "failed"
        ? "Dataset saved, but automatic curation was unavailable. Tags and summary are empty."
        : `Added ${result.name}.`,
    );
  }
  async function remove(id: string) {
    setError("");
    setDeleting((ids) => [...ids, id]);
    try {
      await datasetsApi.delete(id);
      setDatasets((previous) => previous.filter((d) => d.id !== id));
      setNotice("Dataset deleted.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete dataset.");
    } finally {
      setDeleting((ids) => ids.filter((value) => value !== id));
    }
  }
  return { datasets, loading, error, notice, deleting, load, create, remove };
}
