import type { Express, Request, Response } from "express";
import { db } from "./db";
import { isAuthenticated } from "./auth";
import { sql, eq, and, desc, inArray } from "drizzle-orm";
import { adminMiddleware } from "./admin-guard";
import {
  professionalVerifications,
  users,
  vetServices,
  transportServices,
  notifications,
} from "@shared/schema";

/*
 * BU DOSYADAKİ HAM SQL HAKKINDA
 *
 * Bu modül eskiden baştan sona `db.execute(sql.raw(\`... '${x}' ...\`))`
 * kalıbıyla yazılmıştı: istek verisi hiç kaçışlanmadan SQL metnine
 * gömülüyordu. `db.execute` PostgreSQL'in basit sorgu protokolünü kullandığı
 * için noktalı virgülle ikinci bir ifade eklemek de mümkündü.
 *
 * Bu KANITLANMIŞ bir açıktı: herkese açık `GET /api/b2b/listings/:id` ucuna
 * `x' AND 1=(SELECT 1 FROM pg_sleep(4)) --` gönderildiğinde yanıt süresi
 * 0.9 sn'den 8 sn'ye çıkıyordu (zaman tabanlı kör enjeksiyon). Aynı kalıp
 * dosyadaki tüm uçlarda vardı.
 *
 * Artık tüm değerler Drizzle `sql` şablonuyla parametreli. Kural basit:
 *   - DEĞER  → `${x}` (Drizzle bağlı parametre yapar)
 *   - dinamik KOŞUL → sql fragment dizisi + `sql.join(..., sql\` AND \`)`
 *   - tablo/sütun/anahtar sözcük → şablonda sabit metin kalır
 * Bu dosyada `sql.raw` ARTIK KULLANILMAMALI.
 */

// Helper to get user ID from request
const getUserId = (user: any): string => {
  if (user?.dbUserId) return user.dbUserId;
  if (user?.claims?.sub) return user.claims.sub;
  if (user?.id) return user.id;
  return '';
};

/** Pozitif tam sayı sınırı (LIMIT için); güvenli varsayılan ve tavan. */
function limitDegeri(ham: unknown, varsayilan = 50, tavan = 200): number {
  const n = parseInt(String(ham ?? ""), 10);
  if (!Number.isFinite(n) || n < 1) return varsayilan;
  return Math.min(n, tavan);
}

// ============ MARKET PRICES API ============
export function registerMarketPriceRoutes(app: Express) {
  // Get all market prices with filters
  app.get("/api/market-prices", async (req: Request, res: Response) => {
    try {
      const { type, city, category, limit } = req.query;

      const kosullar = [sql`1=1`];
      if (type) kosullar.push(sql`type = ${type}`);
      if (city) kosullar.push(sql`city ILIKE ${"%" + city + "%"}`);
      if (category) kosullar.push(sql`category ILIKE ${"%" + category + "%"}`);

      const result = await db.execute(sql`
        SELECT * FROM market_prices
        WHERE ${sql.join(kosullar, sql` AND `)}
        ORDER BY date DESC
        LIMIT ${limitDegeri(limit)}
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching market prices:", error);
      res.status(500).json({ message: "Piyasa fiyatları getirilemedi" });
    }
  });

  // Get latest prices by type
  app.get("/api/market-prices/latest", async (req: Request, res: Response) => {
    try {
      const { type } = req.query;
      const filtre = type ? sql`WHERE type = ${type}` : sql``;

      const result = await db.execute(sql`
        SELECT DISTINCT ON (category, city)
          id, type, category, city, price, unit, min_price, max_price,
          change_percent, source, date, created_at
        FROM market_prices
        ${filtre}
        ORDER BY category, city, date DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching latest prices:", error);
      res.status(500).json({ message: "Güncel fiyatlar getirilemedi" });
    }
  });

  // Get price history for a category
  app.get("/api/market-prices/history/:category", async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const { city, days } = req.query;

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - limitDegeri(days, 30, 365));

      const kosullar = [sql`category = ${category}`];
      if (city) kosullar.push(sql`city = ${city}`);
      kosullar.push(sql`date >= ${daysAgo.toISOString()}`);

      const result = await db.execute(sql`
        SELECT * FROM market_prices
        WHERE ${sql.join(kosullar, sql` AND `)}
        ORDER BY date ASC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching price history:", error);
      res.status(500).json({ message: "Fiyat geçmişi getirilemedi" });
    }
  });

  // Admin: Add new market price
  app.post("/api/market-prices", isAuthenticated, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { type, category, city, price, unit, minPrice, maxPrice, changePercent, source } = req.body ?? {};

      const result = await db.execute(sql`
        INSERT INTO market_prices (type, category, city, price, unit, min_price, max_price, change_percent, source, date)
        VALUES (${type}, ${category}, ${city}, ${price}, ${unit},
                ${minPrice ?? null}, ${maxPrice ?? null}, ${changePercent ?? null},
                ${source ?? null}, NOW())
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error adding market price:", error);
      res.status(500).json({ message: "Fiyat eklenemedi" });
    }
  });
}

