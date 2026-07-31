/**
 * Object Storage — Supabase Storage
 *
 * Replit Object Storage (Google Cloud sidecar) yerine geçer.
 * Uygulama genelinde dosya yolları "/objects/<key>" biçiminde saklanır;
 * bucket içindeki gerçek anahtar ise "<key>" olur.
 *
 * Gerekli ortam değişkenleri:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SUPABASE_STORAGE_BUCKET   (varsayılan: "uploads")
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Response } from "express";
import { randomUUID } from "crypto";

const OBJECT_PREFIX = "/objects/";

let _supabase: SupabaseClient | null = null;

export function isObjectStorageConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getClient(): SupabaseClient {
  if (_supabase) return _supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY tanımlı değil — dosya yükleme devre dışı."
    );
  }
  _supabase = createClient(url, key, { auth: { persistSession: false } });
  return _supabase;
}

function getBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET || "uploads";
}

/** Bucket public ise /objects/* istekleri CDN'e yönlendirilir (serverless bant genişliği tasarrufu) */
function isPublicBucket(): boolean {
  return process.env.SUPABASE_STORAGE_PUBLIC !== "false";
}

/** "/objects/listings/x.webp" → "listings/x.webp" */
function toStorageKey(objectPath: string): string {
  let key = objectPath;
  if (key.startsWith(OBJECT_PREFIX)) key = key.slice(OBJECT_PREFIX.length);
  else if (key.startsWith("objects/")) key = key.slice("objects/".length);
  else if (key.startsWith("/")) key = key.slice(1);
  return key;
}

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  constructor() {}

  // ── Yol yardımcıları (eski Replit API'si ile uyumluluk için korundu) ──────

  getPublicObjectSearchPaths(): string[] {
    return ["public"];
  }

  getPrivateObjectDir(): string {
    return "";
  }

  // ── Okuma ────────────────────────────────────────────────────────────────

  /** Public klasöründe dosya arar; bulursa storage key döner. */
  async searchPublicObject(filePath: string): Promise<string | null> {
    for (const base of this.getPublicObjectSearchPaths()) {
      const key = `${base}/${filePath}`.replace(/\/+/g, "/");
      if (await this.fileExists(key)) return key;
    }
    return null;
  }

  /** "/objects/..." yolunun var olduğunu doğrular, storage key döner. */
  async getObjectEntityFile(objectPath: string): Promise<string> {
    if (!objectPath.startsWith(OBJECT_PREFIX)) {
      throw new ObjectNotFoundError();
    }
    const key = toStorageKey(objectPath);
    if (!key) throw new ObjectNotFoundError();
    if (!(await this.fileExists(key))) {
      throw new ObjectNotFoundError();
    }
    return key;
  }

  /**
   * Dosyayı istemciye gönderir.
   * Public bucket'ta CDN'e 302 yönlendirir (fonksiyon bant genişliği harcamaz),
   * private bucket'ta imzalı URL'e yönlendirir.
   */
  async downloadObject(
    file: string,
    res: Response,
    cacheTtlSec: number = 3600
  ): Promise<void> {
    const key = toStorageKey(file);
    try {
      if (isPublicBucket()) {
        res.set("Cache-Control", `public, max-age=${cacheTtlSec}`);
        return res.redirect(302, this.getPublicUrl(key));
      }
      const signed = await this.getSignedUrl(key, cacheTtlSec);
      return res.redirect(302, signed);
    } catch (error) {
      console.error("Dosya indirme hatası:", error);
      if (!res.headersSent) res.status(500).json({ error: "Error downloading file" });
    }
  }

  getPublicUrl(objectPath: string): string {
    const { data } = getClient()
      .storage.from(getBucket())
      .getPublicUrl(toStorageKey(objectPath));
    return data.publicUrl;
  }

  async getSignedUrl(objectPath: string, expiresIn: number = 900): Promise<string> {
    const { data, error } = await getClient()
      .storage.from(getBucket())
      .createSignedUrl(toStorageKey(objectPath), expiresIn);
    if (error || !data) {
      throw new Error(`İmzalı URL oluşturulamadı: ${error?.message}`);
    }
    return data.signedUrl;
  }

  async fileExists(objectPath: string): Promise<boolean> {
    const key = toStorageKey(objectPath);
    const dir = key.split("/").slice(0, -1).join("/");
    const name = key.split("/").pop() || "";
    const { data, error } = await getClient()
      .storage.from(getBucket())
      .list(dir, { search: name, limit: 100 });
    if (error || !data) return false;
    return data.some((f) => f.name === name);
  }

  // ── Yazma ────────────────────────────────────────────────────────────────

  /** İstemcinin doğrudan yükleme yapabilmesi için imzalı PUT URL'i. */
  async getObjectEntityUploadURL(): Promise<string> {
    const key = `uploads/${randomUUID()}`;
    const { data, error } = await getClient()
      .storage.from(getBucket())
      .createSignedUploadUrl(key);
    if (error || !data) {
      throw new Error(`İmzalı yükleme URL'i oluşturulamadı: ${error?.message}`);
    }
    return data.signedUrl;
  }

  /** Buffer yükler, uygulama içi "/objects/..." yolunu döner. */
  async uploadFileBuffer(
    buffer: Buffer,
    contentType: string = "image/jpeg"
  ): Promise<string> {
    const ext = (contentType.split("/")[1] || "bin").split("+")[0];
    const key = `uploads/${randomUUID()}.${ext}`;
    return this.uploadBufferAt(key, buffer, contentType);
  }

  /** Belirli bir anahtara yükler, uygulama içi "/objects/..." yolunu döner. */
  async uploadBufferAt(
    key: string,
    buffer: Buffer,
    contentType: string
  ): Promise<string> {
    const storageKey = toStorageKey(key);
    const { error } = await getClient()
      .storage.from(getBucket())
      .upload(storageKey, buffer, { contentType, upsert: true });
    if (error) throw new Error(`Supabase yükleme hatası: ${error.message}`);
    return `${OBJECT_PREFIX}${storageKey}`;
  }

  // ── Silme ────────────────────────────────────────────────────────────────

  async deleteFile(objectPath: string): Promise<boolean> {
    if (!objectPath) return false;
    try {
      const { error } = await getClient()
        .storage.from(getBucket())
        .remove([toStorageKey(this.normalizeObjectEntityPath(objectPath))]);
      return !error;
    } catch (error) {
      console.error("Dosya silme hatası:", error);
      return false;
    }
  }

  async deleteMultipleFiles(objectPaths: string[]): Promise<number> {
    const keys = (objectPaths || [])
      .filter(Boolean)
      .map((p) => toStorageKey(this.normalizeObjectEntityPath(p)));
    if (keys.length === 0) return 0;
    try {
      const { data, error } = await getClient()
        .storage.from(getBucket())
        .remove(keys);
      if (error) return 0;
      return data?.length ?? 0;
    } catch (error) {
      console.error("Toplu silme hatası:", error);
      return 0;
    }
  }

  // ── Normalizasyon ────────────────────────────────────────────────────────

  /** Tam Supabase URL'i veya imzalı URL'i "/objects/..." biçimine indirger. */
  normalizeObjectEntityPath(rawPath: string): string {
    if (!rawPath) return rawPath;
    if (rawPath.startsWith(OBJECT_PREFIX)) return rawPath;

    // Eski Replit/GCS kayıtları
    if (rawPath.startsWith("https://storage.googleapis.com/")) {
      const parts = new URL(rawPath).pathname.split("/").filter(Boolean);
      return `${OBJECT_PREFIX}${parts.slice(1).join("/")}`;
    }

    if (rawPath.startsWith("http")) {
      try {
        const url = new URL(rawPath);
        // .../storage/v1/object/(public|sign|upload/sign)/<bucket>/<key>
        const m = url.pathname.match(
          /\/storage\/v1\/object\/(?:public\/|sign\/|upload\/sign\/)?[^/]+\/(.+)$/
        );
        if (m) return `${OBJECT_PREFIX}${decodeURIComponent(m[1])}`;
      } catch {
        /* geçersiz URL — olduğu gibi bırak */
      }
      return rawPath;
    }

    return `${OBJECT_PREFIX}${toStorageKey(rawPath)}`;
  }
}

/** Uygulama genelinde paylaşılan tekil örnek */
export const objectStorage = new ObjectStorageService();
