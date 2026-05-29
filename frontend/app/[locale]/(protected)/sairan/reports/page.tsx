import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreGauge } from "@/components/sairan/score-gauge";
import { serverApi } from "@/lib/sairan-api";

export const dynamic = "force-dynamic";

export default async function ReportsListPage() {
  const assessments = await serverApi.listAssessments().catch(() => []);
  const completed = assessments.filter((a) => a.status === "COMPLETED");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-default-900">Reports</h1>
        <p className="text-sm text-default-500 mt-1">
          Reports are available once an assessment is submitted.
        </p>
      </div>

      {completed.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-default-600 flex flex-wrap items-center justify-between gap-3">
            <span>You don&rsquo;t have any completed assessments yet.</span>
            <Link href="/sairan/assessments/new">
              <Button>Start an assessment</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {completed.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-5 space-y-4">
                <div>
                  <p className="font-medium text-default-900">{a.name}</p>
                  <p className="text-xs text-default-500 mt-0.5">
                    Submitted{" "}
                    {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div className="py-3 border-y border-default-200">
                  <ScoreGauge score={a.overall_score} level={a.overall_level} size="sm" />
                </div>
                <div className="flex gap-2">
                  <Link href={`/sairan/assessments/${a.id}/report`} className="flex-1">
                    <Button fullWidth>View report</Button>
                  </Link>
                  <Link href={`/sairan/assessments/${a.id}/results`} className="flex-1">
                    <Button variant="outline" fullWidth>Results</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