// ============ VETERINARY ONLINE SERVICES API ============
export function registerVetOnlineRoutes(app: Express) {
  // Get available vets for online consultation
  app.get("/api/vet-online/vets", async (_req: Request, res: Response) => {
    try {
      const result = await db.execute(sql`
        SELECT u.id, u.first_name, u.last_name, u.profile_image_url, u.city,
               vs.specializations, vs.online_consultation_available,
               vs.consultation_fee, vs.rating, vs.review_count
        FROM users u
        INNER JOIN vet_services vs ON u.id = vs.user_id
        WHERE u.role = 'veterinarian'
          AND vs.online_consultation_available = true
          AND vs.verified_at IS NOT NULL
        ORDER BY vs.rating DESC NULLS LAST
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching online vets:", error);
      res.status(500).json({ message: "Veterinerler getirilemedi" });
    }
  });

  // Create consultation request
  app.post("/api/vet-online/consultations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      if (!userId) return res.status(401).json({ message: "Giriş yapmalısınız" });

      const { vetId, type, animalType, animalAge, symptoms, images, scheduledAt } = req.body ?? {};

      const result = await db.execute(sql`
        INSERT INTO vet_online_services
        (vet_id, client_id, type, animal_type, animal_age, symptoms, images, scheduled_at)
        VALUES (${vetId}, ${userId}, ${type},
                ${animalType ?? null}, ${animalAge ?? null}, ${symptoms ?? null},
                ${JSON.stringify(images || [])}::jsonb,
                ${scheduledAt ?? null})
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error creating consultation:", error);
      res.status(500).json({ message: "Konsültasyon oluşturulamadı" });
    }
  });

  // Get user's consultations
  app.get("/api/vet-online/my-consultations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      if (!userId) return res.status(401).json({ message: "Giriş yapmalısınız" });

      const result = await db.execute(sql`
        SELECT c.*,
               u.first_name as vet_first_name, u.last_name as vet_last_name,
               u.profile_image_url as vet_image
        FROM vet_online_services c
        INNER JOIN users u ON c.vet_id = u.id
        WHERE c.client_id = ${userId}
        ORDER BY c.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching consultations:", error);
      res.status(500).json({ message: "Konsültasyonlar getirilemedi" });
    }
  });

  // Vet: Get pending consultations
  app.get("/api/vet-online/vet-consultations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      if (!userId) return res.status(401).json({ message: "Giriş yapmalısınız" });

      const result = await db.execute(sql`
        SELECT c.*,
               u.first_name as client_first_name, u.last_name as client_last_name,
               u.profile_image_url as client_image, u.phone as client_phone
        FROM vet_online_services c
        INNER JOIN users u ON c.client_id = u.id
        WHERE c.vet_id = ${userId}
        ORDER BY c.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching vet consultations:", error);
      res.status(500).json({ message: "Konsültasyonlar getirilemedi" });
    }
  });

  // Update consultation status
  app.patch("/api/vet-online/consultations/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      if (!userId) return res.status(401).json({ message: "Giriş yapmalısınız" });

      const { id } = req.params;
      const { status, diagnosis, prescription, notes, price } = req.body ?? {};

      const set = [sql`updated_at = NOW()`];
      if (status) set.push(sql`status = ${status}`);
      if (diagnosis) set.push(sql`diagnosis = ${diagnosis}`);
      if (prescription) set.push(sql`prescription = ${prescription}`);
      if (notes) set.push(sql`notes = ${notes}`);
      if (price !== undefined) set.push(sql`price = ${price}`);
      if (status === "completed") set.push(sql`completed_at = NOW()`);

      const result = await db.execute(sql`
        UPDATE vet_online_services
        SET ${sql.join(set, sql`, `)}
        WHERE id = ${id} AND (vet_id = ${userId} OR client_id = ${userId})
        RETURNING *
      `);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Konsültasyon bulunamadı" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating consultation:", error);
      res.status(500).json({ message: "Konsültasyon güncellenemedi" });
    }
  });

  // Rate consultation
  app.post("/api/vet-online/consultations/:id/rate", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      if (!userId) return res.status(401).json({ message: "Giriş yapmalısınız" });

      const { id } = req.params;
      const { rating, review } = req.body ?? {};

      const result = await db.execute(sql`
        UPDATE vet_online_services
        SET rating = ${rating}, review = ${review ?? null}, updated_at = NOW()
        WHERE id = ${id} AND client_id = ${userId}
        RETURNING *
      `);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Konsültasyon bulunamadı" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error rating consultation:", error);
      res.status(500).json({ message: "Değerlendirme kaydedilemedi" });
    }
  });
}

