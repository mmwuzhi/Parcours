"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useApplication } from "@/hooks/use-applications";
import { ApplicationDetail } from "@/components/applications/application-detail";
import { InterviewPanel } from "@/components/applications/interview-panel";

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: app, isLoading, isError } = useApplication(id);

  useEffect(() => {
    if (isError) router.push("/applications");
  }, [isError, router]);

  if (isLoading) {
    return (
      <div style={{ padding: 32, color: "var(--text-muted)", fontSize: 14 }}>
        Loading…
      </div>
    );
  }

  if (!app) return null;

  return (
    <div style={{ padding: "24px 28px", maxWidth: 800 }}>
      <button
        onClick={() => router.push("/applications")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          color: "var(--text-muted)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0 0 20px",
        }}
      >
        <ArrowLeft size={14} />
        All applications
      </button>

      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--text)",
          }}
        >
          {app.company}
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
          {app.role}
        </p>
      </div>

      <ApplicationDetail app={app} />
      <InterviewPanel appId={app.id} />
    </div>
  );
}
