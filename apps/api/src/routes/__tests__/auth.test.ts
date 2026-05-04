import { describe, it, expect, afterAll } from "vitest";
import {
  createApp,
  registerAndLogin,
  cleanupUser,
  uniqueEmail,
} from "../../test/helpers.js";

const app = createApp();
const emails: string[] = [];

afterAll(async () => {
  for (const email of emails) await cleanupUser(email);
});

describe("POST /api/auth/register", () => {
  it("creates a new user and returns 201", async () => {
    const email = uniqueEmail("register");
    emails.push(email);

    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "Test1234!" }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.user.email).toBe(email);
  });

  it("returns 409 when email is already taken", async () => {
    const email = uniqueEmail("dup");
    emails.push(email);

    await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "Test1234!" }),
    });

    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "Test1234!" }),
    });

    expect(res.status).toBe(409);
  });

  it("returns 400 for invalid payload", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", password: "x" }),
    });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("returns cookies on valid credentials", async () => {
    const email = uniqueEmail("login");
    emails.push(email);

    await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "Test1234!" }),
    });

    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "Test1234!" }),
    });

    expect(res.status).toBe(200);
    const cookies = res.headers.getSetCookie?.() ?? [];
    const names = cookies.map((c) => c.split("=")[0]);
    expect(names).toContain("access_token");
    expect(names).toContain("refresh_token");
  });

  it("returns 401 for wrong password", async () => {
    const email = uniqueEmail("wrong-pw");
    emails.push(email);

    await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "Test1234!" }),
    });

    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "WrongPass!" }),
    });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears cookies", async () => {
    const email = uniqueEmail("logout");
    emails.push(email);
    const cookies = await registerAndLogin(app, email);

    const res = await app.request("/api/auth/logout", {
      method: "POST",
      headers: { Cookie: cookies },
    });

    expect(res.status).toBe(200);
    const cleared = res.headers.getSetCookie?.() ?? [];
    const maxAges = cleared.map((c) => c.match(/max-age=(\d+)/i)?.[1]);
    expect(maxAges.some((a) => a === "0")).toBe(true);
  });
});