// ============ TRANSPORT MATCHING API ============
export function registerTransportRoutes(app: Express) {
  // Create transport request
  app.post("/api/transport/requests", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      if (!userId) return res.status(401).json({ message: "Giriş yapmalısınız" });

      const {
        animalType, animalCount, animalWeight,
        originCity, originDistrict, originAddress,
        destinationCity, destinationDistrict, destinationAddress,
        preferredDate, flexibleDate, specialRequirements
      } = req.body ?? {};

      const result = await db.execute(sql`
        INSERT INTO transport_requests
        (user_id, animal_type, animal_count, animal_weight,
         origin_city, origin_district, origin_address,
         destination_city, destination_district, destination_address,
         preferred_date, flexible_date, special_requirements)
        VALUES (${userId}, ${animalType}, ${animalCount},
                ${animalWeight ?? null},
                ${originCity}, ${originDistrict ?? null}, ${originAddress ?? null},
                ${destinationCity}, ${destinationDistrict ?? null}, ${destinationAddress ?? null},
                ${preferredDate ?? null},
                ${flexibleDate !== undefined ? flexibleDate : true},
                ${specialRequirements ?? null})
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error creating transport request:", error);
      res.status(500).json({ message: "Nakliye talebi oluşturulamadı" });
    }
  });

  // Get open transport requests (for transporters)
  app.get("/api/transport/requests", async (req: Request, res: Response) => {
    try {
      const { originCity, destinationCity, animalType } = req.query;

      const kosullar = [sql`r.status = 'pending'`];
      if (originCity) kosullar.push(sql`r.origin_city ILIKE ${"%" + originCity + "%"}`);
      if (destinationCity) kosullar.push(sql`r.destination_city ILIKE ${"%" + destinationCity + "%"}`);
      if (animalType) kosullar.push(sql`r.animal_type ILIKE ${"%" + animalType + "%"}`);

      const result = await db.execute(sql`
        SELECT r.*, u.first_name, u.last_name, u.city as user_city
        FROM transport_requests r
        INNER JOIN users u ON r.user_id = u.id
        WHERE ${sql.join(kosullar, sql` AND `)}
        ORDER BY r.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching transport requests:", error);
      res.status(500).json({ message: "Talepler getirilemedi" });
    }
  });

  // Get my transport requests
  app.get("/api/transport/my-requests", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      if (!userId) return res.status(401).json({ message: "Giriş yapmalısınız" });

      const result = await db.execute(sql`
        SELECT r.*,
               (SELECT COUNT(*) FROM transport_quotes WHERE request_id = r.id) as quote_count
        FROM transport_requests r
        WHERE r.user_id = ${userId}
        ORDER BY r.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching my requests:", error);
      res.status(500).json({ message: "Talepler getirilemedi" });
    }
  });

  // Submit quote for transport request
  app.post("/api/transport/quotes", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      if (!userId) return res.status(401).json({ message: "Giriş yapmalısınız" });

      const { requestId, price, estimatedDuration, vehicleType, vehicleCapacity, insuranceIncluded, notes, expiresAt } = req.body ?? {};

      const result = await db.execute(sql`
        INSERT INTO transport_quotes
        (request_id, transporter_id, price, estimated_duration, vehicle_type,
         vehicle_capacity, insurance_included, notes, expires_at)
        VALUES (${requestId}, ${userId}, ${price},
                ${estimatedDuration ?? null},
                ${vehicleType ?? null}, ${vehicleCapacity ?? null},
                ${insuranceIncluded || false},
                ${notes ?? null}, ${expiresAt ?? null})
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error submitting quote:", error);
      res.status(500).json({ message: "Teklif gönderilemedi" });
    }
  });

  // Get quotes for a request
  app.get("/api/transport/requests/:id/quotes", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      if (!userId) return res.status(401).json({ message: "Giriş yapmalısınız" });

      const { id } = req.params;

      // Sahiplik: bir talebe gelen teklifleri (rakip fiyatlar + nakliyeci
      // kimliği) yalnız TALEBİN SAHİBİ görebilir. Önceden userId alınıp hiç
      // kullanılmıyordu; herhangi bir kullanıcı request id deneyerek
      // başkasının aldığı teklifleri görebiliyordu (rekabet bilgisi sızıntısı).
      const talep = await db.execute(sql`SELECT user_id FROM transport_requests WHERE id = ${id} LIMIT 1`);
      if (talep.rows.length === 0) {
        return res.status(404).json({ message: "Talep bulunamadı" });
      }
      if ((talep.rows[0] as any).user_id !== userId) {
        return res.status(403).json({ message: "Bu talebin tekliflerini görme yetkiniz yok" });
      }

      // Sütun adları transport_services şemasıyla eşleşmeli: JOIN transporter_id
      // üzerinden (user_id sütunu yok), service_areas (service_regions değil),
      // total_reviews (completed_transports yok). Eski sorgu bu yüzden 500
      // veriyordu; özellik pasif olduğu için fark edilmemişti.
      const result = await db.execute(sql`
        SELECT q.*,
               u.first_name, u.last_name, u.profile_image_url,
               ts.vehicle_types, ts.service_areas, ts.rating, ts.total_reviews, ts.company_name
        FROM transport_quotes q
        INNER JOIN users u ON q.transporter_id = u.id
        LEFT JOIN transport_services ts ON ts.transporter_id = u.id
        WHERE q.request_id = ${id}
        ORDER BY q.price ASC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ message: "Teklifler getirilemedi" });
    }
  });

  // Accept a quote
  app.post("/api/transport/quotes/:id/accept", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      if (!userId) return res.status(401).json({ message: "Giriş yapmalısınız" });

      const { id } = req.params;

      // Sahiplik ÖNCE doğrulanır. Önceki sürüm teklifi KOŞULSUZ
      // `is_accepted=true` yapıyor, sahiplik kontrolünü ise SONRAKİ farklı
      // tablo (transport_requests) güncellemesinde yapıyordu — yani sahibi
      // olmayan biri, quote id'sini vererek herhangi bir nakliyecinin teklifini
      // "kabul edildi" olarak işaretleyebiliyordu (talep güncellenmese bile
      // teklif kalıcı bozuluyordu).
      const sahiplik = await db.execute(sql`
        SELECT tq.request_id, tr.user_id AS talep_sahibi
        FROM transport_quotes tq
        INNER JOIN transport_requests tr ON tr.id = tq.request_id
        WHERE tq.id = ${id}
        LIMIT 1
      `);
      if (sahiplik.rows.length === 0) {
        return res.status(404).json({ message: "Teklif bulunamadı" });
      }
      const { request_id: requestId, talep_sahibi } = sahiplik.rows[0] as any;
      if (talep_sahibi !== userId) {
        return res.status(403).json({ message: "Bu teklifi kabul etme yetkiniz yok" });
      }

      // Sahiplik doğrulandı: teklifi kabul et + talebi güncelle.
      await db.execute(sql`UPDATE transport_quotes SET is_accepted = true WHERE id = ${id}`);
      const result = await db.execute(sql`
        UPDATE transport_requests
        SET status = 'accepted', accepted_quote_id = ${id}, updated_at = NOW()
        WHERE id = ${requestId}
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error accepting quote:", error);
      res.status(500).json({ message: "Teklif kabul edilemedi" });
    }
  });
}

