"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import {
  type AssessmentDetail,
  type Question,
  DIMENSIONS,
  clientApi,
} from "@/lib/sairan-api";

export default function QuestionnairePage({ params }: { params: { id: string } }) {
  const assessmentId = Number(params.id);
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, startSubmit] = useTransition();
  const [savingId, setSavingId] = useState<number | null>(null);

  // Load questions + assessment on mount
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [qs, a] = await Promise.all([
          clientApi.listQuestions(token),
          clientApi.getAssessment(token, assessmentId),
        ]);
        setQuestions(qs);
        setAssessment(a);
        // Hydrate answers map
        const init: Record<number, string> = {};
        for (const r of a.responses) init[r.question_id] = r.answer_value;
        setAnswers(init);
        // Resume at first unanswered question
        const firstUnanswered = qs.findIndex((q) => !init[q.id]);
        setCurrentIdx(firstUnanswered === -1 ? qs.length - 1 : firstUnanswered);
      } catch (e: any) {
        toast.error(e.message || "Failed to load assessment");
      } finally {
        setLoading(false);
      }
    })();
  }, [assessmentId, token]);

  const grouped = useMemo(() => {
    const map: Record<string, Question[]> = {};
    for (const q of questions) {
      (map[q.dimension] ??= []).push(q);
    }
    return map;
  }, [questions]);

  const currentQuestion = questions[currentIdx];
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const completion = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  const allAnswered = answeredCount === questions.length && questions.length > 0;
  const locked = assessment?.status === "COMPLETED" || assessment?.status === "ARCHIVED";

  const saveAnswer = async (q: Question, value: string) => {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
    if (locked) return;
    setSavingId(q.id);
    try {
      await clientApi.saveResponse(token, assessmentId, q.id, value);
    } catch (e: any) {
      toast.error(e.message || "Failed to save answer");
    } finally {
      setSavingId(null);
    }
  };

  const submit = () => {
    if (!allAnswered) {
      toast.error("Answer all required questions before submitting.");
      return;
    }
    startSubmit(async () => {
      try {
        await clientApi.submitAssessment(token, assessmentId);
        toast.success("Assessment submitted.");
        router.push(`/sairan/assessments/${assessmentId}/results`);
      } catch (e: any) {
        toast.error(e.message || "Submission failed");
      }
    });
  };

  if (loading) {
    return <p className="text-sm text-default-500">Loading assessment…</p>;
  }
  if (!currentQuestion) {
    return <p className="text-sm text-default-500">No questions available.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-default-900">{assessment?.name}</h1>
            <p className="text-sm text-default-500 mt-1">
              Dimension: <span className="font-medium">{currentQuestion.dimension}</span> · Question{" "}
              {currentIdx + 1} of {questions.length}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-default-900">{completion}% complete</p>
            <p className="text-xs text-default-500">{answeredCount} of {questions.length} answered</p>
          </div>
        </div>
        <Progress value={completion} className="h-2 mt-3" />
      </div>

      {/* Dimension step indicator */}
      <div className="flex items-center gap-2 flex-wrap">
        {DIMENSIONS.map((dim) => {
          const dQs = grouped[dim] || [];
          const dAnswered = dQs.filter((q) => answers[q.id]).length;
          const complete = dAnswered === dQs.length && dQs.length > 0;
          const partial = dAnswered > 0 && !complete;
          return (
            <button
              key={dim}
              onClick={() => {
                const firstIdx = questions.findIndex((q) => q.dimension === dim);
                if (firstIdx !== -1) setCurrentIdx(firstIdx);
              }}
              className={cn(
                "px-3 py-1 text-xs rounded-full border transition-colors",
                complete
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : partial
                  ? "bg-amber-50 border-amber-300 text-amber-700"
                  : "bg-default-50 border-default-200 text-default-600",
                currentQuestion.dimension === dim && "ring-2 ring-primary ring-offset-1",
              )}
            >
              {dim} ({dAnswered}/{dQs.length})
            </button>
          );
        })}
      </div>

      {/* Question card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            <span className="text-xs font-mono text-default-400 me-2">{currentQuestion.question_code}</span>
            {currentQuestion.text}
          </CardTitle>
          {currentQuestion.help_text && (
            <p className="text-sm text-default-500 mt-1 flex items-start gap-1.5">
              <Icon icon="heroicons:information-circle" className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{currentQuestion.help_text}</span>
            </p>
          )}
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers[currentQuestion.id] || ""}
            onValueChange={(value) => saveAnswer(currentQuestion, value)}
            disabled={locked}
          >
            {currentQuestion.answer_options.map((opt) => (
              <div
                key={opt.value}
                className={cn(
                  "flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-colors",
                  answers[currentQuestion.id] === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-default-200 hover:border-default-400",
                )}
                onClick={() => !locked && saveAnswer(currentQuestion, opt.value)}
              >
                <RadioGroupItem value={opt.value} id={`opt-${opt.value}`} />
                <Label htmlFor={`opt-${opt.value}`} className="flex-1 cursor-pointer font-normal">
                  {opt.label || opt.value}
                </Label>
                <span className="text-xs text-default-400">score: {opt.score}</span>
              </div>
            ))}
          </RadioGroup>
          {savingId === currentQuestion.id && (
            <p className="text-xs text-default-400 mt-3">Saving…</p>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
        >
          ← Previous
        </Button>
        <div className="flex gap-2">
          {currentIdx < questions.length - 1 && (
            <Button onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}>
              Next →
            </Button>
          )}
          {currentIdx === questions.length - 1 && (
            <Button onClick={submit} disabled={isSubmitting || !allAnswered || locked}>
              {isSubmitting ? "Submitting…" : "Submit assessment"}
            </Button>
          )}
        </div>
      </div>

      {!allAnswered && currentIdx === questions.length - 1 && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          {questions.length - answeredCount} question(s) still need an answer before you can submit.
        </p>
      )}
    </div>
  );
}
