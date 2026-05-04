"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X, Pencil, Trash2 } from "lucide-react";
import {
  useInterviews,
  useCreateInterview,
  useUpdateInterview,
  useDeleteInterview,
} from "@/hooks/use-interviews";
import type { Interview, InterviewOutcome, InterviewType } from "@/lib/types";

const TYPE_LABEL: Record<InterviewType, string> = {
  phone_screen: "Phone Screen",
  technical: "Technical",
  behavioral: "Behavioral",
  system_design: "System Design",
  onsite: "On-site",
};

const OUTCOME_LABEL: Record<InterviewOutcome, string> = {
  pending: "Pending",
  passed: "Passed",
  failed: "Failed",
};

const OUTCOME_COLOR: Record<InterviewOutcome, string> = {
  pending: "var(--text-muted)",
  passed: "#16a34a",
  failed: "var(--danger)",
};

const interviewSchema = z.object({
  type: z.enum([
    "phone_screen",
    "technical",
    "behavioral",
    "system_design",
    "onsite",
  ]),
  scheduledAt: z.string().min(1, "Required"),
  outcome: z.enum(["pending", "passed", "failed"]).optional(),
  notes: z.string().optional(),
});
type InterviewForm = z.infer<typeof interviewSchema>;

function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toISOString(local: string): string {
  return new Date(local).toISOString();
}

export function InterviewPanel({ appId }: { appId: string }) {
  const { data: interviews = [], isLoading } = useInterviews(appId);
  const createInterview = useCreateInterview(appId);
  const updateInterview = useUpdateInterview(appId);
  const deleteInterview = useDeleteInterview(appId);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(
    null,
  );

  const sorted = [...interviews].sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  return (
    <div style={{ marginTop: 40 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
          Interviews {interviews.length > 0 && `(${interviews.length})`}
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "6px 12px",
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            background: "var(--primary)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
          }}
        >
          <Plus size={13} />
          Add
        </button>
      </div>

      {isLoading && (
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading…</p>
      )}

      {!isLoading && sorted.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          No interviews yet.
        </p>
      )}

      {sorted.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {sorted.map((interview) => (
            <InterviewRow
              key={interview.id}
              interview={interview}
              onEdit={() => setEditingInterview(interview)}
              onDelete={() => deleteInterview.mutate(interview.id)}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <InterviewModal
          title="Add interview"
          onClose={() => setShowAddModal(false)}
          onSubmit={async (form) => {
            await createInterview.mutateAsync({
              type: form.type,
              scheduledAt: toISOString(form.scheduledAt),
              outcome: form.outcome,
              notes: form.notes || undefined,
            });
            setShowAddModal(false);
          }}
        />
      )}

      {editingInterview && (
        <InterviewModal
          title="Edit interview"
          defaultValues={{
            type: editingInterview.type,
            scheduledAt: toLocalDatetime(editingInterview.scheduledAt),
            outcome: editingInterview.outcome,
            notes: editingInterview.notes ?? "",
          }}
          onClose={() => setEditingInterview(null)}
          onSubmit={async (form) => {
            await updateInterview.mutateAsync({
              id: editingInterview.id,
              type: form.type,
              scheduledAt: toISOString(form.scheduledAt),
              outcome: form.outcome,
              notes: form.notes || null,
            });
            setEditingInterview(null);
          }}
          showOutcome
        />
      )}
    </div>
  );
}

function InterviewRow({
  interview,
  onEdit,
  onDelete,
}: {
  interview: Interview;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        background: "var(--surface)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
          {TYPE_LABEL[interview.type]}
        </span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {new Date(interview.scheduledAt).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: OUTCOME_COLOR[interview.outcome],
          }}
        >
          {OUTCOME_LABEL[interview.outcome]}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {confirmDelete ? (
          <>
            <span style={{ fontSize: 12, color: "var(--danger)" }}>
              Delete?
            </span>
            <button onClick={onDelete} style={iconBtnDanger}>
              Yes
            </button>
            <button onClick={() => setConfirmDelete(false)} style={iconBtn}>
              No
            </button>
          </>
        ) : (
          <>
            <button onClick={onEdit} style={iconBtn} title="Edit">
              <Pencil size={13} />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              style={iconBtn}
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function InterviewModal({
  title,
  defaultValues,
  onClose,
  onSubmit,
  showOutcome = false,
}: {
  title: string;
  defaultValues?: Partial<InterviewForm>;
  onClose: () => void;
  onSubmit: (form: InterviewForm) => Promise<void>;
  showOutcome?: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InterviewForm>({
    resolver: zodResolver(interviewSchema),
    defaultValues: {
      type: "phone_screen",
      outcome: "pending",
      ...defaultValues,
    },
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: 28,
          width: "100%",
          maxWidth: 440,
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            display: "flex",
          }}
        >
          <X size={16} />
        </button>

        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
          {title}
        </h2>
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <ModalField label="Type" error={errors.type?.message}>
            <select {...register("type")} style={inputStyle}>
              <option value="phone_screen">Phone Screen</option>
              <option value="technical">Technical</option>
              <option value="behavioral">Behavioral</option>
              <option value="system_design">System Design</option>
              <option value="onsite">On-site</option>
            </select>
          </ModalField>

          <ModalField label="Date & time *" error={errors.scheduledAt?.message}>
            <input
              {...register("scheduledAt")}
              type="datetime-local"
              style={inputStyle}
            />
          </ModalField>

          {showOutcome && (
            <ModalField label="Outcome">
              <select {...register("outcome")} style={inputStyle}>
                <option value="pending">Pending</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
              </select>
            </ModalField>
          )}

          <ModalField label="Notes">
            <textarea
              {...register("notes")}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </ModalField>

          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              marginTop: 4,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                ...btnStyle,
                background: "var(--surface-2)",
                color: "var(--text)",
              }}
            >
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} style={btnStyle}>
              {isSubmitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
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

const iconBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "4px 8px",
  background: "none",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  cursor: "pointer",
  color: "var(--text-muted)",
  fontSize: 12,
};

const iconBtnDanger: React.CSSProperties = {
  ...iconBtn,
  color: "var(--danger)",
  borderColor: "var(--danger)",
};
