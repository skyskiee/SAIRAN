import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreGauge } from "@/components/sairan/score-gauge";
import { RadarChart } from "@/components/sairan/radar-chart";
import { DimensionScoresTable } from "@/components/sairan/dimension-scores-table";
import { StatusBadge } from "@/components/sairan/status-badge";
import { serverApi, DIMENSIONS, levelColor } from "@/lib/sairan-api";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const DIMENSION_DESCRIPTIONS: Record<string, string> = {
  People: "Evaluates roles, competencies, and awareness supporting responsible AI adoption.",
  Process: "Evaluates structured procedures supporting consistent AI-related practices.",
  Technology: "Evaluates technical safeguards supporting reliability, security, and performance of AI systems.",
  Ecosystem: "Evaluates external relationships, dependencies, and collaboration relevant to AI readiness.",
  Governance: "Evaluates oversight structures guiding responsible AI-related decision-making.",
};

function levelNarrative(level: string | null) {
  if (level === "Basic")
    return "The organization is at an early stage of AI readiness, with limited or inconsistent practices across key dimensions.";
  if (level === "Developing")
    return "The organization has emerging readiness foundations, with several structured practices in place but notable gaps remaining.";
  if (level === "Advanced")
    return "The organization demonstrates established and structured practices across major AI readiness dimensions, with evidence of governance and operational maturity.";
  return "";
}

export default async function ResultsPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const assessment = await serverApi.getAssessment(id).catch(() => null);
  if (!assessment) notFound();

  if (assessment.status !== "COMPLETED") {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-2xl font-semibold text-default-900">Results not available yet</h1>
        <p className="text-default-600">
          This assessment is still in progress. Complete and submit the questionnaire to see results.
        </p>
        <Link href={`/sairan/assessments/${id}/questionnaire`}>
          <Button>Continue assessment</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-default-900">{assessment.name}</h1>
          <div className="mt-2 flex items-center gap-2 flex-wrap text-sm text-default-500">
            <StatusBadge status={assessment.status} />
            <span>·</span>
            <span>
              Submitted{" "}
              {assessment.submitted_at
                ? new Date(assessment.submitted_at).toLocaleDateString()
                : "—"}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/sairan/assessments/${id}/recommendations`}>
            <Button variant="outline">View recommendations</Button>
          </Link>
          <Link href={`/sairan/assessments/${id}/report`}>
            <Button>Generate report</Button>
          </Link>
        </div>
      </div>

      {/* Overall results + radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Overall readiness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScoreGauge score={assessment.overall_score} level={assessment.overall_level} size="lg" />
            <p className="text-sm text-default-600 leading-relaxed text-center">
              {levelNarrative(assessment.overall_level)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Readiness across dimensions</CardTitle>
          </CardHeader>
          <CardContent>
            <RadarChart dimensionScores={assessment.dimension_scores} />
          </CardContent>
        </Card>
      </div>

      {/* Dimension scores table */}
      <div>
        <h2 className="text-lg font-semibold text-default-900 mb-3">Dimension scores</h2>
        <DimensionScoresTable dimensionScores={assessment.dimension_scores} />
      </div>

      {/* Per-dimension detail cards */}
      <div>
        <h2 className="text-lg font-semibold text-default-900 mb-3">Dimension analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DIMENSIONS.map((dim) => {
            const d = assessment.dimension_scores?.[dim];
            if (!d) return null;
            return (
              <Card key={dim}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-semibold text-default-900">{dim}</h3>
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        levelColor(d.level),
                      )}
                    >
                      {d.level}
                    </span>
                  </div>
                  <p className="text-3xl font-bold tabular-nums text-default-900 mb-2">
                    {d.score.toFixed(2)}
                    <span className="text-sm text-default-400 font-normal ms-1">/ 5.00</span>
                  </p>
                  <p className="text-sm text-default-600">{DIMENSION_DESCRIPTIONS[dim]}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
