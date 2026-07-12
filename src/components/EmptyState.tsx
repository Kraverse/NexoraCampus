export function EmptyState({
  emoji = "🌱",
  title,
  description,
  action,
}: {
  emoji?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="nx-fade-up flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)]/40 px-6 py-16 text-center">
      <div
        className="mb-4 flex h-20 w-20 items-center justify-center rounded-full text-4xl"
        style={{ background: "radial-gradient(circle, rgba(124,92,255,0.18), transparent 70%)" }}
      >
        {emoji}
      </div>
      <h3 className="mb-1.5 text-lg font-semibold text-white">{title}</h3>
      <p className="max-w-sm text-sm text-[var(--text-dim)]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
