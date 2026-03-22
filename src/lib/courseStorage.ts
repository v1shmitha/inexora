import { createClient } from "~/lib/supabase/client";

const BUCKET = "course-resources";

export type UploadResult =
  | { url: string; path: string; sizeBytes: number; mimeType: string; error: null }
  | { url: null; path: null; sizeBytes: null; mimeType: null; error: string };

/**
 * Upload a file to Supabase Storage under course-resources/{courseId}/{filename}
 * Returns the public URL and metadata.
 */
export async function uploadCourseResource(
  file: File,
  courseId: string,
): Promise<UploadResult> {
  const supabase = createClient();

  const ext = file.name.split(".").pop() ?? "bin";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `${courseId}/${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    return { url: null, path: null, sizeBytes: null, mimeType: null, error: uploadError.message };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return {
    url: data.publicUrl,
    path,
    sizeBytes: file.size,
    mimeType: file.type,
    error: null,
  };
}

/**
 * Delete a file from Supabase Storage by its path.
 */
export async function deleteCourseResource(path: string): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from(BUCKET).remove([path]);
}

/**
 * Detect resource type from file mime type
 */
export function detectResourceType(file: File): "PDF" | "VIDEO_UPLOAD" | "IMAGE" | "PRESENTATION" {
  const mime = file.type;
  if (mime === "application/pdf") return "PDF";
  if (mime.startsWith("video/")) return "VIDEO_UPLOAD";
  if (mime.startsWith("image/")) return "IMAGE";
  if (
    mime.includes("presentation") ||
    mime.includes("powerpoint") ||
    file.name.endsWith(".pptx") ||
    file.name.endsWith(".ppt")
  ) return "PRESENTATION";
  return "PDF"; // default fallback
}

/**
 * Format bytes to human readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}