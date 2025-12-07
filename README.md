# SecretaryBird Guardian Console

Guardian Console frontend for the SecretaryBird system - a React/Vite/TypeScript application for monitoring and managing SecretaryBird with governance-aware operations.

## Features

- ✅ **TypeScript** - Full type safety
- ✅ **Authentication** - AuthContext with protected routes
- ✅ **Typed API Client** - Governance-aware error handling
- ✅ **Testing** - Vitest + React Testing Library + MSW
- ✅ **Accessibility** - Automated a11y testing with jest-axe
- ✅ **CI/CD** - GitHub Actions workflow
- ✅ **Path Aliases** - Clean imports with `@/` prefix

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_API_BASE=https://api.your-domain.example
VITE_USE_MSW=true  # Enable MSW mocking for development
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

### Testing

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run coverage
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
secretarybird-guardian-console/
├── .github/
│   ├── copilot-instructions.md    # Development guidelines
│   └── workflows/
│       └── ci.yml                 # CI/CD pipeline
├── src/
│   ├── components/
│   │   └── layout/
│   │       └── ProtectedRoute.tsx # Auth guard component
│   ├── contexts/
│   │   └── AuthContext.tsx        # Authentication context
│   ├── features/
│   │   └── example/
│   │       ├── ExamplePage.tsx
│   │       └── ExamplePage.test.tsx
│   ├── lib/
│   │   ├── api.ts                 # Typed API client
│   │   └── config.ts              # App configuration
│   ├── mocks/
│   │   ├── browser.ts             # MSW browser setup
│   │   └── handlers.ts            # MSW request handlers
│   ├── setupTests.ts              # Test configuration
│   └── main.tsx
├── .env.example
├── vitest.config.ts
├── vite.config.ts
└── package.json
```

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router v6** - Routing
- **Vitest** - Testing framework
- **React Testing Library** - Component testing
- **MSW** - API mocking
- **jest-axe** - Accessibility testing

## API Client

The typed API client (`src/lib/api.ts`) provides governance-aware error handling:

```typescript
import { api } from "@/lib/api";

const res = await api.cases.list();
if (res.ok) {
  console.log(res.data);
} else {
  // Display human-friendly explanation from backend
  console.error(res.explanation_for_humans || "Request failed");
}
```

## Authentication

Use the `AuthProvider` and `useAuthContext` hook:

```typescript
import { AuthProvider, useAuthContext } from "@/contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  );
}

function Profile() {
  const { user, logout } = useAuthContext();
  return <div>Welcome {user?.name}</div>;
}
```

Protect routes with `ProtectedRoute`:

```typescript
import ProtectedRoute from "@/components/layout/ProtectedRoute";

<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

## Testing Guidelines

- Write tests for all features
- Include accessibility tests
- Use MSW for API mocking
- Aim for high coverage on critical paths

See `.github/copilot-instructions.md` for detailed guidelines.

## CI/CD

GitHub Actions runs on every push/PR:
1. Install dependencies
2. Run tests
3. Build production bundle

## Contributing

1. Create feature branch from `main`
2. Write tests for new features
3. Ensure tests pass: `npm run test:run`
4. Ensure build succeeds: `npm run build`
5. Commit and push

## License

MIT
