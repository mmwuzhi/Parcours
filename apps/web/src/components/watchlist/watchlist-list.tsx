"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  useWatchlist,
  useCreateWatchlist,
  useDeleteWatchlist,
} from "@/hooks/use-watchlist";
import type { WatchlistItem } from "@/lib/types";

function isSafeUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

const createSchema = z.object({
  company: z.string().min(1, "Required"),
  role: z.string().min(1, "Required"),
  jdUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  salaryRange: z.string().optional(),
  notes: z.string().optional(),
});
type CreateForm = z.infer<typeof createSchema>;

export function WatchlistList() {
  const { data: items = [], isLoading, isError } = useWatchlist();
  const createItem = useCreateWatchlist();
  const deleteItem = useDeleteWatchlist();
  const [showModal, setShowModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  });

  async function onSubmit(form: CreateForm) {
    try {
      await createItem.mutateAsync({
        ...form,
        jdUrl: form.jdUrl || undefined,
        salaryRange: form.salaryRange || undefined,
        notes: form.notes || undefined,
      });
      toast.success("Added to watchlist");
      reset();
      setShowModal(false);
    } catch {
      toast.error("Failed to add item");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteItem.mutateAsync(id);
      toast.success("Removed");
    } catch {
      toast.error("Failed to remove");
    }
  }

  return (
    <div style={{ padding: "24px 28px" }}>
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
            Watchlist
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            Companies and roles to keep an eye on
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
          Add to watchlist
        </button>
      </div>

      {isLoading && (
        <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading…</div>
      )}

      {isError && (
        <div style={{ color: "var(--danger)", fontSize: 14 }}>
          Failed to load watchlist. Check your connection and refresh.
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 24px",
            color: "var(--text-muted)",
            fontSize: 14,
            border: "1px dashed var(--border)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          No items yet. Add a company or role you want to track.
        </div>
      )}

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 14,
        }}
      >
        {items.map((item) => (
          <WatchlistCard
            key={item.id}
            item={item}
            onDelete={() => handleDelete(item.id)}
          />
        ))}
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
            Add to watchlist
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
                placeholder="Staff Engineer"
                style={inputStyle}
              />
            </FormField>
            <FormField label="Job posting URL" error={errors.jdUrl?.message}>
              <input
                {...register("jdUrl")}
                placeholder="https://…"
                style={inputStyle}
              />
            </FormField>
            <FormField label="Salary range">
              <input
                {...register("salaryRange")}
                placeholder="e.g. $150k–$200k"
                style={inputStyle}
              />
            </FormField>
            <FormField label="Notes">
              <textarea
                {...register("notes")}
                placeholder="Why you're watching…"
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
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

function WatchlistCard({
  item,
  onDelete,
}: {
  item: WatchlistItem;
  onDelete: () => void;
}) {
  const score = item.fitAnalysis?.overallScore;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
            {item.company}
          </div>
          <div
            style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}
          >
            {item.role}
          </div>
        </div>
        <button
          onClick={onDelete}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            display: "flex",
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {item.salaryRange && (
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {item.salaryRange}
        </div>
      )}

      {score != null && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 600,
            background:
              score >= 70
                ? "oklch(0.92 0.08 145)"
                : score >= 50
                  ? "oklch(0.93 0.08 75)"
                  : "oklch(0.93 0.05 25)",
            color:
              score >= 70
                ? "oklch(0.35 0.14 145)"
                : score >= 50
                  ? "oklch(0.42 0.15 75)"
                  : "oklch(0.40 0.16 25)",
            padding: "2px 8px",
            borderRadius: 100,
          }}
        >
          Fit: {score}/100
        </div>
      )}

      {item.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {item.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 10,
                fontWeight: 500,
                background: "var(--primary-subtle)",
                color: "var(--primary)",
                padding: "1px 7px",
                borderRadius: 100,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {item.jdUrl && isSafeUrl(item.jdUrl) && (
        <a
          href={item.jdUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            color: "var(--primary-light)",
            textDecoration: "none",
            marginTop: 2,
          }}
        >
          <ExternalLink size={11} />
          Job posting
        </a>
      )}
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
          maxWidth: 460,
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
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
