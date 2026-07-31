/**
 * Supabase Storage Provider
 * Replaces Replit Object Storage for Vercel + Supabase deployments
 *
 * Required env vars:
 *   SUPABASE_URL              - https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY - service_role JWT (never expose to client)
 *   SUPABASE_STORAGE_BUCKET   - bucket name (default: "uploads")
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Response } from "express";
import { randomUUID } from "crypto";

let _supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (_supabase) return _supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for Supabase storage"
    );
  }
  _supabase = createClient(url, key, {
    auth: { persistSession: false },
  });
  return _supabase;
}

function getBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET || "uploads";
}

export class SupabaseObjectStorageService {
  /**
   * Upload a file buffer and return a public URL
   */
  async uploadFileBuffer(
    buffer: Buffer,
    contentType: string = "image/jpeg"
  ): Promise<string> {
    const supabase = getSupabaseClient();
    const bucket = getBucket();
    const objectId = randomUUID();
    const ext = contentType.split("/")[1] || "bin";
    const path = `uploads/${objectId}.${ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType,
        upsert: false,
      });

    if (error) throw new Error(`Supabase upload failed: ${error.message}`);

    // Return a path that our app can resolve
    return `/objects/uploads/${objectId}.${ext}`;
  }

  /**
   * Get a signed upload URL for direct client uploads
   */
  async getObjectEntityUploadURL(): Promise<string> {
    const supabase = getSupabaseClient();
    const bucket = getBucket();
    const objectId = randomUUID();
    const path = `uploads/${objectId}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error || !data)
      throw new Error(`Failed to create signed upload URL: ${error?.message}`);
    return data.signedUrl;
  }

  /**
   * Stream a file to Express response
   */
  async downloadObject(
    objectPath: string,
    res: Response,
    cacheTtlSec: number = 3600
  ): Promise<void> {
    const supabase = getSupabaseClient();
    const bucket = getBucket();
    const storagePath = this._toStoragePath(objectPath);

    const { data, error } = await supabase.storage
      .from(bucket)
      .download(storagePath);

    if (error || !data) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.set({
      "Content-Type": data.type || "application/octet-stream",
      "Content-Length": buffer.length,
      "Cache-Control": `public, max-age=${cacheTtlSec}`,
    });
    res.send(buffer);
  }

  /**
   * Get a public URL for a file
   */
  getPublicUrl(objectPath: string): string {
    const supabase = getSupabaseClient();
    const bucket = getBucket();
    const storagePath = this._toStoragePath(objectPath);
    const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    return data.publicUrl;
  }

  /**
   * Get a signed download URL (for private files)
   */
  async getSignedUrl(objectPath: string, expiresIn: number = 900): Promise<string> {
    const supabase = getSupabaseClient();
    const bucket = getBucket();
    const storagePath = this._toStoragePath(objectPath);

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresIn);

    if (error || !data)
      throw new Error(`Failed to create signed URL: ${error?.message}`);
    return data.signedUrl;
  }

  /**
   * Check if a file exists
   */
  async fileExists(objectPath: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    const bucket = getBucket();
    const storagePath = this._toStoragePath(objectPath);

    const { data, error } = await supabase.storage
      .from(bucket)
      .list(storagePath.split("/").slice(0, -1).join("/"), {
        search: storagePath.split("/").pop(),
      });

    return !error && data !== null && data.length > 0;
  }

  /**
   * Delete a file
   */
  async deleteFile(objectPath: string): Promise<boolean> {
    if (!objectPath) return false;
    try {
      const supabase = getSupabaseClient();
      const bucket = getBucket();
      const storagePath = this._toStoragePath(objectPath);
      const { error } = await supabase.storage
        .from(bucket)
        .remove([storagePath]);
      return !error;
    } catch {
      return false;
    }
  }

  async deleteMultipleFiles(objectPaths: string[]): Promise<number> {
    let count = 0;
    for (const p of objectPaths) {
      if (await this.deleteFile(p)) count++;
    }
    return count;
  }

  normalizeObjectEntityPath(rawPath: string): string {
    // If it's already a /objects/ path, return as-is
    if (rawPath.startsWith("/objects/")) return rawPath;
    // If it's a Supabase URL, extract the path
    const supabaseUrl = process.env.SUPABASE_URL || "";
    if (rawPath.startsWith(supabaseUrl)) {
      const url = new URL(rawPath);
      const parts = url.pathname.split("/storage/v1/object/public/");
      if (parts.length > 1) {
        const afterBucket = parts[1].split("/").slice(1).join("/");
        return `/objects/${afterBucket}`;
      }
    }
    return rawPath;
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  private _toStoragePath(objectPath: string): string {
    // /objects/uploads/xxx.jpg  →  uploads/xxx.jpg
    if (objectPath.startsWith("/objects/")) {
      return objectPath.slice("/objects/".length);
    }
    return objectPath;
  }
}

export const supabaseStorage = new SupabaseObjectStorageService();

/** Returns true when Supabase storage is configured */
export function isSupabaseStorageConfigured(): boolean {
  return !!(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
