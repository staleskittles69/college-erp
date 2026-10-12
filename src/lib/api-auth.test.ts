import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// getAuth talks to MongoDB; swap the models for in-memory fakes.
const sessions = new Map<string, { _id: string; userId: string; expiresAt: Date; lastSeenAt: Date }>();
const users = new Map<string, { role: string; mustChangePassword?: boolean }>();

vi.mock("@/lib/db", () => ({ default: vi.fn(async () => undefined) }));
vi.mock("@/models/Session", () => ({
  default: {
    findById: (id: string) => ({ lean: async () => sessions.get(id) ?? null }),
    updateOne: () => ({ catch: () => undefined }),
  },
}));
vi.mock("@/models/User", () => ({
  default: {
    findById: (id: string) => ({ select: () => ({ lean: async () => users.get(id) ?? null }) }),
  },
}));

const { getAuth } = await import("./api-auth");
const { signToken } = await import("./auth");

const USER_ID = "64b000000000000000000001";
const OTHER_USER_ID = "64b000000000000000000002";

function requestWith(token: string) {
  return new NextRequest("http://localhost/api/notices", { headers: { cookie: `token=${token}` } });
}

function liveSession(sid: string, userId = USER_ID) {
  sessions.set(sid, { _id: sid, userId, expiresAt: new Date(Date.now() + 60_000), lastSeenAt: new Date() });
}

beforeEach(() => {
  sessions.clear();
  users.clear();
  users.set(USER_ID, { role: "teacher" });
});

describe("getAuth", () => {
  it("accepts a valid token whose session exists", async () => {
    liveSession("s1");
    const token = signToken({ userId: USER_ID, role: "teacher", sid: "s1" }, 60);
    expect(await getAuth(requestWith(token))).toEqual({ userId: USER_ID, role: "teacher", sid: "s1" });
  });

  it("rejects a token after its session was deleted (logout / password change)", async () => {
    const token = signToken({ userId: USER_ID, role: "teacher", sid: "gone" }, 60);
    expect(await getAuth(requestWith(token))).toBeNull();
  });

  it("rejects a session that has passed its expiry", async () => {
    sessions.set("old", { _id: "old", userId: USER_ID, expiresAt: new Date(Date.now() - 1), lastSeenAt: new Date() });
    const token = signToken({ userId: USER_ID, role: "teacher", sid: "old" }, 60);
    expect(await getAuth(requestWith(token))).toBeNull();
  });

  it("rejects a token pointing at someone else's session", async () => {
    liveSession("s2", OTHER_USER_ID);
    const token = signToken({ userId: USER_ID, role: "teacher", sid: "s2" }, 60);
    expect(await getAuth(requestWith(token))).toBeNull();
  });

  it("rejects a deleted user", async () => {
    liveSession("s3");
    users.delete(USER_ID);
    const token = signToken({ userId: USER_ID, role: "teacher", sid: "s3" }, 60);
    expect(await getAuth(requestWith(token))).toBeNull();
  });

  it("uses the role from the database, not the token", async () => {
    liveSession("s4");
    const token = signToken({ userId: USER_ID, role: "admin", sid: "s4" }, 60);
    expect((await getAuth(requestWith(token)))?.role).toBe("teacher");
  });

  it("blocks users who must change their password, except where allowed", async () => {
    liveSession("s5");
    users.set(USER_ID, { role: "student", mustChangePassword: true });
    const token = signToken({ userId: USER_ID, role: "student", sid: "s5", pwc: true }, 60);
    expect(await getAuth(requestWith(token))).toBeNull();
    expect(await getAuth(requestWith(token), { allowPendingPasswordChange: true })).toMatchObject({ pwc: true });
  });

  it("rejects requests with no token or a garbage token", async () => {
    expect(await getAuth(new NextRequest("http://localhost/api/notices"))).toBeNull();
    expect(await getAuth(requestWith("not.a.jwt"))).toBeNull();
  });
});
