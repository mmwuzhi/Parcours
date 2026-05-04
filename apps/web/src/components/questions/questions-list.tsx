"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X, ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useQuestions,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
} from "@/hooks/use-questions";
import type { Question } from "@/lib/types";

const questionSchema = z.object({
  content: z.string().min(1, "Required"),
  answer: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  sourceCompany: z.string().optional(),
});
type QuestionForm = z.infer<typeof questionSchema>;

export function QuestionsList() {
  const { data: questions = [], isLoading, isError } = useQuestions();
  const createQ = useCreateQuestion();
  const updateQ = useUpdateQuestion();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function handleCreate(form: QuestionForm) {
    try {
      await createQ.mutateAsync({
        ...form,
        answer: form.answer || undefined,
        sourceCompany: form.sourceCompany || undefined,
      });
      toast.success("Question added");
      setShowAddModal(false);
    } catch {
      // onError in hook handles toast
    }
  }

  async function handleEdit(form: QuestionForm) {
    if (!editingQuestion) return;
    try {
      await updateQ.mutateAsync({
        id: editingQuestion.id,
        content: form.content,
        answer: form.answer || null,
        difficulty: form.difficulty,
        sourceCompany: form.sourceCompany || null,
      });
      toast.success("Saved");
      setEditingQuestion(null);
    } catch {
      // onError in hook handles toast
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
            Questions
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            {questions.length} saved
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
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
          Add question
        </button>
      </div>

      {isLoading && (
        <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading…</div>
      )}

      {isError && (
        <div style={{ color: "var(--danger)", fontSize: 14 }}>
          Failed to load questions. Check your connection and refresh.
        </div>
      )}

      {!isLoading && questions.length === 0 && (
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
          No questions yet. Add interview questions to build your bank.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {questions.map((q) => (
          <QuestionRow
            key={q.id}
            question={q}
            expanded={expanded === q.id}
            onToggle={() => setExpanded(expanded === q.id ? null : q.id)}
            onEdit={() => setEditingQuestion(q)}
          />
        ))}
      </div>

      {showAddModal && (
        <QuestionModal
          title="Add question"
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreate}
        />
      )}

      {editingQuestion && (
        <QuestionModal
          title="Edit question"
          defaultValues={{
            content: editingQuestion.content,
            answer: editingQuestion.answer ?? "",
            difficulty: editingQuestion.difficulty,
            sourceCompany: editingQuestion.sourceCompany ?? "",
          }}
          onClose={() => setEditingQuestion(null)}
          onSubmit={handleEdit}
        />
      )}
    </div>
  );
}

function QuestionRow({
  question,
  expanded,
  onToggle,
  onEdit,
}: {
  question: Question;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const deleteQ = useDeleteQuestion();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
      }}
    >
      {/* Row header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 16px",
          gap: 12,
        }}
      >
        {/* Clickable content area */}
        <button
          onClick={onToggle}
          style={{
            flex: 1,
            minWidth: 0,
            background: "none",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            padding: 0,
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: "var(--text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: expanded ? "normal" : "nowrap",
            }}
          >
            {question.content}
          </div>
        </button>

        {/* Right side: badges + actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          {question.sourceCompany && (
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {question.sourceCompany}
            </span>
          )}
          <span className={`diff-${question.difficulty}`} style={badgeStyle}>
            {question.difficulty}
          </span>

          {confirmDelete ? (
            <>
              <span style={{ fontSize: 12, color: "var(--danger)" }}>
                Delete?
              </span>
              <button
                onClick={() => deleteQ.mutate(question.id)}
                style={iconBtnDanger}
              >
                Yes
              </button>
              <button onClick={() => setConfirmDelete(false)} style={iconBtn}>
                No
              </button>
            </>
          ) : (
            <>
              <button onClick={onEdit} style={iconBtn} title="Edit">
                <Pencil size={12} />
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                style={iconBtn}
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            </>
          )}

          <button
            onClick={onToggle}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 2,
              display: "flex",
            }}
          >
            {expanded ? (
              <ChevronUp size={14} color="var(--text-muted)" />
            ) : (
              <ChevronDown size={14} color="var(--text-muted)" />
            )}
          </button>
        </div>
      </div>

      {expanded && question.answer && (
        <div
          style={{
            padding: "12px 16px 14px",
            fontSize: 13,
            color: "var(--text-muted)",
            borderTop: "1px solid var(--border)",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}
        >
          {question.answer}
        </div>
      )}

      {expanded && !question.answer && (
        <div
          style={{
            padding: "12px 16px 14px",
            fontSize: 12,
            color: "var(--text-muted)",
            borderTop: "1px solid var(--border)",
            fontStyle: "italic",
          }}
        >
          No answer recorded yet.
        </div>
      )}
    </div>
  );
}

function QuestionModal({
  title,
  defaultValues,
  onClose,
  onSubmit,
}: {
  title: string;
  defaultValues?: Partial<QuestionForm>;
  onClose: () => void;
  onSubmit: (form: QuestionForm) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<QuestionForm>({
    resolver: zodResolver(questionSchema),
    defaultValues: { difficulty: "medium", ...defaultValues },
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
          maxWidth: 500,
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
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
          {title}
        </h2>
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <FormField label="Question *" error={errors.content?.message}>
            <textarea
              {...register("content")}
              placeholder="What is the question?"
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
              autoFocus
            />
          </FormField>
          <FormField label="Answer (optional)">
            <textarea
              {...register("answer")}
              placeholder="Your answer or notes…"
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </FormField>
          <div style={{ display: "flex", gap: 12 }}>
            <FormField label="Difficulty">
              <select {...register("difficulty")} style={inputStyle}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </FormField>
            <FormField label="Source company">
              <input
                {...register("sourceCompany")}
                placeholder="Google"
                style={inputStyle}
              />
            </FormField>
          </div>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
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

const badgeStyle: React.CSSProperties = {
  display: "inline-block",
  fontSize: 10,
  fontWeight: 600,
  padding: "2px 7px",
  borderRadius: 100,
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
