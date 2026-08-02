/**
 * Yönetim uçlarının ortak koruması.
 *
 * Bu üç ara katman eskiden `registerRoutes` içinde kapalı birer fonksiyondu.
 * Sonuç: `server/advancedFeatureRoutes.ts` içindeki yönetim uçları bunlara
 * hiç erişemiyor ve korumayı kendi içinde, elle, eksik biçimde tekrarlıyordu
 * (rolü oturumdan okuyor, PIN'i hiç sormuyorlardı). Tek kaynağa taşındı ki
 * yeni bir yönetim ucu eklendiğinde aynı koruma tek satırla gelsin.
 */
import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "@shared/schema";

/** Oturum nesnesinden kullanıcı kimliği (farklı giriş yollarını karşılar). */
export function getUserId(user: any): string {
  if (user?.dbUserId) return user.dbUserId;
  if (user?.claims?.sub) return user.claims.sub;
  if (user?.id) return user.id;
  return "";
}

export async function adminRoleMiddleware(req: Request, res: Response, next: Function) {
  if (!req.user) {
    return res.status(403).json({ message: "Admin yetkisi gereklidir" });
  }

  // Rol ve hesap durumu oturumdan DEĞİL veritabanından okunur; böylece
  // yetkisi alınan veya yasaklanan bir hesap oturumu dolmadan da engellenir.
  const userId = getUserId(req.user);
  const [dbUser] = await db
    .select({ role: users.role, status: users.status })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!dbUser || dbUser.role !== "admin") {
    return res.status(403).json({ message: "Admin yetkisi gereklidir" });
  }

  if (dbUser.status !== "active") {
    return res.status(403).json({ message: "Hesabınız aktif değil" });
  }

  (req.user as any).role = dbUser.role;
  next();
}

/** Admin PIN doğrulaması. */
export function adminPinMiddleware(req: Request, res: Response, next: Function) {
  const session = req.session as any;
  if (!session.adminPinVerified) {
    return res.status(403).json({
      message: "Admin PIN doğrulaması gereklidir",
      requirePin: true,
    });
  }
  next();
}

/**
 * Yönetim uçlarının standart koruması: önce rol (veritabanından), sonra PIN.
 *
 * PIN kontrolü bir dönem HİÇBİR rotaya bağlı değildi — `adminPinMiddleware`
 * tanımlanmış ama kullanılmamıştı. Arayüzde PIN ekranı vardı ve doğrulama
 * yalnızca istemcide tutuluyordu; yani PIN'i bilmeyen ama yönetici oturumu
 * ele geçirmiş biri, arayüzü hiç kullanmadan doğrudan /api/admin/... çağırıp
 * tüm yönetim işlemlerini yapabiliyordu.
 *
 * PIN'in kendi uçları (`/api/admin/verify-pin` ve `/api/admin/pin-status`)
 * bilinçli olarak yalnızca `adminRoleMiddleware` kullanır — aksi hâlde PIN'i
 * doğrulamak için PIN doğrulanmış olmak gerekir ve panele hiç girilemez.
 */
export async function adminMiddleware(req: Request, res: Response, next: Function) {
  return adminRoleMiddleware(req, res, () => adminPinMiddleware(req, res, next));
}
