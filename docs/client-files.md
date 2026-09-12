# Client files (artwork) — where they live

Internal note for the Primple team. No file contents or credentials here.

## Storage location

- Lovable Cloud → **Storage** → bucket **`client-artwork`** (private, 50 MB per file).
- Path convention: `client-artwork/<user_id>/<order reference>/<uuid>-<file name>`
  - Files uploaded before the order exists land in `client-artwork/<user_id>/drafts/...`
    and are moved to the order reference logically (the row is linked, the object path stays).

## Database

Table **`public.order_files`** holds one row per uploaded file:

| column | meaning |
| --- | --- |
| `user_id` | owner (the signed-in client) |
| `order_id` / `order_reference` | linked order once checkout completes |
| `bucket` / `path` | exact object location in Storage |
| `file_name`, `mime_type`, `size_bytes` | as uploaded |
| `status` | `uploaded` (not yet on an order) or `attached` |

## Access rules

- RLS on `order_files`: a client can only read/insert/update/delete rows where
  `auth.uid() = user_id`.
- Storage policies on `storage.objects` for `client-artwork`: access only when the first
  folder of the path equals the caller's user id.
- The bucket is **private**. The app never builds public URLs — downloads use short-lived
  signed URLs (5 minutes) created for the owner.
- Staff/back-office access goes through the service role (server-side only), never through
  the browser client.

## Client-facing surfaces

- Order detail in the dashboard: “Fichiers du client / Client files / ملفات العميل”, with
  preview and download, plus the storage path shown for reference.
- “Mes fichiers / My files / ملفاتي” view: every file of the signed-in client, newest first,
  with its order reference.
