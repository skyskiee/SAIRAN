import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { serverApi, DIMENSIONS, type Question } from "@/lib/sairan-api";

export const dynamic = "force-dynamic";

export default async function QuestionBankPage() {
  const session = await auth();
  if ((session as any)?.role !== "SYSTEM_ADMIN") notFound();

  const questions: Question[] = await serverApi.listQuestions().catch(() => [] as Question[]);
  const grouped: Record<string, Question[]> = {};
  for (const q of questions) (grouped[q.dimension] ??= []).push(q);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-default-900">Question Bank</h1>
        <p className="text-sm text-default-500 mt-1">
          {questions.length} active question{questions.length === 1 ? "" : "s"} across{" "}
          {DIMENSIONS.length} dimensions. Edit support will land in a follow-up release.
        </p>
      </div>

      {DIMENSIONS.map((dim) => {
        const qs = grouped[dim] || [];
        if (qs.length === 0) return null;
        return (
          <div key={dim}>
            <h2 className="text-lg font-semibold text-default-900 mb-3">{dim}</h2>
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-default-50 text-default-700">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Code</th>
                      <th className="text-left px-4 py-3 font-medium">Question</th>
                      <th className="text-right px-4 py-3 font-medium">Weight</th>
                      <th className="text-left px-4 py-3 font-medium">Answers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default-200">
                    {qs.map((q) => (
                      <tr key={q.id}>
                        <td className="px-4 py-3 font-mono text-xs text-default-500">
                          {q.question_code}
                        </td>
                        <td className="px-4 py-3 text-default-900">{q.text}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-default-700">
                          {q.weight}
                        </td>
                        <td className="px-4 py-3 text-default-600">
                          {q.answer_options.map((o) => `${o.value} (${o.score})`).join(" · ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
