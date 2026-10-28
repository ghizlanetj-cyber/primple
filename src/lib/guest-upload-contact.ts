import { uploaderContactSchema, type UploaderContact } from "./uploader-contact";
const KEY = "primple-upload-contact";
export function readUploadContact(): UploaderContact | null {
  try {
    const result = uploaderContactSchema.safeParse(
      JSON.parse(window.sessionStorage.getItem(KEY) ?? "null"),
    );
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
export function saveUploadContact(contact: UploaderContact) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(contact));
  } catch {
    /* optional prefill */
  }
}