// ============ B2B FEED MARKETPLACE API ============
export function registerB2BRoutes(app: Express) {
  // Get B2B listings
  app.get("/api/b2b/listings", async (req: Request, res: Response) => {
    try {
      const { category, minQuantity, maxPrice, city } = req.query;

      const kosullar = [sql`l.status = 'active'`];
      if (category) kosullar.push(sql`l.category ILIKE ${"%" + category + "%"}`);
      if (minQuantity) kosullar.push(sql`l.available_stock >= ${minQuantity}`);
      if (maxPrice) kosullar.push(sql`l.price_per_unit <= ${maxPrice}`);
      if (city) kosullar.push(sql`u.city ILIKE ${"%" + city + "%"}`);

      const result = await db.execute(sql`
        SELECT l.*,
               u.first_name, u.last_name, u.city as seller_city,
               s.display_name as store_name, s.logo as store_logo, s.verified_at as store_verified
        FROM b2b_listings l
        INNER JOIN users u ON l.seller_id = u.id
        LEFT JOIN stores s ON l.store_id = s.id
        WHERE ${sql.join(kosullar, sql` AND `)}
        ORDER BY l.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching B2B listings:", error);
      res.status(500).json({ message: "Ürünler getirilemedi" });
    }
  });

  // Get single B2B listing
  app.get("/api/b2b/listings/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await db.execute(sql`UPDATE b2b_listings SET view_count = view_count + 1 WHERE id = ${id}`);

      const result = await db.execute(sql`
        SELECT l.*,
               u.first_name, u.last_name, u.city as seller_city, u.phone as seller_phone,
               s.display_name as store_name, s.logo as store_logo, s.verified_at as store_verified
        FROM b2b_listings l
        INNER JOIN users u ON l.seller_id = u.id
        LEFT JOIN stores s ON l.store_id = s.id
        WHERE l.id = ${id} AND l.status = 'active'
      `);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Ürün bulunamadı" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching B2B listing:", error);
      res.status(500).json({ message: "Ürün getirilemedi" });
    }
  });

  // Create B2B listing
  app.post("/api/b2b/listings", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      if (!userId) return res.status(401).json({ message: "Giriş yapmalısınız" });

      const {
        storeId, title, description, category, brand, unit,
        minQuantity, maxQuantity, pricePerUnit, bulkDiscounts,
        availableStock, images, specifications, deliveryOptions
      } = req.body ?? {};

      const result = await db.execute(sql`
        INSERT INTO b2b_listings
        (seller_id, store_id, title, description, category, brand, unit,
         min_quantity, max_quantity, price_per_unit, bulk_discounts,
         available_stock, images, specifications, delivery_options)
        VALUES (${userId}, ${storeId ?? null},
                ${title}, ${description ?? null},
                ${category}, ${brand ?? null}, ${unit},
                ${minQuantity}, ${maxQuantity ?? null}, ${pricePerUnit},
                ${JSON.stringify(bulkDiscounts || [])}::jsonb,
                ${availableStock ?? null},
                ${JSON.stringify(images || [])}::jsonb,
                ${JSON.stringify(specifications || {})}::jsonb,
                ${JSON.stringify(deliveryOptions || [])}::jsonb)
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error creating B2B listing:", error);
      res.status(500).json({ message: "Ürün oluşturulamadı" });
    }
  });

  // Create B2B order
  app.post("/api/b2b/orders", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      if (!userId) return res.status(401).json({ message: "Giriş yapmalısınız" });

      const { listingId, quantity, deliveryAddress, deliveryCity, deliveryNotes } = req.body ?? {};

      const listingResult = await db.execute(sql`
        SELECT * FROM b2b_listings WHERE id = ${listingId} AND status = 'active'
      `);
      if (listingResult.rows.length === 0) {
        return res.status(404).json({ message: "Ürün bulunamadı veya stokta yok" });
      }

      const listing: any = listingResult.rows[0];

      if (quantity < listing.min_quantity) {
        return res.status(400).json({ message: `Minimum sipariş miktarı: ${listing.min_quantity}` });
      }

      // Calculate price with bulk discounts
      let unitPrice = parseFloat(listing.price_per_unit);
      const bulkDiscounts = listing.bulk_discounts || [];
      for (const discount of bulkDiscounts) {
        if (quantity >= discount.minQuantity) {
          unitPrice = unitPrice * (1 - discount.discountPercent / 100);
        }
      }

      const totalPrice = unitPrice * quantity;

      const result = await db.execute(sql`
        INSERT INTO b2b_orders
        (listing_id, buyer_id, seller_id, quantity, unit_price, total_price,
         delivery_address, delivery_city, delivery_notes)
        VALUES (${listingId}, ${userId}, ${listing.seller_id},
                ${quantity}, ${unitPrice}, ${totalPrice},
                ${deliveryAddress ?? null}, ${deliveryCity ?? null}, ${deliveryNotes ?? null})
        RETURNING *
      `);

      await db.execute(sql`UPDATE b2b_listings SET order_count = order_count + 1 WHERE id = ${listingId}`);

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error creating B2B order:", error);
      res.status(500).json({ message: "Sipariş oluşturulamadı" });
    }
  });

  // Get my B2B orders (as buyer)
  app.get("/api/b2b/my-orders", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      if (!userId) return res.status(401).json({ message: "Giriş yapmalısınız" });

      const result = await db.execute(sql`
        SELECT o.*,
               l.title as product_title, l.images as product_images,
               u.first_name as seller_first_name, u.last_name as seller_last_name
        FROM b2b_orders o
        INNER JOIN b2b_listings l ON o.listing_id = l.id
        INNER JOIN users u ON o.seller_id = u.id
        WHERE o.buyer_id = ${userId}
        ORDER BY o.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching my orders:", error);
      res.status(500).json({ message: "Siparişler getirilemedi" });
    }
  });

  // Get orders for my listings (as seller)
  app.get("/api/b2b/seller-orders", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      if (!userId) return res.status(401).json({ message: "Giriş yapmalısınız" });

      const result = await db.execute(sql`
        SELECT o.*,
               l.title as product_title,
               u.first_name as buyer_first_name, u.last_name as buyer_last_name,
               u.phone as buyer_phone
        FROM b2b_orders o
        INNER JOIN b2b_listings l ON o.listing_id = l.id
        INNER JOIN users u ON o.buyer_id = u.id
        WHERE o.seller_id = ${userId}
        ORDER BY o.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching seller orders:", error);
      res.status(500).json({ message: "Siparişler getirilemedi" });
    }
  });

  // Update order status
  app.patch("/api/b2b/orders/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      if (!userId) return res.status(401).json({ message: "Giriş yapmalısınız" });

      const { id } = req.params;
      const { status, estimatedDelivery } = req.body ?? {};

      const set = [sql`updated_at = NOW()`];
      if (status) {
        set.push(sql`status = ${status}`);
        if (status === "delivered") set.push(sql`delivered_at = NOW()`);
      }
      if (estimatedDelivery) set.push(sql`estimated_delivery = ${estimatedDelivery}`);

      const result = await db.execute(sql`
        UPDATE b2b_orders
        SET ${sql.join(set, sql`, `)}
        WHERE id = ${id} AND seller_id = ${userId}
        RETURNING *
      `);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Sipariş bulunamadı" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Sipariş güncellenemedi" });
    }
  });
}

