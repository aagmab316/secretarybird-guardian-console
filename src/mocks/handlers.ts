import { http, HttpResponse } from "msw";

export const handlers = [
  // Example: list cases
  http.get("/cases", () => {
    return HttpResponse.json([
      { id: "case-1", title: "Example case", risk: "low" },
      { id: "case-2", title: "Another case", risk: "medium" },
    ]);
  }),

  // Example: auth/me
  http.get("/auth/me", () => {
    return HttpResponse.json({
      id: "user-1",
      name: "Test User",
      email: "user@example.com",
      roles: ["operator"],
    });
  }),
];
