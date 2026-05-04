"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  X,
  Trash2,
  ExternalLink,
  Pencil,
  Sparkles,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useWatchlist,
  useCreateWatchlist,
  useUpdateWatchlist,
  useDeleteWatchlist,
  useApplyWatchlist,
  analyzeWatchlistItem,
} from "@/hooks/use-watchlist";
import type { WatchlistItem, FitAnalysis } from "@/lib/types";

function isSafeUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

const itemSchema = z.object({
  company: z.string().min(1, "Required"),
  role: z.string().min(1, "Required"),
  jdUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  salaryRange: z.string().optional(),
  notes: z.string().optional(),
});
type ItemForm = z.infer<typeof itemSchema>;

export function WatchlistList() {
  const { data: items = [], isLoading, isError } = useWatchlist();
  const createItem = useCreateWatchlist();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<WatchlistItem | null>(null);

  async function handleCreate(form: ItemForm) {
    await createItem.mutateAsync({
      ...form,
      jdUrl: form.jdUrl || undefined,
      salaryRange: form.salaryRange || undefined,
      notes: form.notes || undefined,
    });
    toast.success("Added to watchlist");
    setShowModal(false);
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
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 14,
        }}
      >
        {items.map((item) => (
          <WatchlistCard
            key={item.id}
            item={item}
            onEdit={() => setEditingItem(item)}
          />
        ))}
      </div>

      {showModal && (
        <ItemModal
          title="Add to watchlist"
          onClose={() => setShowModal(false)}
          onSubmit={handleCreate}
        />
      )}

      {editingItem && (
        <ItemModal
          title="Edit item"
          defaultValues={{
            company: editingItem.company,
            role: editingItem.role,
            jdUrl: editingItem.jdUrl ?? "",
            salaryRange: editingItem.salaryRange ?? "",
            notes: editingItem.notes ?? "",
          }}
          itemId={editingItem.id}
          onClose={() => setEditingItem(null)}
          onSubmit={async () => {
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}

function WatchlistCard({
  item,
  onEdit,
}: {
  item: WatchlistItem;
  onEdit: () => void;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const deleteItem = useDeleteWatchlist();
  const applyItem = useApplyWatchlist();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmApply, setConfirmApply] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const score = item.fitAnalysis?.overallScore;

  async function handleAnalyze() {
    setAnalyzing(true);
    await analyzeWatchlistItem(
      item.id,
      () => {
        qc.invalidateQueries({ queryKey: ["watchlist"] });
        setAnalyzing(false);
        setShowAnalysis(true);
        toast.success("Analysis complete");
      },
      (msg) => {
        setAnalyzing(false);
        toast.error(msg);
      },
    );
  }

  async function handleApply() {
    const result = await applyItem.mutateAsync(item.id);
    toast.success("Application created");
    router.push(`/applications/${result.applicationId}`);
  }

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* Top row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
            {item.company}
          </div>
          <div
            style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}
          >
            {item.role}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button onClick={onEdit} style={iconBtn} title="Edit">
            <Pencil size={12} />
          </button>
          {confirmDelete ? (
            <>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--danger)",
                  alignSelf: "center",
                }}
              >
                Delete?
              </span>
              <button
                onClick={() => deleteItem.mutate(item.id)}
                style={iconBtnDanger}
              >
                Yes
              </button>
              <button onClick={() => setConfirmDelete(false)} style={iconBtn}>
                No
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              style={iconBtn}
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {item.salaryRange && (
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {item.salaryRange}
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
          }}
        >
          <ExternalLink size={11} />
          Job posting
        </a>
      )}

      {/* Fit score badge */}
      {score != null && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
          <button
            onClick={() => setShowAnalysis((v) => !v)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 2,
              display: "flex",
              color: "var(--text-muted)",
            }}
          >
            {showAnalysis ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      )}

      {/* Expanded fit analysis */}
      {showAnalysis && item.fitAnalysis && (
        <FitAnalysisPanel analysis={item.fitAnalysis} />
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          style={{
            ...actionBtn,
            flex: 1,
            opacity: analyzing ? 0.7 : 1,
          }}
        >
          <Sparkles size={12} />
          {analyzing
            ? "Analyzing…"
            : item.fitAnalysis
              ? "Re-analyze"
              : "Analyze fit"}
        </button>

        {confirmApply ? (
          <>
            <button
              onClick={handleApply}
              disabled={applyItem.isPending}
              style={{ ...actionBtnPrimary, flex: 1 }}
            >
              {applyItem.isPending ? "Applying…" : "Confirm apply"}
            </button>
            <button onClick={() => setConfirmApply(false)} style={actionBtn}>
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmApply(true)}
            style={{ ...actionBtnPrimary, flex: 1 }}
          >
            <Send size={12} />
            Apply
          </button>
        )}
      </div>
    </div>
  );
}

