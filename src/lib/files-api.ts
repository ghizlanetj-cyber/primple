import { supabase } from "@/integrations/supabase/client";
import {
  deleteGuestArtwork,
  prepareGuestArtworkUpload,
  registerGuestArtwork,
} from "@/lib/files.functions";

/**
 * Client artwork lives in the private Lovable Cloud storage bucket below.
 * Path convention: <user_id>/<order reference or "drafts">/<uuid>-<file name>
 * Only the owner (and service-role staff tooling) can read or write it —
 * enforced by storage.objects policies plus RLS on public.order_files.
 */
export const ARTWORK_BUCKET = "client-artwork";
export const ARTWORK_DRAFT_FOLDER = "drafts";

export const ACCEPTED_ARTWORK_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "svg"] as const;
export const MAX_ARTWORK_BYTES = 50 * 1024 * 1024;

export type ClientFile = {
  id: string;
  orderId: string | null;
  orderReference: string | null;
  bucket: string;
  path: string;
  name: string;
  mimeType: string | null;
  sizeBytes: number;
  status: string;
  createdAt: string;
  guestToken?: string;
};

function toFile(row: Record<string, unknown>): ClientFile {
  return {
    id: String(row["id"]),
    orderId: (row["order_id"] as string) ?? null,
    orderReference: (row["order_reference"] as string) ?? null,
    bucket: String(row["bucket"] ?? ARTWORK_BUCKET),
    path: String(row["path"]),
    name: String(row["file_name"]),
    mimeType: (row["mime_type"] as string) ?? null,
    sizeBytes: Number(row["size_bytes"] ?? 0),
    status: String(row["status"] ?? "uploaded"),
    createdAt: String(row["created_at"]),
    ...((row["guest_token"] as string | null) ? { guestToken: String(row["guest_token"]) } : {}),
  };
}

export async function uploadGuestFile(file: File): Promise<ClientFile> {
  const prepared = await prepareGuestArtworkUpload({
    data: { name: file.name, mimeType: file.type, sizeBytes: file.size },
  });
  const { error: uploadError } = await supabase.storage
    .from(ARTWORK_BUCKET)
    .uploadToSignedUrl(prepared.path, prepared.uploadToken, file, {
      ...(file.type ? { contentType: file.type } : {}),
    });
  if (uploadError) throw uploadError;

  const row = await registerGuestArtwork({
    data: {
      path: prepared.path,
      guestToken: prepared.guestToken,
      name: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    },
  });
  return toFile(row as Record<string, unknown>);
}

export function fileExtension(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function isAcceptedArtwork(file: File) {
  return (ACCEPTED_ARTWORK_EXTENSIONS as readonly string[]).includes(fileExtension(file.name));
}

export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function safeName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(-80);
}

export function artworkFolder(userId: string, orderReference?: string | null) {
  return `${userId}/${orderReference ?? ARTWORK_DRAFT_FOLDER}`;
}

export async function uploadClientFile(
  userId: string,
  file: File,
  orderReference?: string | null,
): Promise<ClientFile> {
  const path = `${artworkFolder(userId, orderReference)}/${crypto.randomUUID()}-${safeName(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from(ARTWORK_BUCKET)
    .upload(path, file, { ...(file.type ? { contentType: file.type } : {}), upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("order_files")
    .insert({
      user_id: userId,
      order_reference: orderReference ?? null,
      bucket: ARTWORK_BUCKET,
      path,
      file_name: file.name,
      mime_type: file.type || null,
      size_bytes: file.size,
      status: "uploaded",
    })
    .select("*")
    .single();
  if (error) {
    await supabase.storage.from(ARTWORK_BUCKET).remove([path]);
    throw error;
  }
  return toFile(data as Record<string, unknown>);
}

export async function listMyFiles(): Promise<ClientFile[]> {
  const { data, error } = await supabase
    .from("order_files")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => toFile(row as Record<string, unknown>));
}

/** Links draft uploads to the order they were placed with. */
export async function attachFilesToOrder(paths: string[], orderId: string, reference: string) {
  if (paths.length === 0) return;
  const { error } = await supabase
    .from("order_files")
    .update({ order_id: orderId, order_reference: reference, status: "attached" })
    .in("path", paths);
  if (error) throw error;
}

export async function signedFileUrl(path: string, download = false) {
  const { data, error } = await supabase.storage
    .from(ARTWORK_BUCKET)
    .createSignedUrl(path, 300, download ? { download: true } : {});
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteClientFile(file: ClientFile) {
  if (file.guestToken) {
    const result = await deleteGuestArtwork({
      data: { path: file.path, guestToken: file.guestToken },
    });
    if (!result.deleted) throw new Error("The file could not be removed.");
    return;
  }
  const { error: storageError } = await supabase.storage.from(ARTWORK_BUCKET).remove([file.path]);
  if (storageError) throw storageError;
  const { error } = await supabase.from("order_files").delete().eq("id", file.id);
  if (error) throw error;
}
