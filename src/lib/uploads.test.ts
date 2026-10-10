import { describe, expect, it } from "vitest";
import { isOwnUploadUrl, isUploadUrl, uploadPathname } from "./uploads";

const USER = "64b000000000000000000001";
const OTHER = "64b000000000000000000002";
const blobUrl = (pathname: string) => `https://abc123.public.blob.vercel-storage.com/${pathname}`;

describe("isUploadUrl", () => {
  it("accepts files uploaded through /api/upload", () => {
    expect(isUploadUrl(blobUrl(uploadPathname(USER, "1-notes.pdf")))).toBe(true);
  });

  it("rejects javascript:, outside links and non-strings", () => {
    expect(isUploadUrl("javascript:alert(1)")).toBe(false);
    expect(isUploadUrl("https://evil.example.com/uploads/x.pdf")).toBe(false);
    expect(isUploadUrl("http://abc123.public.blob.vercel-storage.com/uploads/x.pdf")).toBe(false);
    expect(isUploadUrl(blobUrl("other/x.pdf"))).toBe(false);
    expect(isUploadUrl(42)).toBe(false);
  });
});

describe("isOwnUploadUrl", () => {
  it("is true only for the uploader's own folder", () => {
    const url = blobUrl(uploadPathname(USER, "1-notes.pdf"));
    expect(isOwnUploadUrl(url, USER)).toBe(true);
    expect(isOwnUploadUrl(url, OTHER)).toBe(false);
  });

  it("does not treat older flat uploads as anyone's", () => {
    expect(isOwnUploadUrl(blobUrl("uploads/1-notes.pdf"), USER)).toBe(false);
  });
});
