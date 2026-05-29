"use client";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RechartsRadar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface Props {
  dimensionScores: Record<string, { score: number; level: string; code: string }> | null;
  height?: number;
}

/**
 * Radar chart across the 5 SAIRAN dimensions. Rendered on the Overall Results
 * screen and in the Report Preview.
 */
export function RadarChart({ dimensionScores, height = 340 }: Props) {
  const data = dimensionScores
    ? ["People", "Process", "Technology", "Ecosystem", "Governance"].map((dim) => ({
        dimension: dim,
        score: dimensionScores[dim]?.score ?? 0,
      }))
    : [];

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <RechartsRadar data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid gridType="polygon" stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12, fill: "#475569" }} />
          <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: number) => [value.toFixed(2), "Score"]}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#0ea5e9"
            fill="#0ea5e9"
            fillOpacity={0.35}
            strokeWidth={2}
          />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
}
