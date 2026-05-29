import { levelColor } from "@/lib/sairan-api";
import { cn } from "@/lib/utils";

interface Props {
  dimensionScores: Record<string, { score: number; level: string; code: string }> | null;
}

export function DimensionScoresTable({ dimensionScores }: Props) {
  if (!dimensionScores) return null;
  const dims = ["People", "Process", "Technology", "Ecosystem", "Governance"];

  return (
    <div className="overflow-x-auto border border-default-200 rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-default-50">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-default-700">Dimension</th>
            <th className="text-right px-4 py-3 font-medium text-default-700">Score</th>
            <th className="text-left px-4 py-3 font-medium text-default-700">Readiness Level</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-default-200">
          {dims.map((dim) => {
            const d = dimensionScores[dim];
            if (!d) return null;
            return (
              <tr key={dim}>
                <td className="px-4 py-3 font-medium text-default-900">{dim}</td>
                <td className="px-4 py-3 text-right tabular-nums text-default-800">
                  {d.score.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      levelColor(d.level),
                    )}
                  >
                    {d.level}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
