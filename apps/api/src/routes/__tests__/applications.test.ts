import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createApp,
  registerAndLogin,
  cleanupUser,
  authed,
  uniqueEmail,
} from "../../test/helpers.js";

const app = createApp();
let cookies = "";
const email = uniqueEmail("apps");

beforeAll(async () => {
  cookies = await registerAndLogin(app, email);
});

afterAll(async () => {
  await cleanupUser(email);
});

async function createApp_(
  overrides: Record<string, unknown> = {},
): Promise<{ id: string }> {
  const res = await authed(app, cookies, "/api/applications", {
    method: "POST",
    body: JSON.stringify({
      company: "Acme",
      role: "Engineer",
      status: "APPLIED",
      ...overrides,
    }),
  });
  return res.json();
}

describe("GET /api/applications", () => {
  it("returns 200 with an array", async () => {
    const res = await authed(app, cookies, "/api/applications");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("returns 401 without auth", async () => {
    const res = await app.request("/api/applications");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/applications", () => {
  it("creates an application and returns it", async () => {
    const res = await authed(app, cookies, "/api/applications", {
      method: "POST",
      body: JSON.stringify({
        company: "OpenAI",
        role: "SWE",
        status: "APPLIED",
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.company).toBe("OpenAI");
    expect(body.status).toBe("APPLIED");
  });

  it("returns 400 for missing required fields", async () => {
    const res = await authed(app, cookies, "/api/applications", {
      method: "POST",
      body: JSON.stringify({ role: "SWE" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/applications/:id", () => {
  it("returns the application", async () => {
    const created = await createApp_({ company: "GetCo" });
    const res = await authed(app, cookies, `/api/applications/${created.id}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(created.id);
  });

  it("returns 404 for non-existent id", async () => {
    const res = await authed(
      app,
      cookies,
      "/api/applications/00000000-0000-0000-0000-000000000000",
    );
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/applications/:id", () => {
  it("updates fields", async () => {
    const created = await createApp_({ company: "PatchMe" });
    const res = await authed(app, cookies, `/api/applications/${created.id}`, {
      method: "PATCH",
      body: JSON.stringify({ role: "Updated Role" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.role).toBe("Updated Role");
  });

  it("rejects invalid status transitions", async () => {
    const created = await createApp_({ status: "APPLIED" });
    const res = await authed(app, cookies, `/api/applications/${created.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "ACCEPTED" }),
    });
    expect(res.status).toBe(400);
  });

  it("allows valid status transitions", async () => {
    const created = await createApp_({ status: "APPLIED" });
    const res = await authed(app, cookies, `/api/applications/${created.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "PHONE" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("PHONE");
  });
});

describe("DELETE /api/applications/:id", () => {
  it("soft-deletes and returns 204", async () => {
    const created = await createApp_({ company: "DeleteMe" });
    const res = await authed(app, cookies, `/api/applications/${created.id}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(204);

    const check = await authed(app, cookies, `/api/applications/${created.id}`);
    expect(check.status).toBe(404);
  });
});

describe("GET /api/applications/:id/questions", () => {
  it("returns empty array when no questions linked", async () => {
    const created = await createApp_({ company: "QLinkedCo" });
    const res = await authed(
      app,
      cookies,
      `/api/applications/${created.id}/questions`,
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("returns linked questions after linking", async () => {
    const created = await createApp_({ company: "QLinkedCo2" });

    const qRes = await authed(app, cookies, "/api/questions", {
      method: "POST",
      body: JSON.stringify({ content: "Linked Q", difficulty: "easy" }),
    });
    const { id: questionId } = await qRes.json();

    await authed(app, cookies, `/api/questions/${questionId}/link`, {
      method: "POST",
      body: JSON.stringify({ applicationId: created.id }),
    });

    const res = await authed(
      app,
      cookies,
      `/api/applications/${created.id}/questions`,
    );
    expect(res.status).toBe(200);
    const body: { id: string }[] = await res.json();
    expect(body.some((q) => q.id === questionId)).toBe(true);
  });
});

describe("DELETE /api/applications/:id/questions/:questionId", () => {
  it("unlinks a question", async () => {
    const created = await createApp_({ company: "UnlinkCo" });

    const qRes = await authed(app, cookies, "/api/questions", {
      method: "POST",
      body: JSON.stringify({ content: "To unlink", difficulty: "medium" }),
    });
    const { id: questionId } = await qRes.json();

    await authed(app, cookies, `/api/questions/${questionId}/link`, {
      method: "POST",
      body: JSON.stringify({ applicationId: created.id }),
    });

    const del = await authed(
      app,
      cookies,
      `/api/applications/${created.id}/questions/${questionId}`,
      { method: "DELETE" },
    );
    expect(del.status).toBe(200);

    const list = await authed(
      app,
      cookies,
      `/api/applications/${created.id}/questions`,
    );
    const body: { id: string }[] = await list.json();
    expect(body.find((q) => q.id === questionId)).toBeUndefined();
  });
});
