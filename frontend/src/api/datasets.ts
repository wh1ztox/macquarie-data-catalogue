import type { Dataset, DatasetInput, CreationResult } from '../types/dataset';
const origin = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
export class ApiError extends Error {
  constructor(message: string, public fields: Record<string, string> = {}) { super(message); }
}
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(origin + path, options); }
  catch { throw new ApiError('Cannot reach the catalogue. Check your connection and try again.'); }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(body.error || 'The request could not be completed. Please try again.', body.fields || {});
  }
  return response.json();
}
export const datasetsApi = {
  list: () => request<Dataset[]>('/datasets'),
  create: (data: DatasetInput) => request<CreationResult>('/datasets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  delete: (id: string) => request<{ deleted: string }>('/datasets/' + encodeURIComponent(id), { method: 'DELETE' }),
};
