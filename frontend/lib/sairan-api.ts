/**
 * SAIRAN API client.
 *
 * Use `serverApi(...)` in server components / server actions — it reads the
 * session token via `auth()`. Use `clientApi(...)` in client components and
 * pass the access token (from `useSession`) explicitly.
 */
import { auth } from "@/lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "http://localhost:8000/api/v1";

// ---------- Types ----------
export type Role = "ORG_USER" | "ORG_ADMIN" | "SYSTEM_ADMIN";

export interface Question {
  id: number;
  question_code: string;
  dimension: string;
  sub_dimension: string | null;
  text: string;
  help_text: string | null;
  answer_type: string;
  answer_options: { value: string; score: number; label?: string }[];
  weight: number;
  required: boolean;
  is_active: boolean;
  order_index: number;
}

export interface ResponseItem {
  id: number;
  question_id: number;
  answer_value: string;
  answer_score: number;
}

export interface Assessment {
  id: number;
  name: string;
  organization_id: number;
  status: "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED";
  questionnaire_version: string;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  overall_score: number | null;
  overall_level: "Basic" | "Developing" | "Advanced" | null;
  dimension_scores: Record<string, { score: number; level: string; code: string }> | null;
  completion_percentage: number;
}

export interface AssessmentDetail extends Assessment {
  responses: ResponseItem[];
}

export interface Recommendation {
  id: number;
  title: string;
  dimension: string;
  priority: "Priority Action" | "Suggested Improvement" | "Opportunity for Enhancement";
  description: string;
}

export interface Organization {
  id: number;
  name: string;
  industry: string | null;
  size: string | null;
}

// ---------- Core fetch helper ----------
async function request<T>(
  path: string,
  token: string | undefined,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    let detail: string;
    try {
      detail = (await res.json()).detail ?? res.statusText;
    } catch {
      detail = res.statusText;
    }
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------- Mock data for development ----------
const MOCK_ASSESSMENTS: Assessment[] = [
  {
    id: 1,
    name: "AI Readiness Baseline 2026",
    organization_id: 1,
    status: "COMPLETED",
    questionnaire_version: "1.0",
    created_at: "2026-05-15T10:00:00Z",
    updated_at: "2026-05-20T15:30:00Z",
    submitted_at: "2026-05-20T15:30:00Z",
    overall_score: 45,
    overall_level: "Basic",
    dimension_scores: {
      People: { score: 40, level: "Basic", code: "PPL" },
      Process: { score: 35, level: "Basic", code: "PRC" },
      Technology: { score: 50, level: "Basic", code: "TEC" },
      Ecosystem: { score: 45, level: "Basic", code: "ECO" },
      Governance: { score: 50, level: "Basic", code: "GOV" },
    },
    completion_percentage: 100,
  },
  {
    id: 2,
    name: "AI Readiness Baseline 2026",
    organization_id: 2,
    status: "COMPLETED",
    questionnaire_version: "1.0",
    created_at: "2026-05-16T10:00:00Z",
    updated_at: "2026-05-21T14:20:00Z",
    submitted_at: "2026-05-21T14:20:00Z",
    overall_score: 62,
    overall_level: "Developing",
    dimension_scores: {
      People: { score: 60, level: "Developing", code: "PPL" },
      Process: { score: 65, level: "Developing", code: "PRC" },
      Technology: { score: 70, level: "Developing", code: "TEC" },
      Ecosystem: { score: 58, level: "Developing", code: "ECO" },
      Governance: { score: 60, level: "Developing", code: "GOV" },
    },
    completion_percentage: 100,
  },
  {
    id: 3,
    name: "AI Readiness Baseline 2026",
    organization_id: 3,
    status: "IN_PROGRESS",
    questionnaire_version: "1.0",
    created_at: "2026-05-18T10:00:00Z",
    updated_at: "2026-05-22T09:15:00Z",
    submitted_at: null,
    overall_score: null,
    overall_level: null,
    dimension_scores: null,
    completion_percentage: 65,
  },
];

// ---------- Server-side API (uses session from next-auth) ----------
async function withToken(): Promise<string | undefined> {
  const session = await auth();
  return (session as any)?.accessToken;
}

export const serverApi = {
  me: async () => request<any>("/auth/me", await withToken()),
  listAssessments: async () => {
    try {
      return await request<Assessment[]>("/assessments", await withToken());
    } catch (error) {
      // Fallback to mock data if API fails
      console.warn("API unavailable, using mock data:", error);
      return MOCK_ASSESSMENTS;
    }
  },
  getAssessment: async (id: number) =>
    request<AssessmentDetail>(`/assessments/${id}`, await withToken()),
  listQuestions: async () =>
    request<Question[]>("/questions", await withToken()),
  getRecommendations: async (id: number) =>
    request<Recommendation[]>(
      `/assessments/${id}/recommendations`,
      await withToken(),
    ),
  getReport: async (id: number) =>
    request<any>(`/reports/${id}`, await withToken()),
  listOrganizations: async () =>
    request<Organization[]>("/organizations", await withToken()),
};

// ---------- Client-side API (takes token from useSession) ----------
export const clientApi = {
  createAssessment: (token: string | undefined, name: string) =>
    request<Assessment>("/assessments", token, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  saveResponse: (
    token: string | undefined,
    assessmentId: number,
    questionId: number,
    answerValue: string,
  ) =>
    request<ResponseItem>(
      `/assessments/${assessmentId}/responses/${questionId}`,
      token,
      {
        method: "PUT",
        body: JSON.stringify({ question_id: questionId, answer_value: answerValue }),
      },
    ),
  submitAssessment: (token: string | undefined, assessmentId: number) =>
    request<Assessment>(`/assessments/${assessmentId}/submit`, token, {
      method: "POST",
    }),
  getAssessment: (token: string | undefined, id: number) =>
    request<AssessmentDetail>(`/assessments/${id}`, token),
  listQuestions: (token: string | undefined) =>
    request<Question[]>("/questions", token),
};

// ---------- Shared helpers ----------
export const DIMENSIONS = [
  "People",
  "Process",
  "Technology",
  "Ecosystem",
  "Governance",
] as const;

export function levelColor(level: string | null | undefined): string {
  if (level === "Advanced") return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (level === "Developing") return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-rose-600 bg-rose-50 border-rose-200"; // Basic
}

export function statusLabel(status: string): string {
  return {
    DRAFT: "Draft",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    ARCHIVED: "Archived",
  }[status] || status;
}

export function statusBadgeClass(status: string): string {
  return {
    DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
    IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ARCHIVED: "bg-zinc-100 text-zinc-600 border-zinc-200",
  }[status] || "bg-slate-100 text-slate-700 border-slate-200";
}
