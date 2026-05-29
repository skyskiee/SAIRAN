import { cn } from "@/lib/utils";
import type { Recommendation } from "@/lib/sairan-api";

const priorityStyle: Record<string, string> = {
  "Priority Action": "bg-rose-50 border-rose-200 text-rose-800",
  "Suggested Improvement": "bg-amber-50 border-amber-200 text-amber-800",
  "Opportunity for Enhancement": "bg-sky-50 border-sky-200 text-sky-800",
};

export function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <div className="border border-default-200 rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
        <h3 className="font-semibold text-default-900 text-base">{rec.title}</h3>
        <span
          className={cn(
            "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
            priorityStyle[rec.priority] || "bg-default-100 border-default-200",
          )}
        >
          {rec.priority}
        </span>
      </div>
      <p className="text-sm text-default-600 mb-3">{rec.description}</p>
      <div className="text-xs text-default-500">
        Dimension: <span className="font-medium text-default-700">{rec.dimension}</span>
      </div>
    </div>
  );
}
