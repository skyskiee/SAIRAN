import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScoreGauge } from "@/components/sairan/score-gauge";
import { StatusBadge } from "@/components/sairan/status-badge";
import { serverApi, DIMENSIONS, levelColor } from "@/lib/sairan-api";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SairanDashboard() {
  const assessments = await serverApi.listAssessments().catch(() => []);
  const completed = assessments.filter((a) => a.status === "COMPLETED");
  const latest = completed[0];
  const inProgress = assessments.find((a) => a.status === "IN_PROGRESS" || a.status === "DRAFT");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-default-900">Dashboard</h1>
          <p className="text-sm text-default-500 mt-1">
            Overview of your organization&rsquo;s AI readiness assessments.
          </p>
        </div>
        <Link href="/sairan/assessments/new">
          <Button>Start New Assessment</Button>
        </Link>
      </div>

      {/* Top summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-default-500 font-normal">Latest overall score</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {latest ? (
              <ScoreGauge score={latest.overall_score} level={latest.overall_level} size="md" />
            ) : (
              <p className="text-sm text-default-500">No completed assessments yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-default-500 font-normal">Continue where you left off</CardTitle>
          </CardHeader>
          <CardContent>
            {inProgress ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-medium text-default-900">{inProgress.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge status={inProgress.status} />
                      <span className="text-xs text-default-500">
                        {inProgress.completion_percentage}% complete
                      </span>
                    </div>
                  </div>
                  <Link href={`/sairan/assessments/${inProgress.id}/questionnaire`}>
                    <Button variant="outline">Continue</Button>
                  </Link>
                </div>
                <Progress value={inProgress.completion_percentage} className="h-2" />
              </div>
            ) : (
              <p className="text-sm text-default-500">
                No assessments in progress. Click &ldquo;Start New Assessment&rdquo; to begin.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dimension cards from latest completed */}
      {latest?.dimension_scores && (
        <div>
          <h2 className="text-lg font-semibold text-default-900 mb-3">Dimension scores</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {DIMENSIONS.map((dim) => {
              const d = latest.dimension_scores![dim];
              if (!d) return null;
              return (
                <Card key={dim}>
                  <CardContent className="p-4">
                    <p className="text-xs text-default-500 uppercase tracking-wide mb-2">{dim}</p>
                    <p className="text-2xl font-bold text-default-900 tabular-nums">
                      {d.score.toFixed(2)}
                    </p>
                    <span
                      className={cn(
                        "inline-flex mt-2 rounded-full border px-2 py-0.5 text-xs font-medium",
                        levelColor(d.level),
                      )}
                    >
                      {d.level}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="mt-4">
            <Link
              href={`/sairan/assessments/${latest.id}/results`}
              className="text-sm text-primary hover:underline"
            >
              View full results →
            </Link>
          </div>
        </div>
      )}

      {/* Recent assessments table */}
      <div>
        <h2 className="text-lg font-semibold text-default-900 mb-3">Recent assessments</h2>
        <Card>
          <CardContent className="p-0">
            {assessments.length === 0 ? (
              <p className="p-6 text-sm text-default-500">No assessments yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-default-50 text-default-700">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Name</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Completion</th>
                    <th className="text-left px-4 py-3 font-medium">Overall</th>
                    <th className="text-right px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-default-200">
                  {assessments.slice(0, 5).map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-3 font-medium text-default-900">{a.name}</td>
                      <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                      <td className="px-4 py-3 text-default-600">{a.completion_percentage}%</td>
                      <td className="px-4 py-3 text-default-600">
                        {a.overall_score != null
                          ? `${a.overall_score.toFixed(2)} · ${a.overall_level}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {a.status === "COMPLETED" ? (
                          <Link
                            href={`/sairan/assessments/${a.id}/results`}
                            className="text-primary hover:underline"
                          >
                            View results
                          </Link>
                        ) : (
                          <Link
                            href={`/sairan/assessments/${a.id}/questionnaire`}
                            className="text-primary hover:underline"
                          >
                            Continue
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
