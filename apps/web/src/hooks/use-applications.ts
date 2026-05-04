import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type {
  Application,
  ApplicationList,
  ApplicationStatus,
} from "@/lib/types";

export interface ApplicationFilters {
  status?: ApplicationStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export function useApplications(filters: ApplicationFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  return useQuery<ApplicationList>({
    queryKey: [
      "applications",
      filters.status,
      filters.search,
      filters.page,
      filters.limit,
    ],
    queryFn: () => apiFetch(`/api/applications?${params}`),
  });
}

export function useApplication(id: string) {
  return useQuery<Application>({
    queryKey: ["applications", id],
    queryFn: () => apiFetch(`/api/applications/${id}`),
  });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      company: string;
      role: string;
      status?: ApplicationStatus;
      salaryRange?: string;
      jdUrl?: string;
      notes?: string;
    }) =>
      apiFetch<Application>("/api/applications", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      status?: ApplicationStatus;
      company?: string;
      role?: string;
      jdUrl?: string | null;
      salaryRange?: string | null;
      notes?: string | null;
    }) =>
      apiFetch<Application>(`/api/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (app) => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.setQueryData(["applications", app.id], app);
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/applications/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
