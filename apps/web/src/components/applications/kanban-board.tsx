"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import {
  useApplications,
  useCreateApplication,
} from "@/hooks/use-applications";
import { ApplicationCard } from "./application-card";
import type { Application, ApplicationStatus } from "@/lib/types";

const ACTIVE_COLS: { status: ApplicationStatus; label: string }[] = [
  { status: "APPLIED", label: "Applied" },
  { status: "PHONE", label: "Phone" },
  { status: "TECHNICAL", label: "Technical" },
  { status: "ONSITE", label: "On-site" },
  { status: "OFFER", label: "Offer" },
  { status: "ACCEPTED", label: "Accepted" },
];

const TERMINAL_COLS: { status: ApplicationStatus; label: string }[] = [
  { status: "REJECTED", label: "Rejected" },
  { status: "WITHDRAWN", label: "Withdrawn" },
];

const createSchema = z.object({
  company: z.string().min(1, "Required"),
  role: z.string().min(1, "Required"),
  salaryRange: z.string().optional(),
});
type CreateForm = z.infer<typeof createSchema>;

export function KanbanBoard() {
  const router = useRouter();
  const { data, isLoading, isError } = useApplications({ limit: 200 });
  const createApp = useCreateApplication();
  const [showModal, setShowModal] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  });

  const apps = data?.data ?? [];
  const byStatus = (status: ApplicationStatus) =>
    apps.filter((a) => a.status === status);

  async function onSubmit(form: CreateForm) {
    try {
      await createApp.mutateAsync(form);
      toast.success("Application added");
      reset();
      setShowModal(false);
    } catch {
      toast.error("Failed to add application");
    }
  }

  if (isLoading) {
    return (
      <div style={{ padding: 32, color: "var(--text-muted)", fontSize: 14 }}>
        Loading…
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: 32, color: "var(--danger)", fontSize: 14 }}>
        Failed to load applications. Check your connection and refresh.
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 28px", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text)",
            }}
          >
            Applications
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            {data?.total ?? 0} total
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            background: "var(--primary)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
          }}
        >
          <Plus size={14} />
          Add application
        </button>
      </div>

      {/* Active columns */}
      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          paddingBottom: 8,
          minHeight: 0,
        }}
      >
        {ACTIVE_COLS.map((col) => (
          <Column
            key={col.status}
            label={col.label}
            status={col.status}
            apps={byStatus(col.status)}
            onCardClick={(id) => router.push(`/applications/${id}`)}
          />
        ))}
      </div>

      {/* Terminal toggle */}
      <div style={{ marginTop: 20 }}>
        <button
          onClick={() => setShowTerminal((v) => !v)}
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 0",
          }}
        >
          {showTerminal ? "▾" : "▸"} Closed (
          {byStatus("REJECTED").length + byStatus("WITHDRAWN").length})
        </button>

        {showTerminal && (
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 12,
              overflowX: "auto",
            }}
          >
            {TERMINAL_COLS.map((col) => (
              <Column
                key={col.status}
                label={col.label}
                status={col.status}
                apps={byStatus(col.status)}
                onCardClick={(id) => router.push(`/applications/${id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add modal */}
      {showModal && (
        <Modal
          onClose={() => {
            setShowModal(false);
            reset();
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
            Add application
          </h2>
          <form
            onSubmit={handleSubmit(onSubmit)}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <FormField label="Company *" error={errors.company?.message}>
              <input
                {...register("company")}
                placeholder="Acme Corp"
                style={inputStyle}
                autoFocus
              />
            </FormField>
            <FormField label="Role *" error={errors.role?.message}>
              <input
                {...register("role")}
                placeholder="Software Engineer"
                style={inputStyle}
              />
            </FormField>
            <FormField label="Salary range">
              <input
                {...register("salaryRange")}
                placeholder="e.g. $120k–$150k"
                style={inputStyle}
              />
            </FormField>
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
                onClick={() => {
                  setShowModal(false);
                  reset();
                }}
                style={{
                  ...btnStyle,
                  background: "var(--surface-2)",
                  color: "var(--text)",
                }}
              >
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} style={btnStyle}>
                {isSubmitting ? "Adding…" : "Add"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Column({
  label,
  status,
  apps,
  onCardClick,
}: {
  label: string;
  status: ApplicationStatus;
  apps: Application[];
  onCardClick: (id: string) => void;
}) {
  return (
    <div
      style={{
        minWidth: 220,
        width: 220,
        flexShrink: 0,
        background: "var(--surface-2)",
        borderRadius: "var(--radius)",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      {/* Column header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color:
              apps.length > 0 ? "var(--primary-light)" : "var(--text-muted)",
            background:
              apps.length > 0 ? "var(--primary-subtle)" : "transparent",
            padding: "1px 7px",
            borderRadius: 100,
          }}
        >
          {apps.length}
        </span>
      </div>

      {/* Cards */}
      <div
        style={{
          padding: "10px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxHeight: "60vh",
          overflowY: "auto",
        }}
      >
        {apps.length === 0 && (
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              padding: "8px 4px",
              textAlign: "center",
            }}
          >
            No applications
          </div>
        )}
        {apps.map((app) => (
          <ApplicationCard
            key={app.id}
            app={app}
            onClick={() => onCardClick(app.id)}
          />
        ))}
      </div>
    </div>
  );
}

function Modal({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
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
        {children}
      </div>
    </div>
  );
}

function FormField({
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
