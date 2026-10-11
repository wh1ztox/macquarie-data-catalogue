export type DatasetInput = { name: string; owner: string; description: string };
export type Dataset = DatasetInput & { id: string; tags: string[]; summary: string };
export type CreationResult = { dataset: Dataset; warning: string | null };
