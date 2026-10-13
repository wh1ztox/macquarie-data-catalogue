import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "../src/App";
import { datasetsApi } from "../src/api/datasets";
vi.mock("../src/api/datasets", async () => {
  const actual = await vi.importActual("../src/api/datasets");
  return {
    ...actual,
    datasetsApi: { list: vi.fn(), create: vi.fn(), delete: vi.fn() },
  };
});
const seed = {
  id: "1",
  name: "Customer Transactions",
  owner: "Finance Team",
  description: "Daily transactions.",
  tags: ["finance"],
  summary: "Daily finance data.",
};
beforeEach(() => {
  vi.mocked(datasetsApi.list).mockResolvedValue([seed]);
});
describe("Catalogue user journeys", () => {
  it("shows seed data and validates empty inputs without making a request", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(
      await screen.findByText("Customer Transactions"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "+ Add dataset" }));
    await user.click(screen.getByRole("button", { name: /^Add dataset/ }));
    expect(screen.getByText("Name is required.")).toBeInTheDocument();
    expect(screen.getByText("Description is required.")).toBeInTheDocument();
    expect(datasetsApi.create).not.toHaveBeenCalled();
  });
  it("creates and deletes without reloading and displays a curation warning", async () => {
    const user = userEvent.setup();
    const added = {
      ...seed,
      id: "4",
      name: "Trade Confirmations",
      tags: [],
      summary: "",
      curation_status: "failed" as const,
    };
    vi.mocked(datasetsApi.create).mockResolvedValue(added);
    vi.mocked(datasetsApi.delete).mockResolvedValue({ deleted: "4" });
    render(<App />);
    await screen.findByText(seed.name);
    await user.click(screen.getByRole("button", { name: "+ Add dataset" }));
    await user.type(screen.getByLabelText("Dataset name"), added.name);
    await user.type(screen.getByLabelText("Owner"), "Middle Office");
    await user.type(screen.getByLabelText("Description"), "Daily trades.");
    await user.click(screen.getByRole("button", { name: /^Add dataset/ }));
    expect(await screen.findByText(added.name)).toBeInTheDocument();
    expect(
      screen.getByText(
        "Dataset saved, but automatic curation was unavailable. Tags and summary are empty.",
      ),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Delete Trade Confirmations" }),
    );
    await waitFor(() =>
      expect(screen.queryByText(added.name)).not.toBeInTheDocument(),
    );
  });
  it("shows a recoverable initial loading error", async () => {
    vi.mocked(datasetsApi.list).mockRejectedValueOnce(
      new Error("Server unavailable"),
    );
    render(<App />);
    expect(await screen.findByText("Server unavailable")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Reload catalogue" }),
    );
    expect(await screen.findByText(seed.name)).toBeInTheDocument();
  });
});
