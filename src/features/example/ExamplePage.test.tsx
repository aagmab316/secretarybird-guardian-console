import React from "react";
import { render, screen } from "@testing-library/react";
import ExamplePage from "./ExamplePage";
import { axe, toHaveNoViolations } from "jest-axe";
import { expect, describe, it } from "vitest";

expect.extend(toHaveNoViolations);

describe("ExamplePage", () => {
  it("renders", () => {
    render(<ExamplePage />);
    expect(screen.getByText(/Example Feature/i)).toBeInTheDocument();
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(<ExamplePage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