// ============ WHOLESALE DAIRY MARKET API ============
export function registerWholesaleRoutes(app: Express) {
  // Get wholesale products
  app.get("/api/wholesale/products", async (req: Request, res: Response) => {
    try {
      const { type, certified, minQuantity, city } = req.query;

      const kosullar = [sql`p.status = 'active'`];
      if (type) kosullar.push(sql`p.product_type ILIKE ${"%" + type + "%"}`);
      if (certified === "true") kosullar.push(sql`p.is_certified = true`);
      if (minQuantity) kosullar.push(sql`p.available_quantity >= ${minQuantity}`);
      if (city) kosullar.push(sql`u.city ILIKE ${"%" + city + "%"}`);

      const result = await db.execute(sql`
        SELECT p.*,
               u.first_name, u.last_name, u.city as seller_city,
               s.display_name as store_name, s.logo as store_logo
        FROM wholesale_products p
        INNER JOIN users u ON p.seller_id = u.id
        LEFT JOIN stores s ON p.store_id = s.id
        WHERE ${sql.join(kosullar, sql` AND `)}
        ORDER BY p.is_certified DESC, p.rating DESC, p.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching wholesale products:", error);
      res.status(500).json({ message: "Ürünler getirilemedi" });
    }
  });

  // Get single wholesale product
  app.get("/api/wholesale/products/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const result = await db.execute(sql`
        SELECT p.*,
               u.first_name, u.last_name, u.city as seller_city, u.phone as seller_phone,
               s.display_name as store_name, s.logo as store_logo, s.verified_at as store_verified
        FROM wholesale_products p
        INNER JOIN users u ON p.seller_id = u.id
        LEFT JOIN stores s ON p.store_id = s.id
        WHERE p.id = ${id} AND p.status = 'active'
      `);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Ürün bulunamadı" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching wholesale product:", error);
      res.status(500).json({ message: "Ürün getirilemedi" });
    }
  });

  // Create wholesale product
  app.post("/api/wholesale/products", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      if (!userId) return res.status(401).json({ message: "Giriş yapmalısınız" });

      const {
        storeId, productType, title, description, origin, unit,
        minOrder, pricePerUnit, bulkPricing, availableQuantity,
        images, certifications, isCertified, deliveryZones
      } = req.body ?? {};

      const result = await db.execute(sql`
        INSERT INTO wholesale_products
        (seller_id, store_id, product_type, title, description, origin, unit,
         min_order, price_per_unit, bulk_pricing, available_quantity,
         images, certifications, is_certified, delivery_zones)
        VALUES (${userId}, ${storeId ?? null},
                ${productType}, ${title}, ${description ?? null},
                ${origin ?? null}, ${unit},
                ${minOrder}, ${pricePerUnit},
                ${JSON.stringify(bulkPricing || [])}::jsonb,
                ${availableQuantity ?? null},
                ${JSON.stringify(images || [])}::jsonb,
                ${JSON.stringify(certifications || [])}::jsonb,
                ${isCertified || false},
                ${JSON.stringify(deliveryZones || [])}::jsonb)
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error creating wholesale product:", error);
      res.status(500).json({ message: "Ürün oluşturulamadı" });
    }
  });

  // Create wholesale order
  app.post("/api/wholesale/orders", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      if (!userId) return res.status(401).json({ message: "Giriş yapmalısınız" });

      const { productId, quantity, deliveryAddress, deliveryCity, deliveryNotes } = req.body ?? {};

      const productResult = await db.execute(sql`
        SELECT * FROM wholesale_products WHERE id = ${productId} AND status = 'active'
      `);
      if (productResult.rows.length === 0) {
        return res.status(404).json({ message: "Ürün bulunamadı" });
      }

      const product: any = productResult.rows[0];

      if (quantity < product.min_order) {
        return res.status(400).json({ message: `Minimum sipariş miktarı: ${product.min_order}` });
      }

      // Calculate price with bulk pricing
      let unitPrice = parseFloat(product.price_per_unit);
      const bulkPricing = product.bulk_pricing || [];
      for (const pricing of bulkPricing) {
        if (quantity >= pricing.minQuantity) {
          unitPrice = pricing.pricePerUnit;
        }
      }

      const totalPrice = unitPrice * quantity;

      const result = await db.execute(sql`
        INSERT INTO wholesale_orders
        (product_id, buyer_id, seller_id, quantity, unit_price, total_price,
         delivery_address, delivery_city, delivery_notes)
        VALUES (${productId}, ${userId}, ${product.seller_id},
                ${quantity}, ${unitPrice}, ${totalPrice},
                ${deliveryAddress ?? null}, ${deliveryCity ?? null}, ${deliveryNotes ?? null})
        RETURNING *
      `);

      await db.execute(sql`UPDATE wholesale_products SET order_count = order_count + 1 WHERE id = ${productId}`);

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error creating wholesale order:", error);
      res.status(500).json({ message: "Sipariş oluşturulamadı" });
    }
  });

  // Get my wholesale orders
  app.get("/api/wholesale/my-orders", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      if (!userId) return res.status(401).json({ message: "Giriş yapmalısınız" });

      const result = await db.execute(sql`
        SELECT o.*,
               p.title as product_title, p.product_type, p.images as product_images,
               u.first_name as seller_first_name, u.last_name as seller_last_name
        FROM wholesale_orders o
        INNER JOIN wholesale_products p ON o.product_id = p.id
        INNER JOIN users u ON o.seller_id = u.id
        WHERE o.buyer_id = ${userId}
        ORDER BY o.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching my orders:", error);
      res.status(500).json({ message: "Siparişler getirilemedi" });
    }
  });

  // Rate wholesale order
  app.post("/api/wholesale/orders/:id/rate", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      if (!userId) return res.status(401).json({ message: "Giriş yapmalısınız" });

      const { id } = req.params;
      const { rating, review } = req.body ?? {};

      const result = await db.execute(sql`
        UPDATE wholesale_orders
        SET buyer_rating = ${rating}, buyer_review = ${review ?? null}, updated_at = NOW()
        WHERE id = ${id} AND buyer_id = ${userId} AND status = 'delivered'
        RETURNING product_id
      `);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Sipariş bulunamadı veya değerlendirilemez" });
      }

      const productId = (result.rows[0] as any).product_id;
      await db.execute(sql`
        UPDATE wholesale_products p
        SET rating = (
          SELECT AVG(buyer_rating) FROM wholesale_orders
          WHERE product_id = ${productId} AND buyer_rating IS NOT NULL
        ),
        review_count = (
          SELECT COUNT(*) FROM wholesale_orders
          WHERE product_id = ${productId} AND buyer_rating IS NOT NULL
        )
        WHERE id = ${productId}
      `);

      res.json({ success: true });
    } catch (error) {
      console.error("Error rating order:", error);
      res.status(500).json({ message: "Değerlendirme kaydedilemedi" });
    }
  });
}

// ============ FARM TV STREAMING API (Infrastructure Only - Not Active) ============
export function registerFarmTVRoutes(app: Express) {
  // Note: Farm TV is infrastructure only - activation requires explicit user request

  // Get scheduled/live streams
  app.get("/api/farm-tv/streams", async (req: Request, res: Response) => {
    try {
      const { status, category } = req.query;

      const kosullar = [sql`s.is_enabled = true`];
      if (status) kosullar.push(sql`s.status = ${status}`);
      if (category) kosullar.push(sql`s.category ILIKE ${"%" + category + "%"}`);

      const result = await db.execute(sql`
        SELECT s.*,
               u.first_name, u.last_name, u.profile_image_url
        FROM farm_tv_streams s
        INNER JOIN users u ON s.streamer_id = u.id
        WHERE ${sql.join(kosullar, sql` AND `)}
        ORDER BY
          CASE s.status
            WHEN 'live' THEN 1
            WHEN 'scheduled' THEN 2
            ELSE 3
          END,
          s.scheduled_at ASC
      `);
      // stream_key = RTMP özel yayın anahtarı; herkese açık uçta ASLA
      // dönmemeli (yalnız yayın sahibine, oluşturma yanıtında verilir).
      res.json(result.rows.map(({ stream_key, ...r }: any) => r));
    } catch (error) {
      console.error("Error fetching streams:", error);
      res.status(500).json({ message: "Yayınlar getirilemedi" });
    }
  });

  // Get single stream
  app.get("/api/farm-tv/streams/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await db.execute(sql`UPDATE farm_tv_streams SET total_views = total_views + 1 WHERE id = ${id}`);

      const result = await db.execute(sql`
        SELECT s.*,
               u.first_name, u.last_name, u.profile_image_url
        FROM farm_tv_streams s
        INNER JOIN users u ON s.streamer_id = u.id
        WHERE s.id = ${id}
      `);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Yayın bulunamadı" });
      }
      // stream_key (RTMP özel anahtarı) herkese açık uçtan çıkarılır.
      const { stream_key, ...yayin } = result.rows[0] as any;
      res.json(yayin);
    } catch (error) {
      console.error("Error fetching stream:", error);
      res.status(500).json({ message: "Yayın getirilemedi" });
    }
  });

  // Create stream (infrastructure - not publicly accessible until enabled)
  app.post("/api/farm-tv/streams", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      if (!userId) return res.status(401).json({ message: "Giriş yapmalısınız" });

      const { title, description, category, scheduledAt } = req.body ?? {};

      // Generate unique stream key (timestamp değil, çakışmayan rastgele değer)
      const streamKey = `farm_${userId}_${Math.random().toString(36).slice(2)}`;

      const result = await db.execute(sql`
        INSERT INTO farm_tv_streams
        (streamer_id, title, description, category, stream_key, scheduled_at, is_enabled)
        VALUES (${userId}, ${title},
                ${description ?? null}, ${category ?? null},
                ${streamKey}, ${scheduledAt ?? null}, false)
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error creating stream:", error);
      res.status(500).json({ message: "Yayın oluşturulamadı" });
    }
  });

  // Send gift to stream
  app.post("/api/farm-tv/streams/:id/gift", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      if (!userId) return res.status(401).json({ message: "Giriş yapmalısınız" });

      const { id } = req.params;
      const { giftType, giftName, quantity, tokenValue, message } = req.body ?? {};

      const adet = Number(quantity) || 1;
      const jeton = Number(tokenValue) || 0;

      const result = await db.execute(sql`
        INSERT INTO farm_tv_gifts
        (stream_id, sender_id, gift_type, gift_name, quantity, token_value, message)
        VALUES (${id}, ${userId}, ${giftType}, ${giftName},
                ${adet}, ${jeton}, ${message ?? null})
        RETURNING *
      `);

      await db.execute(sql`
        UPDATE farm_tv_streams
        SET total_gifts = total_gifts + ${adet},
            total_earnings = total_earnings + ${jeton * adet}
        WHERE id = ${id}
      `);

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error sending gift:", error);
      res.status(500).json({ message: "Hediye gönderilemedi" });
    }
  });
}

