import { createClient } from "~/lib/supabase/client";

const BUCKET = "library-resources";

export type LibraryUploadResult =
  | { url: string; path: string; error: null }
  | { url: null; path: null; error: string };

export async function uploadLibraryResource(
  file: File,
): Promise<LibraryUploadResult> {
  const supabase = createClient();

  // Get current user's profile ID for folder scoping
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { url: null, path: null, error: "Not authenticated" };

  const ext = file.name.split(".").pop() ?? "bin";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `${user.id}/${safeName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) return { url: null, path: null, error: error.message };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path, error: null };
}

export async function deleteLibraryResource(path: string): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from(BUCKET).remove([path]);
}

/**
 * Detect resource type from file mime type / filename
 */
export function detectLibraryResourceType(file: File): string {
  const mime = file.type;
  const name = file.name.toLowerCase();

  if (mime === "application/pdf") {
    if (name.includes("journal") || name.includes("paper") || name.includes("research"))
      return "RESEARCH_PAPER";
    if (name.includes("past") || name.includes("exam"))
      return "PAST_PAPER";
    return "EBOOK";
  }
  if (mime.startsWith("video/")) return "VIDEO_LECTURE";
  if (
    mime.includes("epub") ||
    mime.includes("document") ||
    name.endsWith(".epub") ||
    name.endsWith(".docx")
  ) return "EBOOK";
  if (name.includes("past") || name.includes("exam")) return "PAST_PAPER";
  if (name.includes("journal")) return "JOURNAL";

  return "EBOOK";
}

/**
 * Format bytes to human readable
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}