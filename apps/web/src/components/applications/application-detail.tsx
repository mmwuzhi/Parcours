"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { STATUS_TRANSITIONS } from "@parcours/shared";
import {
  useUpdateApplication,
  useDeleteApplication,
} from "@/hooks/use-applications";
import type { Application, ApplicationStatus } from "@/lib/types";

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  APPLIED: "Applied",
  PHONE: "Phone Screen",
  TECHNICAL: "Technical",
  ONSITE: "On-site",
  OFFER: "Offer",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

const editSchema = z.object({
  company: z.string().min(1, "Required"),
  role: z.string().min(1, "Required"),
  status: z.string(),
  salaryRange: z.string().optional(),
  jdUrl: z.string().optional(),
  notes: z.string().optional(),
});
type EditForm = z.infer<typeof editSchema>;

export function ApplicationDetail({ app }: { app: Application }) {
  const router = useRouter();
  const updateApp = useUpdateApplication();
  const deleteApp = useDeleteApplication();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      company: app.company,
      role: app.role,
      status: app.status,
      salaryRange: app.salaryRange ?? "",
      jdUrl: app.jdUrl ?? "",
      notes: app.notes ?? "",
    },
  });

  const validNextStatuses =
    STATUS_TRANSITIONS[app.status as ApplicationStatus] ?? [];
  const statusOptions: ApplicationStatus[] = [app.status, ...validNextStatuses];

  async function onSubmit(form: EditForm) {
    try {
      await updateApp.mutateAsync({
        id: app.id,
        company: form.company,
        role: form.role,
        status: form.status as ApplicationStatus,
        salaryRange: form.salaryRange || null,
        jdUrl: form.jdUrl || null,
        notes: form.notes || null,
      });
      toast.success("Saved");
    } catch {
      // onError in hook handles toast
    }
  }

  async function handleDelete() {
    try {
      await deleteApp.mutateAsync(app.id);
      router.push("/applications");
    } catch {
      // onError in hook handles toast
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          <FormField
            label="Company *"
            error={errors.company?.message}
            style={{ flex: 1 }}
          >
            <input {...register("company")} style={inputStyle} />
          </FormField>
          <FormField
            label="Role *"
            error={errors.role?.message}
            style={{ flex: 1 }}
          >
            <input {...register("role")} style={inputStyle} />
          </FormField>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <FormField label="Status" style={{ flex: 1 }}>
            <select {...register("status")} style={inputStyle}>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Salary range" style={{ flex: 1 }}>
            <input
              {...register("salaryRange")}
              placeholder="e.g. $120k–$150k"
              style={inputStyle}
            />
          </FormField>
        </div>

        <FormField label="Job posting URL">
          <input
            {...register("jdUrl")}
            placeholder="https://…"
            style={inputStyle}
          />
        </FormField>

        <FormField label="Notes">
          <textarea
            {...register("notes")}
            rows={4}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </FormField>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 4,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                style={{
                  ...btnStyle,
                  background: "transparent",
                  color: "var(--danger)",
                  border: "1px solid var(--danger)",
                }}
              >
                Delete
              </button>
            ) : (
              <>
                <span style={{ fontSize: 13, color: "var(--danger)" }}>
                  Delete this application?
                </span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteApp.isPending}
                  style={{ ...btnStyle, background: "var(--danger)" }}
                >
                  {deleteApp.isPending ? "Deleting…" : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  style={{
                    ...btnStyle,
                    background: "var(--surface-2)",
                    color: "var(--text)",
                  }}
                >
                  Cancel
                </button>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            style={{
              ...btnStyle,
              opacity: isSubmitting || !isDirty ? 0.5 : 1,
            }}
          >
            {isSubmitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({
  label,
  error,
  style,
  children,
}: {
  label: string;
  error?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, ...style }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>
        {label}
      </label>
      {children}
      {error && (
        <span style={{ fontSize: 12, color: "var(--danger)" }}>{error}</span>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 11px",
  fontSize: 14,
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  background: "var(--surface)",
  color: "var(--text)",
  outline: "none",
  boxSizing: "border-box",
};

const btnStyle: React.CSSProperties = {
  padding: "8px 16px",
  fontSize: 13,
  fontWeight: 600,
  color: "#fff",
  background: "var(--primary)",
  border: "none",
  borderRadius: "var(--radius-sm)",
  cursor: "pointer",
};
