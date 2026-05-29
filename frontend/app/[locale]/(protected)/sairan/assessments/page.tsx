import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/sairan/status-badge";
import { serverApi } from "@/lib/sairan-api";

export const dynamic = "force-dynamic";

export default async function AssessmentsListPage() {
  const assessments = await serverApi.listAssessments().catch(() => []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-default-900">My Assessments</h1>
          <p className="text-sm text-default-500 mt-1">
            All AI readiness assessments for your organization.
          </p>
        </div>
        <Link href="/sairan/assessments/new">
          <Button>Start New Assessment</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {assessments.length === 0 ? (
            <p className="p-6 text-sm text-default-500">
              No assessments yet. Click &ldquo;Start New Assessment&rdquo; to create one.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-default-50 text-default-700">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Assessment</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Completion</th>
                  <th className="text-left px-4 py-3 font-medium">Overall score</th>
                  <th className="text-left px-4 py-3 font-medium">Last updated</th>
                  <th className="text-right px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default-200">
                {assessments.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-medium text-default-900">{a.name}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3 text-default-600">{a.completion_percentage}%</td>
                    <td className="px-4 py-3 text-default-600">
                      {a.overall_score != null
                        ? `${a.overall_score.toFixed(2)} · ${a.overall_level}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-default-500">
                      {new Date(a.updated_at).toLocaleDateString()}
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
  );
}
