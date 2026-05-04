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
const email = uniqueEmail("watchlist");

beforeAll(async () => {
  cookies = await registerAndLogin(app, email);
});

afterAll(async () => {
  await cleanupUser(email);
});

describe("GET /api/watchlist", () => {
  it("returns 200 with an array", async () => {
    const res = await authed(app, cookies, "/api/watchlist");
    expect(res.status).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });
});

describe("POST /api/watchlist", () => {
  it("creates a watchlist item", async () => {
    const res = await authed(app, cookies, "/api/watchlist", {
      method: "POST",
      body: JSON.stringify({ company: "Stripe", role: "SRE" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.company).toBe("Stripe");
  });

  it("returns 400 for missing required fields", async () => {
    const res = await authed(app, cookies, "/api/watchlist", {
      method: "POST",
      body: JSON.stringify({ company: "Stripe" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/watchlist/:id", () => {
  it("updates a watchlist item", async () => {
    const create = await authed(app, cookies, "/api/watchlist", {
      method: "POST",
      body: JSON.stringify({ company: "PatchCo", role: "Engineer" }),
    });
    const { id } = await create.json();

    const res = await authed(app, cookies, `/api/watchlist/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ role: "Senior Engineer" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.role).toBe("Senior Engineer");
  });
});

describe("DELETE /api/watchlist/:id", () => {
  it("soft-deletes and removes from list", async () => {
    const create = await authed(app, cookies, "/api/watchlist", {
      method: "POST",
      body: JSON.stringify({ company: "DeleteCo", role: "Dev" }),
    });
    const { id } = await create.json();

    const del = await authed(app, cookies, `/api/watchlist/${id}`, {
      method: "DELETE",
    });
    expect(del.status).toBe(200);

    const list = await authed(app, cookies, "/api/watchlist");
    const items: { id: string }[] = await list.json();
    expect(items.find((i) => i.id === id)).toBeUndefined();
  });
});

describe("POST /api/watchlist/:id/apply", () => {
  it("creates an application and removes the watchlist item", async () => {
    const create = await authed(app, cookies, "/api/watchlist", {
      method: "POST",
      body: JSON.stringify({ company: "ApplyCo", role: "Infra" }),
    });
    const { id } = await create.json();

    const res = await authed(app, cookies, `/api/watchlist/${id}/apply`, {
      method: "POST",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.applicationId).toBeTruthy();

    const list = await authed(app, cookies, "/api/watchlist");
    const items: { id: string }[] = await list.json();
    expect(items.find((i) => i.id === id)).toBeUndefined();

    const app_ = await authed(
      app,
      cookies,
      `/api/applications/${body.applicationId}`,
    );
    expect(app_.status).toBe(200);
    const appBody = await app_.json();
    expect(appBody.company).toBe("ApplyCo");
    expect(appBody.status).toBe("APPLIED");
  });
});
