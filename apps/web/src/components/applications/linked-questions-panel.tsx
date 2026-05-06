"use client";

import { useState } from "react";
import { Link2, Unlink, X, Search } from "lucide-react";
import {
  useApplicationQuestions,
  useLinkQuestion,
  useUnlinkQuestion,
} from "@/hooks/use-questions";
import { useQuestions } from "@/hooks/use-questions";
import type { LinkedQuestion } from "@/lib/types";

const DIFF_STYLE: Record<string, { bg: string; color: string }> = {
  easy: { bg: "oklch(0.92 0.08 145)", color: "oklch(0.35 0.14 145)" },
  medium: { bg: "oklch(0.93 0.08 75)", color: "oklch(0.42 0.15 75)" },
  hard: { bg: "oklch(0.93 0.05 25)", color: "oklch(0.40 0.16 25)" },
};

export function LinkedQuestionsPanel({ appId }: { appId: string }) {
  const { data: linked = [], isLoading } = useApplicationQuestions(appId);
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div style={{ marginTop: 32 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <h2
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "var(--text)",
            letterSpacing: "-0.01em",
          }}
        >
          Linked questions
          {linked.length > 0 && (
            <span
              style={{
                marginLeft: 7,
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-muted)",
              }}
            >
              {linked.length}
            </span>
          )}
        </h2>
        <button
          onClick={() => setShowPicker(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 600,
            color: "#fff",
            background: "var(--primary)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
          }}
        >
          <Link2 size={12} />
          Link question
        </button>
      </div>

      {isLoading && (
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading…</div>
      )}

      {!isLoading && linked.length === 0 && (
        <div
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
            padding: "20px 0",
            fontStyle: "italic",
          }}
        >
          No questions linked yet.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {linked.map((q) => (
          <LinkedQuestionRow key={q.id} question={q} appId={appId} />
        ))}
      </div>

      {showPicker && (
        <QuestionPickerModal
          appId={appId}
          linkedIds={new Set(linked.map((q) => q.id))}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

function LinkedQuestionRow({
  question,
  appId,
}: {
  question: LinkedQuestion;
  appId: string;
}) {
  const unlink = useUnlinkQuestion(appId);
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const diff = DIFF_STYLE[question.difficulty] ?? DIFF_STYLE.medium;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 13,
          color: "var(--text)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {question.content}
      </div>

      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          background: diff.bg,
          color: diff.color,
          padding: "2px 7px",
          borderRadius: 100,
          flexShrink: 0,
        }}
      >
        {question.difficulty}
      </span>

      {confirmUnlink ? (
        <>
          <span
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              flexShrink: 0,
            }}
          >
            Unlink?
          </span>
          <button
            onClick={() => unlink.mutate(question.id)}
            disabled={unlink.isPending}
            style={iconBtnDanger}
          >
            Yes
          </button>
          <button onClick={() => setConfirmUnlink(false)} style={iconBtn}>
            No
          </button>
        </>
      ) : (
        <button
          onClick={() => setConfirmUnlink(true)}
          style={iconBtn}
          title="Unlink"
        >
          <Unlink size={12} />
        </button>
      )}
    </div>
  );
}

function QuestionPickerModal({
  appId,
  linkedIds,
  onClose,
}: {
  appId: string;
  linkedIds: Set<string>;
  onClose: () => void;
}) {
  const { data: allQuestions = [] } = useQuestions();
  const link = useLinkQuestion(appId);
  const [search, setSearch] = useState("");

  const available = allQuestions.filter(
    (q) =>
      !linkedIds.has(q.id) &&
      q.content.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleLink(questionId: string) {
    await link.mutateAsync(questionId);
    onClose();
  }

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
          padding: 24,
          width: "100%",
          maxWidth: 520,
          position: "relative",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
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

        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>
          Link a question
        </h2>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 10px",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            marginBottom: 12,
          }}
        >
          <Search size={13} color="var(--text-muted)" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions…"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 13,
              color: "var(--text)",
            }}
          />
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {available.length === 0 && (
            <div
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                padding: "16px 0",
                textAlign: "center",
              }}
            >
              {allQuestions.length === 0
                ? "No questions in your bank yet."
                : "All questions already linked."}
            </div>
          )}
          {available.map((q) => {
            const diff = DIFF_STYLE[q.difficulty] ?? DIFF_STYLE.medium;
            return (
              <button
                key={q.id}
                onClick={() => handleLink(q.id)}
                disabled={link.isPending}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "10px 8px",
                  background: "none",
                  border: "none",
                  borderBottom: "1px solid var(--border)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: "var(--text)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {q.content}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    background: diff.bg,
                    color: diff.color,
                    padding: "2px 7px",
                    borderRadius: 100,
                    flexShrink: 0,
                  }}
                >
                  {q.difficulty}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "4px 6px",
  background: "none",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  cursor: "pointer",
  color: "var(--text-muted)",
  flexShrink: 0,
};

const iconBtnDanger: React.CSSProperties = {
  ...iconBtn,
  color: "var(--danger)",
  borderColor: "var(--danger)",
  fontSize: 12,
};
