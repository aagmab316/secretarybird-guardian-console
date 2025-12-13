// Vitest / testing setup
import "@testing-library/jest-dom";
import "whatwg-fetch"; // fetch polyfill for vitest/node
import { vi, afterEach } from "vitest";

// Mock fetch globally to prevent unhandled network errors in tests
const mockFetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);

vi.stubGlobal("fetch", mockFetch);

// Reset mocks after each test
afterEach(() => {
  mockFetch.mockClear();
});
