import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ExamplePage } from "./ExamplePage";
import { expect, describe, it } from "vitest";

describe("ExamplePage", () => {
  it("renders", () => {
    render(
      <MemoryRouter>
        <ExamplePage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Guardian Operator Dashboard/i)).toBeInTheDocument();
  });
});
