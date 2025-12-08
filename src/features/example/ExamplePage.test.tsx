import { render, screen } from "@testing-library/react";
import { ExamplePage } from "./ExamplePage";
import { expect, describe, it } from "vitest";

describe("ExamplePage", () => {
  it("renders", () => {
    render(<ExamplePage />);
    expect(screen.getByText(/Guardian Operator Dashboard/i)).toBeInTheDocument();
  });
});
