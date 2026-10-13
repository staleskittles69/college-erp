// Files uploaded through /api/upload are stored under a folder named after the uploader's user id,
// so a saved link can be checked: it must be one of our uploads (not a javascript: or outside link),
// and for deletes, it must be the uploader's own file.

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

export function uploadPathname(userId: string, filename: string): string {
  return `uploads/${userId}/${filename}`;
}

function blobPathname(url: string): string | null {
  // Offline demo (DEMO_OFFLINE=1) keeps uploads on local disk under /uploads/.
  if (process.env.DEMO_OFFLINE === "1" && url.startsWith("/uploads/")) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(BLOB_HOST_SUFFIX)) return null;
    return parsed.pathname;
  } catch {
    return null;
  }
}

/** True for a link to a file uploaded through /api/upload (by anyone). */
export function isUploadUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  const pathname = blobPathname(url);
  return pathname !== null && pathname.startsWith("/uploads/");
}

/** True for a link to a file this user uploaded through /api/upload. */
export function isOwnUploadUrl(url: unknown, userId: string): url is string {
  if (!isUploadUrl(url)) return false;
  if (process.env.DEMO_OFFLINE === "1" && url.startsWith("/uploads/")) return true;
  return blobPathname(url)!.startsWith(`/${uploadPathname(userId, "")}`);
}

/** Client-side: throws away a just-uploaded file whose save failed, so it doesn't sit in storage unused. */
export function discardUpload(url: string): void {
  fetch("/api/upload", {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  }).catch(() => {});
}