// ============ PROFESSIONAL VERIFICATION API ============
/*
 * Meslek doğrulama: sitedeki tek "meslek sahibi olma" kapısı.
 *
 * Önceki sürüm baştan sona ham SQL metniyle yazılmıştı (`sql.raw` içine
 * şablon dizesiyle gömülen istek verisi). İki ayrı sorun vardı:
 *
 *   1. SQL ENJEKSİYONU. `professionalType`, `documentType` ve yönetici
 *      listesindeki `status`/`type` süzgeçleri hiç kaçışlanmadan sorguya
 *      giriyordu. `db.execute` basit sorgu protokolü kullandığı için
 *      noktalı virgülle ikinci bir ifade eklemek mümkündü.
 *   2. Tablo `professional_verifications` şemada tanımlı DEĞİLDİ; veritabanında
 *      hiç oluşturulmamıştı, dolayısıyla beş ucun tamamı 500 dönüyordu.
 *      Veteriner/nakliyeci rolüne geçiş yalnızca buradan mümkün olduğu için
 *      hizmetler bölümü baştan beri boştu.
 *
 * Artık tablo şemada (`shared/schema.ts`) ve tüm sorgular Drizzle ile
 * parametreli.
 */

/** Onaylanan meslek türünün karşılığı olan kullanıcı rolü. */
const MESLEK_ROLU: Record<string, "vet" | "transporter" | undefined> = {
  veterinarian: "vet",
  transporter: "transporter",
  // b2b_seller ve dairy_seller ayrı bir rol gerektirmiyor; rozet olarak
  // gösteriliyorlar.
};

