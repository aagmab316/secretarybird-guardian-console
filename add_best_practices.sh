#!/usr/bin/env bash
# add_best_practices.sh
# Adds API client, AuthContext, MSW mocks, Vitest config, CI workflow, and commits to main.
# Run this from the repository root (secretarybird-guardian-console).

set -euo pipefail

echo "🚀 Adding best practices to Guardian Console..."

COMMIT_MSG="chore: add API client, auth context, tests, mocks, and CI

- Add typed API client with governance-aware error handling
- Add AuthContext with protected routes
- Add MSW for API mocking in tests/development
- Add Vitest + React Testing Library + jest-axe
- Add GitHub Actions CI workflow
- Configure path aliases (@/ imports)
- Add example feature with accessibility tests

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Install additional dependencies
echo "📦 Installing dependencies..."
npm install react-router-dom
npm install -D msw vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-axe axe-core whatwg-fetch @types/react-router-dom

# Create directories
echo "📂 Creating directory structure..."
mkdir -p src/lib src/contexts src/components/layout src/mocks src/features/example .github/workflows

# src/lib/config.ts
cat > src/lib/config.ts <<'EOF'
export const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:8080";
export const APP_NAME = "Secretarybird Guardian Console";
EOF

# src/lib/api.ts
cat > src/lib/api.ts <<'EOF'
// Lightweight typed API client with governance-aware handling
import { API_BASE } from "./config";

type ApiResponse<T> = { ok: true; data: T } | { ok: false; status: number; error?: any; explanation_for_humans?: string };

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${API_BASE.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    ...init,
  });

  const contentType = res.headers.get("content-type") || "";
  let body: any = null;
  if (contentType.includes("application/json")) {
    body = await res.json();
  } else {
    body = await res.text();
  }

  if (res.ok) {
    return { ok: true, data: body as T };
  }

  // Governance-aware handling: backend may return explanation_for_humans
  const explanation = body?.explanation_for_humans || body?.message || undefined;

  return { ok: false, status: res.status, error: body, explanation_for_humans: explanation };
}

/**
 * Example API surface. Expand this according to your backend endpoints.
 */
export const api = {
  cases: {
    list: async () => request<any[]>("/cases"),
    get: async (id: string) => request<any>(`/cases/${encodeURIComponent(id)}`),
    update: async (id: string, payload: any) =>
      request<any>(`/cases/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
  },
  auth: {
    me: async () => request<any>("/auth/me"),
    login: async (payload: { username: string; password: string }) =>
      request<any>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
    logout: async () => request<void>("/auth/logout", { method: "POST" }),
  },
};

export type Api = typeof api;
EOF

# src/contexts/AuthContext.tsx
cat > src/contexts/AuthContext.tsx <<'EOF'
import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { api } from "../lib/api";

/**
 * Minimal AuthContext:
 * - stores user info
 * - exposes login/logout, and a method to refresh current user (me)
 * Replace with your actual auth mechanism (JWT cookie, OAuth, etc.)
 */

type User = { id: string; name?: string; email?: string; roles?: string[] } | null;

type AuthContextValue = {
  user: User;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const res = await api.auth.me();
    if (res.ok) {
      setUser(res.data);
    } else {
      setUser(null);
    }
    setLoading(false);
  }

  async function logout() {
    await api.auth.logout();
    setUser(null);
  }

  useEffect(() => {
    // On mount check current user; backend should read cookie or session
    refresh().catch(() => setLoading(false));
  }, []);

  return <AuthContext.Provider value={{ user, loading, refresh, logout }}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside AuthProvider");
  return ctx;
}
EOF

# src/components/layout/ProtectedRoute.tsx
cat > src/components/layout/ProtectedRoute.tsx <<'EOF'
import React, { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";

/**
 * ProtectedRoute respects AuthContext.
 * If unauthenticated, redirect to /login.
 * While loading show a minimal loading indicator.
 */
export default function ProtectedRoute({ children }: PropsWithChildren) {
  const { user, loading } = useAuthContext();
  const loc = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div role="status" aria-live="polite">
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: loc }} replace />;
  }

  return <>{children}</>;
}
EOF

# src/features/example/ExamplePage.tsx
cat > src/features/example/ExamplePage.tsx <<'EOF'
import React from "react";

export default function ExamplePage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Example Feature</h1>
      <p className="text-gray-600">
        This is an example page demonstrating the Guardian Console structure.
      </p>
    </div>
  );
}
EOF

# .env.example
cat > .env.example <<'EOF'
VITE_API_BASE=http://localhost:8080
# Optional: enable MSW in dev by setting VITE_USE_MSW=true
VITE_USE_MSW=true
EOF

# MSW handlers (using new MSW 2.x syntax)
cat > src/mocks/handlers.ts <<'EOF'
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
EOF

cat > src/mocks/browser.ts <<'EOF'
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);
EOF

# Vitest setup
cat > src/setupTests.ts <<'EOF'
// Vitest / testing setup
import "@testing-library/jest-dom";
import "whatwg-fetch"; // fetch polyfill for vitest/node
EOF

# vitest.config.ts with path aliases
cat > vitest.config.ts <<'EOF'
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
  },
});
EOF

# Update vite.config.ts to add path aliases
cat > vite.config.ts <<'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
EOF

# Update tsconfig.json to recognize path aliases
cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

# Update package.json to add test scripts
echo "📝 Updating package.json..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts = {
  ...pkg.scripts,
  test: 'vitest',
  'test:ui': 'vitest --ui',
  'test:run': 'vitest run',
  coverage: 'vitest run --coverage'
};
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

# example test for ExamplePage
cat > src/features/example/ExamplePage.test.tsx <<'EOF'
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
EOF

# GitHub Actions CI workflow
cat > .github/workflows/ci.yml <<'EOF'
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm run test:run
      - name: Build
        run: npm run build
EOF

# Stage, commit, push
echo "💾 Committing changes..."
git add -A
git commit -m "$COMMIT_MSG" || echo "No changes to commit"

echo "⬆️  Pushing to GitHub..."
git push origin HEAD:main

echo ""
echo "✅ Best-practices files added and pushed to main!"
echo "🔗 View repo: https://github.com/aagmab316/secretarybird-guardian-console"
