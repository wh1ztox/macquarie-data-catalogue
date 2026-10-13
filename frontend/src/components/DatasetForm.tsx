import { useState } from "react";
import { ApiError } from "../api/datasets";
import type { DatasetInput } from "../types/dataset";
const empty = { name: "", owner: "", description: "" };
export default function DatasetForm({
  onCreate,
}: {
  onCreate: (data: DatasetInput) => Promise<void>;
}) {
  const [form, setForm] = useState<DatasetInput>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const missing = Object.fromEntries(
      Object.entries(form)
        .filter(([, value]) => !value.trim())
        .map(([key]) => [
          key,
          `${key[0].toUpperCase() + key.slice(1)} is required.`,
        ]),
    );
    setErrors(missing);
    setError("");
    if (Object.keys(missing).length) return;
    setSaving(true);
    try {
      await onCreate(form);
      setForm(empty);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save dataset.");
      if (e instanceof ApiError) setErrors(e.fields);
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="form-panel" aria-labelledby="register-heading">
      <div className="section-kicker">01 / REGISTER</div>
      <h2 id="register-heading">Add a dataset</h2>
      <p className="muted">
        Describe what it contains. Tags and a summary are generated when you
        save.
      </p>
      <form onSubmit={submit} noValidate>
        {(["name", "owner", "description"] as const).map((key) => (
          <div className="field" key={key}>
            <label htmlFor={key}>
              {key === "name"
                ? "Dataset name"
                : key === "owner"
                  ? "Owner"
                  : "Description"}
            </label>
            {key === "description" ? (
              <textarea
                id={key}
                rows={5}
                maxLength={4000}
                value={form[key]}
                disabled={saving}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                aria-invalid={Boolean(errors[key])}
                aria-describedby={errors[key] ? key + "-error" : undefined}
                placeholder="What data is included, and how often is it updated?"
              />
            ) : (
              <input
                id={key}
                maxLength={120}
                value={form[key]}
                disabled={saving}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                aria-invalid={Boolean(errors[key])}
                aria-describedby={errors[key] ? key + "-error" : undefined}
                placeholder={
                  key === "name"
                    ? "e.g. Trade Confirmations"
                    : "e.g. Middle Office"
                }
              />
            )}
            {errors[key] && (
              <span className="field-error" id={key + "-error"} role="alert">
                {errors[key]}
              </span>
            )}
          </div>
        ))}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary" disabled={saving}>
          {saving ? "Saving and curating…" : "Add dataset"}
          <span aria-hidden="true">↗</span>
        </button>
      </form>
    </section>
  );
}