function FitAnalysisPanel({ analysis }: { analysis: FitAnalysis }) {
  const salaryColor: Record<string, string> = {
    good: "oklch(0.35 0.14 145)",
    ok: "oklch(0.42 0.15 75)",
    low: "oklch(0.40 0.16 25)",
    unknown: "var(--text-muted)",
  };

  return (
    <div
      style={{
        borderTop: "1px solid var(--border)",
        paddingTop: 10,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        fontSize: 12,
      }}
    >
      {analysis.recommendation && (
        <p style={{ color: "var(--text)", lineHeight: 1.5, margin: 0 }}>
          {analysis.recommendation}
        </p>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: 11,
            color: salaryColor[analysis.salaryFit] ?? "var(--text-muted)",
          }}
        >
          Salary: {analysis.salaryFit}
        </span>
      </div>

      {analysis.skillsMatch.matched.length > 0 && (
        <SkillGroup
          label="Matched"
          skills={analysis.skillsMatch.matched}
          color="oklch(0.35 0.14 145)"
          bg="oklch(0.92 0.08 145)"
        />
      )}
      {analysis.skillsMatch.partial.length > 0 && (
        <SkillGroup
          label="Partial"
          skills={analysis.skillsMatch.partial}
          color="oklch(0.42 0.15 75)"
          bg="oklch(0.93 0.08 75)"
        />
      )}
      {analysis.skillsMatch.missing.length > 0 && (
        <SkillGroup
          label="Missing"
          skills={analysis.skillsMatch.missing}
          color="oklch(0.40 0.16 25)"
          bg="oklch(0.93 0.05 25)"
        />
      )}

      {analysis.highlights.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-muted)",
              marginBottom: 3,
            }}
          >
            Highlights
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: 16,
              color: "var(--text)",
              lineHeight: 1.6,
            }}
          >
            {analysis.highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.concerns.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-muted)",
              marginBottom: 3,
            }}
          >
            Concerns
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: 16,
              color: "var(--text)",
              lineHeight: 1.6,
            }}
          >
            {analysis.concerns.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
        {analysis.provider} / {analysis.model}
      </div>
    </div>
  );
}

function SkillGroup({
  label,
  skills,
  color,
  bg,
}: {
  label: string;
  skills: string[];
  color: string;
  bg: string;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--text-muted)",
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {skills.map((s) => (
          <span
            key={s}
            style={{
              fontSize: 10,
              fontWeight: 500,
              background: bg,
              color,
              padding: "1px 7px",
              borderRadius: 100,
            }}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

function ItemModal({
  title,
  defaultValues,
  itemId,
  onClose,
  onSubmit,
}: {
  title: string;
  defaultValues?: Partial<ItemForm>;
  itemId?: string;
  onClose: () => void;
  onSubmit: (form: ItemForm) => Promise<void>;
}) {
  const updateItem = useUpdateWatchlist();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
    defaultValues,
  });

  async function onFormSubmit(form: ItemForm) {
    if (itemId) {
      await updateItem.mutateAsync({
        id: itemId,
        company: form.company,
        role: form.role,
        jdUrl: form.jdUrl || null,
        salaryRange: form.salaryRange || null,
        notes: form.notes || null,
      });
      toast.success("Saved");
    }
    await onSubmit(form);
  }

  return (
    <Modal onClose={onClose}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
        {title}
      </h2>
      <form
        onSubmit={handleSubmit(onFormSubmit)}
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
    </Modal>
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
  padding: "4px 6px",
  background: "none",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  cursor: "pointer",
  color: "var(--text-muted)",
};

const iconBtnDanger: React.CSSProperties = {
  ...iconBtn,
  color: "var(--danger)",
  borderColor: "var(--danger)",
  fontSize: 12,
};

const actionBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 5,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 500,
  background: "none",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  cursor: "pointer",
  color: "var(--text-muted)",
};

const actionBtnPrimary: React.CSSProperties = {
  ...actionBtn,
  background: "var(--primary)",
  border: "1px solid var(--primary)",
  color: "#fff",
};
