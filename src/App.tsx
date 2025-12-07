function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">
            Secretarybird Guardian Console
          </h1>
          <p className="text-sm text-slate-400">
            Internal operator dashboard – dev sandbox
          </p>
        </div>
      </header>

      <main className="p-6">
        <section className="max-w-2xl space-y-4">
          <h2 className="text-lg font-medium">Welcome, operator 👋</h2>
          <p className="text-sm text-slate-300">
            This is the starting point for the Guardian Console. From here we
            will add:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">
            <li>Secure login & role-based access (operators / admins)</li>
            <li>Dashboard for cases, households, and firewall events</li>
            <li>Calm, trauma-informed alerts and explanations</li>
          </ul>
          <p className="text-xs text-slate-500">
            Dev note: this replaces the Vite starter counter component.
          </p>
        </section>
      </main>
    </div>
  );
}

export default App;