const GECERLI_MESLEKLER = ["veterinarian", "transporter", "b2b_seller", "dairy_seller"];

export function registerVerificationRoutes(app: Express) {
  // Submit a verification request
  app.post("/api/verify/request", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      if (!userId) return res.status(401).json({ message: "Giriş yapmalısınız" });

      const { professionalType, documentType, documentNumber, issuingAuthority, documentUrl, documentKey, notes } = req.body ?? {};

      if (!professionalType || !documentType) {
        return res.status(400).json({ message: "Meslek türü ve belge türü zorunludur" });
      }

      if (!GECERLI_MESLEKLER.includes(professionalType)) {
        return res.status(400).json({ message: "Geçersiz meslek türü" });
      }

      const [mevcut] = await db
        .select({ id: professionalVerifications.id, status: professionalVerifications.status })
        .from(professionalVerifications)
        .where(
          and(
            eq(professionalVerifications.userId, userId),
            eq(professionalVerifications.professionalType, professionalType),
            inArray(professionalVerifications.status, ["pending", "approved"]),
          ),
        )
        .limit(1);

      if (mevcut) {
        return res.status(409).json({
          message: mevcut.status === "approved"
            ? "Bu meslek türü için zaten onaylanmış bir doğrulama var"
            : "Bu meslek türü için bekleyen bir doğrulama talebi zaten var",
        });
      }

      const [olusan] = await db
        .insert(professionalVerifications)
        .values({
          userId,
          professionalType,
          documentType,
          documentNumber: documentNumber || null,
          issuingAuthority: issuingAuthority || null,
          documentUrl: documentUrl || null,
          documentKey: documentKey || null,
          notes: notes || null,
          // Durum istekten ALINMAZ: başvuru her zaman incelemeye girer.
          status: "pending",
        })
        .returning();

      res.json({ success: true, verification: olusan });
    } catch (error) {
      console.error("Error creating verification request:", error);
      res.status(500).json({ message: "Doğrulama talebi oluşturulamadı" });
    }
  });

  // Get own verification status
  app.get("/api/verify/status", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      if (!userId) return res.status(401).json({ message: "Giriş yapmalısınız" });

      const kayitlar = await db
        .select({
          id: professionalVerifications.id,
          professional_type: professionalVerifications.professionalType,
          document_type: professionalVerifications.documentType,
          document_number: professionalVerifications.documentNumber,
          issuing_authority: professionalVerifications.issuingAuthority,
          notes: professionalVerifications.notes,
          status: professionalVerifications.status,
          admin_notes: professionalVerifications.adminNotes,
          reviewed_at: professionalVerifications.reviewedAt,
          created_at: professionalVerifications.createdAt,
          reviewer_first_name: users.firstName,
          reviewer_last_name: users.lastName,
        })
        .from(professionalVerifications)
        .leftJoin(users, eq(professionalVerifications.reviewedBy, users.id))
        .where(eq(professionalVerifications.userId, userId))
        .orderBy(desc(professionalVerifications.createdAt));

      res.json(kayitlar);
    } catch (error) {
      console.error("Error fetching verification status:", error);
      res.status(500).json({ message: "Doğrulama durumu getirilemedi" });
    }
  });

  // Admin: List all verification requests
  app.get("/api/admin/verifications", isAuthenticated, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { status, type } = req.query as { status?: string; type?: string };

      const kosullar = [];
      // Süzgeçler beyaz listeden geçer; serbest metin sorguya girmez.
      if (status && ["pending", "approved", "rejected"].includes(status)) {
        kosullar.push(eq(professionalVerifications.status, status as any));
      }
      if (type && GECERLI_MESLEKLER.includes(type)) {
        kosullar.push(eq(professionalVerifications.professionalType, type));
      }

      const kayitlar = await db
        .select({
          id: professionalVerifications.id,
          user_id: professionalVerifications.userId,
          professional_type: professionalVerifications.professionalType,
          document_type: professionalVerifications.documentType,
          document_number: professionalVerifications.documentNumber,
          issuing_authority: professionalVerifications.issuingAuthority,
          document_url: professionalVerifications.documentUrl,
          notes: professionalVerifications.notes,
          status: professionalVerifications.status,
          admin_notes: professionalVerifications.adminNotes,
          reviewed_at: professionalVerifications.reviewedAt,
          created_at: professionalVerifications.createdAt,
          first_name: users.firstName,
          last_name: users.lastName,
          email: users.email,
          city: users.city,
        })
        .from(professionalVerifications)
        .innerJoin(users, eq(professionalVerifications.userId, users.id))
        .where(kosullar.length ? and(...kosullar) : undefined)
        .orderBy(
          sql`CASE ${professionalVerifications.status} WHEN 'pending' THEN 0 WHEN 'rejected' THEN 1 ELSE 2 END`,
          desc(professionalVerifications.createdAt),
        );

      res.json(kayitlar);
    } catch (error) {
      console.error("Error fetching verifications:", error);
      res.status(500).json({ message: "Doğrulama listesi getirilemedi" });
    }
  });

  // Admin: Approve or reject a verification
  app.patch("/api/admin/verifications/:id", isAuthenticated, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const adminId = getUserId(req.user);
      const { id } = req.params;
      const { status, adminNotes } = req.body ?? {};

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Geçersiz durum" });
      }

      const [guncel] = await db
        .update(professionalVerifications)
        .set({
          status,
          adminNotes: adminNotes || null,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        })
        .where(eq(professionalVerifications.id, id))
        .returning();

      if (!guncel) {
        return res.status(404).json({ message: "Doğrulama talebi bulunamadı" });
      }

      if (status === "approved") {
        /*
         * Onay, kullanıcıya MESLEK ROLÜNÜ verir.
         *
         * Eksik olan halka buydu: klinik veya nakliye hizmeti kaydı açmak
         * `vet`/`transporter` rolü istiyor, rolü değiştiren tek uç ise
         * yönetici paneliydi. Yani belgelerini doğrulatan kullanıcı yine de
         * hizmet veremiyordu. Artık onayla birlikte rol geliyor.
         *
         * Yönetici rolü ASLA düşürülmez; yanlışlıkla kendi yetkisini
         * kaybetmek istemeyiz.
         */
        const rol = MESLEK_ROLU[guncel.professionalType];
        if (rol) {
          const [hedef] = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, guncel.userId))
            .limit(1);

          if (hedef && hedef.role !== "admin" && hedef.role !== rol) {
            await db.update(users).set({ role: rol }).where(eq(users.id, guncel.userId));
          }
        }

        // Zaten kayıtlı hizmetleri "doğrulanmış" olarak işaretle.
        if (guncel.professionalType === "veterinarian") {
          await db.update(vetServices).set({ verified: true }).where(eq(vetServices.vetId, guncel.userId));
        } else if (guncel.professionalType === "transporter") {
          await db.update(transportServices).set({ verified: true }).where(eq(transportServices.transporterId, guncel.userId));
        }
      }

      // Başvuru sahibi sonucu öğrenmeli.
      try {
        await db.insert(notifications).values({
          userId: guncel.userId,
          type: "system",
          title: status === "approved" ? "Meslek Doğrulaması Onaylandı" : "Meslek Doğrulaması Reddedildi",
          message: status === "approved"
            ? "Belgeleriniz onaylandı. Artık hizmet kaydı oluşturabilirsiniz."
            : `Doğrulama başvurunuz onaylanmadı${guncel.adminNotes ? ": " + guncel.adminNotes : "."}`,
          link: "/panel/dogrulama",
          relatedId: guncel.id,
        });
      } catch (bildirimHatasi) {
        console.error("Failed to create verification notification:", bildirimHatasi);
      }

      res.json({ success: true, verification: guncel });
    } catch (error) {
      console.error("Error updating verification:", error);
      res.status(500).json({ message: "Doğrulama güncellenemedi" });
    }
  });
}

// Main registration function
export function registerAdvancedFeatureRoutes(app: Express) {
  registerMarketPriceRoutes(app);
  registerVetOnlineRoutes(app);
  registerTransportRoutes(app);
  registerB2BRoutes(app);
  registerWholesaleRoutes(app);
  registerFarmTVRoutes(app);
  registerVerificationRoutes(app);
  
  console.log("Advanced feature routes registered successfully");
}
