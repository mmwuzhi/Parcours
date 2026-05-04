"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type { Interview, InterviewOutcome, InterviewType } from "@/lib/types";

export function useInterviews(appId: string) {
  return useQuery<Interview[]>({
    queryKey: ["interviews", appId],
    queryFn: () => apiFetch(`/api/applications/${appId}/interviews`),
  });
}

export function useCreateInterview(appId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      type: InterviewType;
      scheduledAt: string;
      outcome?: InterviewOutcome;
      notes?: string;
    }) =>
      apiFetch<Interview>(`/api/applications/${appId}/interviews`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["interviews", appId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateInterview(appId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      type?: InterviewType;
      scheduledAt?: string;
      outcome?: InterviewOutcome;
      notes?: string | null;
    }) =>
      apiFetch<Interview>(`/api/applications/${appId}/interviews/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["interviews", appId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteInterview(appId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/applications/${appId}/interviews/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["interviews", appId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
