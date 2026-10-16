import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET_NAME || "vault-documents";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error("[storage] SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

/**
 * Upload a file buffer to Supabase Storage.
 * Stored at: vault-documents/<patientId>/<timestamp>-<sanitizedFilename>
 *
 * @param {string} patientId
 * @param {Buffer} buffer  - file contents in memory
 * @param {string} originalName - original filename from the upload
 * @param {string} mimeType
 * @returns {Promise<string>} storagePath - the path inside the bucket (used to generate signed URLs later)
 */
export async function uploadDocumentToStorage(patientId, buffer, originalName, mimeType) {
  // Sanitise filename: keep only alphanumeric, dash, underscore, dot
  const safe = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${patientId}/${Date.now()}-${safe}`;

  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) {
    const err = new Error(`Storage upload failed: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  return storagePath;
}

/**
 * Generate a signed (temporary, private) download URL for a stored document.
 * Valid for 15 minutes.
 *
 * @param {string} storagePath - the path inside the bucket
 * @returns {Promise<string>} signedUrl
 */
export async function getSignedDocumentUrl(storagePath) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 900); // 900 seconds = 15 minutes

  if (error || !data?.signedUrl) {
    const err = new Error(`Could not generate download link: ${error?.message}`);
    err.statusCode = 500;
    throw err;
  }

  return data.signedUrl;
}

/**
 * Delete a stored file from Supabase Storage.
 *
 * @param {string} storagePath
 */
export async function deleteDocumentFromStorage(storagePath) {
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (error) {
    console.warn("[storage] Could not delete file:", storagePath, error.message);
  }
}

