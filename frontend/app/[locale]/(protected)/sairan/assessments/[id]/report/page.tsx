import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreGauge } from "@/components/sairan/score-gauge";
import { RadarChart } from "@/components/sairan/radar-chart";
import { DimensionScoresTable } from "@/components/sairan/dimension-scores-table";
import { RecommendationCard } from "@/components/sairan/recommendation-card";
import { PrintButton } from "@/components/sairan/print-button";
import { serverApi } from "@/lib/sairan-api";

export const dynamic = "force-dynamic";

export default async function ReportPreviewPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const report = await serverApi.getReport(id).catch(() => null);
  if (!report) notFound();

  const org = report.organization.organization_name;
  const date = report.assessment.assessment_date;
  const reportId = report.report_metadata.report_id;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold text-default-900">Report Preview</h1>
          <p className="text-sm text-default-500 mt-1">
            Review below, then print or save as PDF using your browser (Ctrl/Cmd + P).
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/sairan/assessments/${id}/results`}>
            <Button variant="outline">Back to results</Button>
          </Link>
          <PrintButton />
        </div>
      </div>

      {/* Printable report */}
      <div className="bg-white border border-default-200 rounded-lg p-10 space-y-10 print:border-0 print:p-0">
        {/* Cover */}
        <section className="text-center py-10 border-b border-default-200">
          <div className="inline-block bg-primary/10 text-primary font-bold text-2xl rounded-lg px-4 py-2 mb-6">
            SAIRAN
          </div>
          <h2 className="text-3xl font-bold text-default-900 mb-2">
            AI Readiness Assessment Report
          </h2>
          <p className="text-default-500 mb-8">Assessment of Organizational Readiness for AI</p>
          <div className="inline-block text-start space-y-1 text-sm">
            <p><span className="text-default-500">Organization:</span> <span className="font-medium text-default-900">{org}</span></p>
            <p><span className="text-default-500">Assessment date:</span> <span className="font-medium text-default-900">{date}</span></p>
            <p><span className="text-default-500">Report ID:</span> <span className="font-mono text-default-900">{reportId}</span></p>
          </div>
          <p className="mt-8 text-xs text-default-400">Generated using SAIRAN Platform</p>
        </section>

        {/* Executive Summary */}
        <section>
          <h2 className="text-xl font-bold text-default-900 mb-4 border-b border-default-200 pb-2">
            Executive Summary
          </h2>
          <p className="text-default-700 leading-relaxed mb-6">{report.executive_summary.text}</p>
          <div className="bg-default-50 border border-default-200 rounded-lg p-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-default-500 uppercase tracking-wide">Overall readiness</p>
              <p className="text-sm text-default-600 mt-2 max-w-md">
                {report.readiness_scores.overall_narrative}
              </p>
            </div>
            <ScoreGauge
              score={report.readiness_scores.overall_score}
              level={report.readiness_scores.overall_readiness_level}
              size="md"
            />
          </div>
        </section>

        {/* Readiness Scores */}
        <section>
          <h2 className="text-xl font-bold text-default-900 mb-4 border-b border-default-200 pb-2">
            Readiness Scores
          </h2>
          <div className="mb-6">
            <RadarChart
              dimensionScores={Object.fromEntries(
                report.dimension_analysis.map((d: any) => [
                  d.dimension_name,
                  { score: d.score, level: d.readiness_level, code: d.dimension_code },
                ]),
              )}
              height={320}
            />
          </div>
          <DimensionScoresTable
            dimensionScores={Object.fromEntries(
              report.dimension_analysis.map((d: any) => [
                d.dimension_name,
                { score: d.score, level: d.readiness_level, code: d.dimension_code },
              ]),
            )}
          />
        </section>

        {/* Dimension Analysis */}
        <section>
          <h2 className="text-xl font-bold text-default-900 mb-4 border-b border-default-200 pb-2">
            Dimension Analysis
          </h2>
          <div className="space-y-4">
            {report.dimension_analysis.map((d: any) => (
              <div key={d.dimension_code} className="border border-default-200 rounded-lg p-5">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <h3 className="font-semibold text-default-900">{d.dimension_name}</h3>
                  <p className="text-sm text-default-600">
                    Score: <span className="font-bold text-default-900">{d.score.toFixed(2)}</span>{" "}
                    · Level: <span className="font-medium">{d.readiness_level}</span>
                  </p>
                </div>
                <p className="text-sm text-default-600 mb-2"><strong>Description.</strong> {d.description}</p>
                <p className="text-sm text-default-600"><strong>Interpretation.</strong> {d.interpretation}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Recommendations */}
        {report.recommendations.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-default-900 mb-4 border-b border-default-200 pb-2">
              Recommendations
            </h2>
            <p className="text-sm text-default-600 mb-4">
              Recommended actions derived from assessment responses. Intended as guidance for
              organizational priorities.
            </p>
            <div className="space-y-3">
              {report.recommendations.map((rec: any) => (
                <RecommendationCard key={rec.id} rec={rec} />
              ))}
            </div>
          </section>
        )}

        {/* Methodology */}
        <section>
          <h2 className="text-xl font-bold text-default-900 mb-4 border-b border-default-200 pb-2">
            Methodology
          </h2>
          <p className="text-sm text-default-700 leading-relaxed whitespace-pre-line">
            {report.methodology_note.text}
          </p>
        </section>

        {/* Disclaimer */}
        <section>
          <h2 className="text-xl font-bold text-default-900 mb-4 border-b border-default-200 pb-2">
            Disclaimer
          </h2>
          <p className="text-sm text-default-600 leading-relaxed">{report.disclaimer.text}</p>
        </section>

        <section className="text-center text-xs text-default-400 pt-4 border-t border-default-200">
          Report generated using SAIRAN Platform · {reportId}
        </section>
      </div>
    </div>
  );
}

