import type { Dataset } from "../types/dataset";
import { request } from "./datasets";
export type AskResult = {
  answer: string;
  sources: Dataset[];
  mode: "mock" | "llm";
};
export function askCatalogue(
  question: string,
  previous_questions: string[],
): Promise<AskResult> {
  return request("/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, previous_questions }),
  });
}
