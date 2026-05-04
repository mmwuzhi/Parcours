import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type { Question } from "@/lib/types";

export function useQuestions() {
  return useQuery<Question[]>({
    queryKey: ["questions"],
    queryFn: () => apiFetch("/api/questions"),
  });
}

export function useCreateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      content: string;
      answer?: string;
      tags?: string[];
      difficulty?: "easy" | "medium" | "hard";
      sourceCompany?: string;
    }) =>
      apiFetch<Question>("/api/questions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questions"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      content?: string;
      answer?: string | null;
      difficulty?: "easy" | "medium" | "hard";
      sourceCompany?: string | null;
    }) =>
      apiFetch<Question>(`/api/questions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questions"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/questions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questions"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
