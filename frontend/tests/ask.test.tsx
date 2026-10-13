import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import AskCatalogue from "../src/components/AskCatalogue";
import { askCatalogue } from "../src/api/ask";
vi.mock("../src/api/ask", () => ({ askCatalogue: vi.fn() }));
describe("Catalogue assistant", () => {
  it("shows grounded answers and opens a source", async () => {
    const source = {
      id: "1",
      name: "Customer Transactions",
      owner: "Finance Team",
      description: "Daily transactions.",
      tags: ["PII"],
      summary: "Transaction metadata.",
    };
    vi.mocked(askCatalogue).mockResolvedValue({
      answer: "Customer Transactions contains customer identifiers.",
      sources: [source],
      mode: "mock",
    });
    const onSource = vi.fn();
    render(<AskCatalogue onSource={onSource} />);
    await userEvent.click(
      screen.getByRole("button", {
        name: "Which datasets contain personal information?",
      }),
    );
    expect(
      await screen.findByText(
        "Customer Transactions contains customer identifiers.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Keyword demo/)).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: /Customer Transactions/ }),
    );
    expect(onSource).toHaveBeenCalledWith("1");
  });
  it("retains a failed question for retry", async () => {
    vi.mocked(askCatalogue)
      .mockRejectedValueOnce(new Error("Assistant unavailable"))
      .mockResolvedValue({
        answer: "No relevant metadata.",
        sources: [],
        mode: "mock",
      });
    render(<AskCatalogue onSource={vi.fn()} />);
    await userEvent.type(
      screen.getByLabelText("Ask a question"),
      "Satellite data",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Send question" }),
    );
    expect(
      await screen.findByText("Assistant unavailable"),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Retry question" }),
    );
    expect(
      await screen.findByText("No relevant metadata."),
    ).toBeInTheDocument();
  });
});
