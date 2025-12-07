export function ExamplePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-50">
        Guardian Operator Dashboard
      </h1>
      <p className="text-sm text-slate-300 max-w-xl">
        This is a placeholder screen for the Secretarybird Guardian Console.
        From here we&apos;ll add case lists, firewall events, and escalation
        tools for operators. Everything should stay calm, clear, and
        trauma-informed.
      </p>
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-200">
        <p className="font-medium">Next steps</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
          <li>Wire this dashboard to the Guardian API.</li>
          <li>Add navigation for Cases, Households, and Firewall Events.</li>
          <li>Apply the full Secretarybird branding and layout shell.</li>
        </ul>
      </div>
    </div>
  );
}
