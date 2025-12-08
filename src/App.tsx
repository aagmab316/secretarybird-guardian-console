import { Link, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { ExamplePage } from "./features/example/ExamplePage";
import { FirewallEventsPage } from "./features/firewall/FirewallEventsPage";
import { useAuth } from "./contexts/AuthContext";

function LandingPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold text-slate-50">
        Secretarybird Guardian Console
      </h1>
      <p className="text-sm text-slate-300 max-w-xl">
        Internal console for operators protecting families, children, and older
        adults. This is not a public site. Use the dashboard to review firewall
        events, cases, and governance-approved actions.
      </p>
      <Link
        to="/login"
        className="inline-flex items-center rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/20"
      >
        Go to operator login
      </Link>
    </section>
  );
}

function LoginPage() {
  const { loginAsDemo } = useAuth();

  async function handleDemoLogin() {
    await loginAsDemo();
  }

  return (
    <section className="space-y-4 max-w-sm">
      <h1 className="text-2xl font-semibold text-slate-50">Operator login</h1>
      <p className="text-sm text-slate-300">
        In production this will connect to the Secretarybird identity service.
        For now, you can use a demo session to explore the console.
      </p>
      <button
        type="button"
        onClick={handleDemoLogin}
        className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
      >
        Continue with demo operator
      </button>
    </section>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Secretarybird
            </p>
            <p className="text-sm text-slate-200">Guardian Console</p>
          </div>
          <nav className="flex items-center gap-4 text-sm text-slate-200">
            <Link className="hover:text-emerald-300" to="/">
              Overview
            </Link>
            <Link className="hover:text-emerald-300" to="/dashboard">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<ExamplePage />} />
            <Route
              path="/households/:householdId/firewall"
              element={<FirewallEventsPage />}
            />
          </Route>
        </Routes>
      </main>
    </div>
  );
}
