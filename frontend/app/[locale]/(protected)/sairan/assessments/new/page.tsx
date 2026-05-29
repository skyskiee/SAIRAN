"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clientApi } from "@/lib/sairan-api";

const DEFAULT_NAME = `AI Readiness Assessment ${new Date().getFullYear()}`;

export default function NewAssessmentPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [name, setName] = useState(DEFAULT_NAME);
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Please enter an assessment name.");
      return;
    }
    startTransition(async () => {
      try {
        const created = await clientApi.createAssessment((session as any)?.accessToken, name.trim());
        toast.success("Assessment created. Let's begin.");
        router.push(`/sairan/assessments/${created.id}/questionnaire`);
      } catch (e: any) {
        toast.error(e.message || "Failed to create assessment.");
      }
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-default-900">Start a new assessment</h1>
        <p className="text-sm text-default-500 mt-1">
          Give your assessment a clear name — for example,
          &ldquo;AI Readiness Baseline {new Date().getFullYear()}&rdquo;.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessment details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Assessment name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="AI Readiness Baseline 2026"
            />
          </div>
          <div className="bg-default-50 border border-default-200 rounded-lg p-4 text-sm text-default-600">
            <p className="font-medium text-default-800 mb-1">What to expect</p>
            <ul className="list-disc ms-5 space-y-1">
              <li>25 questions across 5 dimensions (People, Process, Technology, Ecosystem, Governance)</li>
              <li>Your answers save automatically — you can pause and resume</li>
              <li>Scoring happens after submission and cannot be edited afterward</li>
            </ul>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => router.back()} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isPending}>
              {isPending ? "Creating…" : "Create & start"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
