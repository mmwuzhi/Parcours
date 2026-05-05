import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type { WatchlistItem } from "@/lib/types";

export function useWatchlist() {
  return useQuery<WatchlistItem[]>({
    queryKey: ["watchlist"],
    queryFn: () => apiFetch("/api/watchlist"),
  });
}

export function useCreateWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      company: string;
      role: string;
      jdUrl?: string;
      jdText?: string;
      salaryRange?: string;
      tags?: string[];
      notes?: string;
    }) =>
      apiFetch<WatchlistItem>("/api/watchlist", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["watchlist"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      company?: string;
      role?: string;
      jdUrl?: string | null;
      jdText?: string | null;
      salaryRange?: string | null;
      notes?: string | null;
    }) =>
      apiFetch<WatchlistItem>(`/api/watchlist/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["watchlist"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/watchlist/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["watchlist"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useApplyWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ applicationId: string }>(`/api/watchlist/${id}/apply`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["watchlist"] });
      qc.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export async function analyzeWatchlistItem(
  id: string,
  onDone: () => void,
  onError: (msg: string) => void,
): Promise<void> {
  try {
    const res = await fetch(`/api/watchlist/${id}/analyze`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "Request failed");
      onError(text);
      return;
    }
    const reader = res.body.getReader();
    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }
    onDone();
  } catch (err) {
    onError(err instanceof Error ? err.message : "Analysis failed");
  }
}
