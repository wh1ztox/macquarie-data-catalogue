export type DatasetInput = { name: string; owner: string; description: string };
export type Dataset = DatasetInput & {
  id: string;
  tags: string[];
  summary: string;
  curation_status?: "ok" | "failed";
};
