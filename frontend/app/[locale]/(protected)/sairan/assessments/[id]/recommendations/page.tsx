import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RecommendationCard } from "@/components/sairan/recommendation-card";
import { serverApi, DIMENSIONS, type Recommendation } from "@/lib/sairan-api";

export const dynamic = "force-dynamic";

const PRIORITY_ORDER = ["Priority Action", "Suggested Improvement", "Opportunity for Enhancement"];

export default async function RecommendationsPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const [assessment, recs] = await Promise.all([
    serverApi.getAssessment(id).catch(() => null),
    serverApi.getRecommendations(id).catch(() => []),
  ]);
  if (!assessment) notFound();

  // Group by priority for display
  const byPriority: Record<string, Recommendation[]> = {};
  for (const r of recs) (byPriority[r.priority] ??= []).push(r);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-default-900">Recommendations</h1>
          <p className="text-sm text-default-500 mt-1">
            {assessment.name} · {recs.length} recommended action{recs.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/sairan/assessments/${id}/results`}>
            <Button variant="outline">Back to results</Button>
          </Link>
          <Link href={`/sairan/assessments/${id}/report`}>
            <Button>Generate report</Button>
          </Link>
        </div>
      </div>

      {recs.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-default-600">
            No recommendations were generated for this assessment — every dimension shows solid
            readiness. Keep monitoring and reassess periodically.
          </CardContent>
        </Card>
      )}

      {PRIORITY_ORDER.map((priority) => {
        const items = byPriority[priority];
        if (!items || items.length === 0) return null;
        return (
          <div key={priority}>
            <h2 className="text-lg font-semibold text-default-900 mb-3">
              {priority}{" "}
              <span className="text-default-400 font-normal">({items.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((r) => (
                <RecommendationCard key={r.id} rec={r} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Dimension filter summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">By dimension</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {DIMENSIONS.map((dim) => {
              const count = recs.filter((r) => r.dimension === dim).length;
              return (
                <span
                  key={dim}
                  className="inline-flex items-center gap-2 rounded-full border border-default-200 bg-default-50 px-3 py-1 text-xs"
                >
                  <span className="font-medium text-default-700">{dim}</span>
                  <span className="text-default-500">{count}</span>
                </span>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
