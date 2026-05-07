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
const email = uniqueEmail("questions");

beforeAll(async () => {
  cookies = await registerAndLogin(app, email);
});

afterAll(async () => {
  await cleanupUser(email);
});

describe("GET /api/questions", () => {
  it("returns 200 with an array", async () => {
    const res = await authed(app, cookies, "/api/questions");
    expect(res.status).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });
});

describe("POST /api/questions", () => {
  it("creates a question", async () => {
    const res = await authed(app, cookies, "/api/questions", {
      method: "POST",
      body: JSON.stringify({
        content: "Tell me about yourself",
        difficulty: "easy",
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.content).toBe("Tell me about yourself");
    expect(body.difficulty).toBe("easy");
  });

  it("returns 400 for missing content", async () => {
    const res = await authed(app, cookies, "/api/questions", {
      method: "POST",
      body: JSON.stringify({ difficulty: "easy" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/questions/:id", () => {
  it("updates a question", async () => {
    const create = await authed(app, cookies, "/api/questions", {
      method: "POST",
      body: JSON.stringify({ content: "Original", difficulty: "easy" }),
    });
    const { id } = await create.json();

    const res = await authed(app, cookies, `/api/questions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ content: "Updated", difficulty: "hard" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.content).toBe("Updated");
    expect(body.difficulty).toBe("hard");
  });
});

describe("DELETE /api/questions/:id", () => {
  it("soft-deletes and removes from list", async () => {
    const create = await authed(app, cookies, "/api/questions", {
      method: "POST",
      body: JSON.stringify({ content: "Delete me", difficulty: "medium" }),
    });
    const { id } = await create.json();

    const del = await authed(app, cookies, `/api/questions/${id}`, {
      method: "DELETE",
    });
    expect(del.status).toBe(204);

    const list = await authed(app, cookies, "/api/questions");
    const questions: { id: string }[] = await list.json();
    expect(questions.find((q) => q.id === id)).toBeUndefined();
  });
});
