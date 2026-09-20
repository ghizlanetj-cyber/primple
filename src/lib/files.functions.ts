import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { guestArtworkFolder } from "@/lib/file-access";

const fileInput = z.object({
  name: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().max(120),
  sizeBytes: z.number().int().positive().max(50 * 1024 * 1024),
});

const guestFileInput = z.object({
  path: z.string().min(1).max(500),
  guestToken: z.string().uuid(),
  name: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().max(120),
  sizeBytes: z.number().int().positive().max(50 * 1024 * 1024),
});

function safeName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(-80);
}

export const prepareGuestArtworkUpload = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => fileInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const guestToken = crypto.randomUUID();
    const path = `${guestArtworkFolder(guestToken)}/${crypto.randomUUID()}-${safeName(data.name)}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from("client-artwork")
      .createSignedUploadUrl(path);
    if (error || !signed?.token) throw new Error("The upload could not be prepared.");
    return { path, guestToken, uploadToken: signed.token };
  });

export const registerGuestArtwork = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => guestFileInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!data.path.startsWith(`${guestArtworkFolder(data.guestToken)}/`)) {
      throw new Error("Invalid artwork upload.");
    }

    const folder = guestArtworkFolder(data.guestToken);
    const fileName = data.path.slice(folder.length + 1);
    const { data: objects, error: listError } = await supabaseAdmin.storage
      .from("client-artwork")
      .list(folder, { search: fileName, limit: 1 });
    if (listError || !objects?.some((object) => object.name === fileName)) {
      throw new Error("The uploaded file could not be verified.");
    }

    const { data: row, error } = await supabaseAdmin
      .from("order_files")
      .insert({
        user_id: null,
        guest_token: data.guestToken,
        bucket: "client-artwork",
        path: data.path,
        file_name: data.name,
        mime_type: data.mimeType || null,
        size_bytes: data.sizeBytes,
        status: "uploaded",
      })
      .select("*")
      .single();
    if (error || !row) throw new Error("The uploaded file could not be saved.");
    return row;
  });

export const deleteGuestArtwork = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ path: z.string(), guestToken: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!data.path.startsWith(`${guestArtworkFolder(data.guestToken)}/`)) return { deleted: false };
    const { data: file } = await supabaseAdmin
      .from("order_files")
      .select("id, order_id")
      .eq("path", data.path)
      .eq("guest_token", data.guestToken)
      .maybeSingle();
    if (!file || file.order_id) return { deleted: false };
    await supabaseAdmin.storage.from("client-artwork").remove([data.path]);
    const { error } = await supabaseAdmin.from("order_files").delete().eq("id", file.id);
    return { deleted: !error };
  });