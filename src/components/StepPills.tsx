const STEPS = ["確認題目", "一步步解", "批改", "練習"] as const;

interface StepPillsProps {
  current: number;
}

export default function StepPills({ current }: StepPillsProps) {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const active = step === current;
        const done = step < current;
        return (
          <div key={step} className="flex items-center gap-1.5 flex-1 min-w-0">
            <div
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors
                ${active ? "bg-primary text-white" : done ? "bg-primary-soft text-primary" : "bg-card-border/50 text-muted"}`}
            >
              <span className="font-bold">{step}</span>
              <span className="truncate">{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 rounded-full ${done ? "bg-primary" : "bg-card-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
