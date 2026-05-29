import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RecommendationCard } from "@/components/sairan/recommendation-card";
import { serverApi, type Recommendation } from "@/lib/sairan-api";

export const dynamic = "force-dynamic";

export default async function AllRecommendationsPage() {
  const assessments = await serverApi.listAssessments().catch(() => []);
  const completed = assessments.filter((a) => a.status === "COMPLETED");

  // Pull recommendations from every completed assessment, labeled by assessment
  const all = await Promise.all(
    completed.map(async (a) => ({
      assessment: a,
      recs: await serverApi.getRecommendations(a.id).catch(() => [] as Recommendation[]),
    })),
  );

  const totalRecs = all.reduce((sum, x) => sum + x.recs.length, 0);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold text-default-900">Recommendations</h1>
        <p className="text-sm text-default-500 mt-1">
          Prioritized improvement actions across your completed assessments.
        </p>
      </div>

      {completed.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-default-600 flex flex-wrap gap-3 items-center justify-between">
            <span>You don&rsquo;t have any completed assessments yet.</span>
            <Link href="/sairan/assessments/new">
              <Button>Start an assessment</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {completed.length > 0 && totalRecs === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-default-600">
            No recommendations were generated — your completed assessments show solid readiness
            across all dimensions.
          </CardContent>
        </Card>
      )}

      {all.map(({ assessment, recs }) => {
        if (recs.length === 0) return null;
        return (
          <div key={assessment.id}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="text-lg font-semibold text-default-900">
                {assessment.name}{" "}
                <span className="text-default-400 font-normal">({recs.length})</span>
              </h2>
              <Link
                href={`/sairan/assessments/${assessment.id}/recommendations`}
                className="text-sm text-primary hover:underline"
              >
                View full list →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recs.slice(0, 4).map((r) => (
                <RecommendationCard key={r.id} rec={r} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
