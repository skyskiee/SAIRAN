import { levelColor } from "@/lib/sairan-api";
import { cn } from "@/lib/utils";

interface Props {
  score: number | null | undefined;
  level: string | null | undefined;
  label?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Readiness score card — numeric score + level badge. Used on dashboard,
 * dimension results, overall results, and in the report.
 */
export function ScoreGauge({ score, level, label, size = "md" }: Props) {
  const displayScore = score != null ? score.toFixed(2) : "—";
  const displayLevel = level || "—";
  const colorClass = levelColor(level);

  const sizes = {
    sm: { score: "text-2xl", level: "text-xs px-2 py-0.5" },
    md: { score: "text-4xl", level: "text-sm px-3 py-1" },
    lg: { score: "text-6xl", level: "text-base px-4 py-1.5" },
  };
  const s = sizes[size];

  return (
    <div className="flex flex-col items-center justify-center gap-2 text-center">
      {label && <p className="text-sm text-default-500 uppercase tracking-wide">{label}</p>}
      <div className={cn("font-bold text-default-900 leading-none", s.score)}>
        {displayScore}
        <span className="text-default-400 text-base font-normal ms-1">/ 5.00</span>
      </div>
      <span className={cn("inline-flex rounded-full border font-medium", s.level, colorClass)}>
        {displayLevel}
      </span>
    </div>
  );
}
