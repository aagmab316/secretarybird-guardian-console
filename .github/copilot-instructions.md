# Guardian Console - Copilot Instructions

## Project Overview
This is the **Guardian Console** frontend for SecretaryBird - a React/Vite/TypeScript application for managing and monitoring the SecretaryBird system.

## Tech Stack
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Routing**: React Router v6
- **Testing**: Vitest + React Testing Library + MSW
- **API Client**: Custom typed client with governance-aware error handling

## Code Style Guidelines

### React Components
- Use functional components with hooks
- Prefer named exports for components
- Keep components small and focused (single responsibility)
- Extract complex logic into custom hooks
- Use TypeScript for all components with proper typing

### File Organization
```
src/
├── components/     # Reusable UI components
│   └── layout/     # Layout components (ProtectedRoute, etc.)
├── pages/          # Page-level components
├── features/       # Feature modules with co-located tests
├── hooks/          # Custom React hooks
├── lib/            # Core libraries (api, config, utils)
├── contexts/       # React Context providers (AuthContext, etc.)
├── mocks/          # MSW handlers for testing/development
└── assets/         # Static assets (images, fonts, etc.)
```

### Naming Conventions
- **Components**: PascalCase (e.g., `GuardianDashboard.tsx`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useGuardianData.ts`)
- **Utils**: camelCase (e.g., `formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Types/Interfaces**: PascalCase (e.g., `User`, `ApiResponse<T>`)

### TypeScript Best Practices
- Always provide explicit types for function parameters and return values
- Use type inference for simple cases
- Prefer `type` over `interface` for object shapes (consistency)
- Use generics for reusable components and utilities
- Avoid `any` - use `unknown` if type is truly unknown

### State Management
- Use React Context for global state (AuthContext already provided)
- Use local state (useState) for component-specific state
- Consider useReducer for complex state logic
- Keep state as close to where it's used as possible

### API Integration
- Use the typed `api` client from `src/lib/api.ts`
- All API calls return `ApiResponse<T>` with governance-aware error handling
- Handle `explanation_for_humans` from backend for user-friendly error messages
- Use async/await for asynchronous operations
- Show loading states during data fetching

Example:
```typescript
const res = await api.cases.list();
if (res.ok) {
  setCases(res.data);
} else {
  setError(res.explanation_for_humans || "Failed to load cases");
}
```

### Authentication
- Use `AuthProvider` to wrap your app (provides user, loading, refresh, logout)
- Use `useAuthContext()` hook to access auth state in components
- Use `ProtectedRoute` component to guard authenticated routes
- Backend should use cookie-based sessions (credentials: "include" is set)

### Testing
- Write tests for all features in co-located `.test.tsx` files
- Use Vitest + React Testing Library
- Include accessibility tests with `jest-axe`
- Use MSW for mocking API calls (see `src/mocks/handlers.ts`)
- Run tests with `npm test` or `npm run test:ui`

Example test structure:
```typescript
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { expect, describe, it } from "vitest";

expect.extend(toHaveNoViolations);

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText(/expected text/i)).toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    const { container } = render(<MyComponent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### UI/UX Principles
- Mobile-first responsive design
- Accessible components (ARIA labels, keyboard navigation, semantic HTML)
- Consistent spacing and typography
- Clear loading and error states
- Intuitive navigation
- Display governance explanations from backend when available

### Path Aliases
- Use `@/` prefix for absolute imports from `src/`
- Example: `import { api } from "@/lib/api"`
- This is configured in `vite.config.ts` and `tsconfig.json`

## SecretaryBird Integration
This console connects to the SecretaryBird backend system:
- Monitor system health and status
- View and manage configurations
- Access logs and metrics
- Control system operations
- Display governance-aware explanations for actions

### Expected Features
1. **Dashboard**: System overview and key metrics
2. **Monitoring**: Real-time status and health checks
3. **Configuration**: Manage system settings
4. **Logs**: View and search system logs
5. **Administration**: User and permission management

## Development Workflow
1. Create feature branches from `main`
2. Keep commits atomic and descriptive
3. Write tests for new features
4. Run `npm test` before committing
5. Ensure `npm run build` succeeds
6. Update documentation as needed

## Code Quality
- Write self-documenting code
- Add comments for complex logic only
- Avoid premature optimization
- Keep functions pure when possible
- Handle edge cases and errors
- TypeScript strict mode is enabled

## Performance Considerations
- Lazy load routes and heavy components
- Memoize expensive calculations with `useMemo`
- Optimize re-renders with `React.memo` when needed
- Keep bundle size minimal
- Use code splitting for large features

## Security
- Validate user input
- Sanitize data before rendering
- Use environment variables for sensitive config (never commit `.env`)
- Implement proper authentication/authorization via AuthContext
- Follow OWASP security guidelines
- Display governance explanations to help users understand system decisions

## Environment Variables
- Copy `.env.example` to `.env` for local development
- `VITE_API_BASE`: Backend API base URL
- `VITE_USE_MSW`: Enable MSW mocking in development (optional)

## CI/CD
- GitHub Actions workflow runs on push/PR to main
- Runs: `npm ci` → `npm run test:run` → `npm run build`
- All checks must pass before merging
