import { del } from "@vercel/blob";
import path from "path";
import { unlink } from "fs/promises";
import Resource from "@/models/Resource";
import Test from "@/models/Test";
import { isOwnUploadUrl } from "@/lib/uploads";

// Removes an uploaded file from storage once nothing points at it any more, so deleted
// tests/resources (and saves that failed after the upload) don't leave paid-for files behind.
// Only touches files filed under `ownerId` — older uploads saved before per-user folders, and
// anything that isn't one of our uploads, are left alone. Never throws.
export async function deleteUploadIfUnused(url: string | null | undefined, ownerId: string): Promise<void> {
  if (!url || !isOwnUploadUrl(url, ownerId)) return;
  try {
    const [usedByTest, usedByResource] = await Promise.all([
      Test.exists({ attachmentUrl: url }),
      Resource.exists({ fileUrl: url }),
    ]);
    if (usedByTest || usedByResource) return;

    if (process.env.DEMO_OFFLINE === "1" && url.startsWith("/uploads/")) {
      await unlink(path.join(process.cwd(), "public", "uploads", path.basename(url)));
    } else {
      await del(url);
    }
  } catch (error) {
    console.error("Upload cleanup failed:", error);
  }
}
