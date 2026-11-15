import { describe, expect, it, vi } from "vitest";

// Without an admin session every new admin route must refuse with 403.
vi.mock("next-auth", () => ({ getServerSession: vi.fn(async () => null) }));
vi.mock("@/lib/customs/presetStore", () => ({
  loadPresets: vi.fn(async () => ({ presets: [], source: "code" })),
  savePreset: vi.fn(async () => ({ ok: true })),
}));

describe("customs-presets route", () => {
  it("returns 403 for GET and PUT without an admin session", async () => {
    const { GET, PUT } = await import("@/app/api/admin/customs-presets/route.js");
    expect((await GET()).status).toBe(403);
    const put = await PUT(new Request("http://x/api/admin/customs-presets", { method: "PUT", body: "{}" }));
    expect(put.status).toBe(403);
  });
});
