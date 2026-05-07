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
let appId = "";
const email = uniqueEmail("interviews");

beforeAll(async () => {
  cookies = await registerAndLogin(app, email);
  const res = await authed(app, cookies, "/api/applications", {
    method: "POST",
    body: JSON.stringify({
      company: "InterviewCo",
      role: "SWE",
      status: "APPLIED",
    }),
  });
  const body = await res.json();
  appId = body.id;
});

afterAll(async () => {
  await cleanupUser(email);
});

const base = () => `/api/applications/${appId}/interviews`;

describe("GET /api/applications/:id/interviews", () => {
  it("returns 200 with an array", async () => {
    const res = await authed(app, cookies, base());
    expect(res.status).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });
});

describe("POST /api/applications/:id/interviews", () => {
  it("creates an interview", async () => {
    const res = await authed(app, cookies, base(), {
      method: "POST",
      body: JSON.stringify({
        type: "phone_screen",
        scheduledAt: new Date().toISOString(),
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.type).toBe("phone_screen");
    expect(body.outcome).toBe("pending");
  });

  it("returns 400 for missing scheduledAt", async () => {
    const res = await authed(app, cookies, base(), {
      method: "POST",
      body: JSON.stringify({ type: "technical" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/applications/:id/interviews/:interviewId", () => {
  it("updates outcome", async () => {
    const create = await authed(app, cookies, base(), {
      method: "POST",
      body: JSON.stringify({
        type: "behavioral",
        scheduledAt: new Date().toISOString(),
      }),
    });
    const { id: interviewId } = await create.json();

    const res = await authed(app, cookies, `${base()}/${interviewId}`, {
      method: "PATCH",
      body: JSON.stringify({ outcome: "passed" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.outcome).toBe("passed");
  });
});

describe("DELETE /api/applications/:id/interviews/:interviewId", () => {
  it("soft-deletes the interview", async () => {
    const create = await authed(app, cookies, base(), {
      method: "POST",
      body: JSON.stringify({
        type: "onsite",
        scheduledAt: new Date().toISOString(),
      }),
    });
    const { id: interviewId } = await create.json();

    const del = await authed(app, cookies, `${base()}/${interviewId}`, {
      method: "DELETE",
    });
    expect(del.status).toBe(204);

    const list = await authed(app, cookies, base());
    const interviews: { id: string }[] = await list.json();
    expect(interviews.find((i) => i.id === interviewId)).toBeUndefined();
  });
});
