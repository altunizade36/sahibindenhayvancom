import type { Express, Request, Response } from "express";
import { db } from "./db";
import { isAuthenticated } from "./replitAuth";
import { sql } from "drizzle-orm";

// Helper to get user ID from request
const getUserId = (user: any): string => {
  if (user?.dbUserId) return user.dbUserId;
  if (user?.claims?.sub) return user.claims.sub;
  if (user?.id) return user.id;
  return '';
};

// ============ MARKET PRICES API ============
export function registerMarketPriceRoutes(app: Express) {
  // Get all market prices with filters
  app.get("/api/market-prices", async (req: Request, res: Response) => {
    try {
      const { type, city, category, limit = "50" } = req.query;
      
      let query = `
        SELECT * FROM market_prices 
        WHERE 1=1
        ${type ? `AND type = '${type}'` : ''}
        ${city ? `AND city ILIKE '%${city}%'` : ''}
        ${category ? `AND category ILIKE '%${category}%'` : ''}
        ORDER BY date DESC 
        LIMIT ${parseInt(limit as string)}
      `;
      
      const result = await db.execute(sql.raw(query));
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
      
      // Get latest unique category prices
      const query = `
        SELECT DISTINCT ON (category, city) 
          id, type, category, city, price, unit, min_price, max_price, 
          change_percent, source, date, created_at
        FROM market_prices 
        ${type ? `WHERE type = '${type}'` : ''}
        ORDER BY category, city, date DESC
      `;
      
      const result = await db.execute(sql.raw(query));
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
      const { city, days = "30" } = req.query;
      
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));
      
      const query = `
        SELECT * FROM market_prices 
        WHERE category = '${category}'
        ${city ? `AND city = '${city}'` : ''}
        AND date >= '${daysAgo.toISOString()}'
        ORDER BY date ASC
      `;
      
      const result = await db.execute(sql.raw(query));
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching price history:", error);
      res.status(500).json({ message: "Fiyat geçmişi getirilemedi" });
    }
  });

  // Admin: Add new market price
  app.post("/api/market-prices", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Yetkiniz yok" });
      }

      const { type, category, city, price, unit, minPrice, maxPrice, changePercent, source } = req.body;
      
      const query = `
        INSERT INTO market_prices (type, category, city, price, unit, min_price, max_price, change_percent, source, date)
        VALUES ('${type}', '${category}', '${city}', ${price}, '${unit}', 
                ${minPrice || 'NULL'}, ${maxPrice || 'NULL'}, ${changePercent || 'NULL'}, 
                ${source ? `'${source}'` : 'NULL'}, NOW())
        RETURNING *
      `;
      
      const result = await db.execute(sql.raw(query));
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
  app.get("/api/vet-online/vets", async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT u.id, u.first_name, u.last_name, u.profile_image_url, u.city,
               vs.specializations, vs.online_consultation_available, 
               vs.consultation_fee, vs.rating, vs.review_count
        FROM users u
        INNER JOIN vet_services vs ON u.id = vs.user_id
        WHERE u.role = 'veterinarian' 
          AND vs.online_consultation_available = true
          AND vs.verified_at IS NOT NULL
        ORDER BY vs.rating DESC NULLS LAST
      `;
      
      const result = await db.execute(sql.raw(query));
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching online vets:", error);
      res.status(500).json({ message: "Veterinerler getirilemedi" });
    }
  });

  // Create consultation request
  app.post("/api/vet-online/consultations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      if (!userId) {
        return res.status(401).json({ message: "Giriş yapmalısınız" });
      }

      const { vetId, type, animalType, animalAge, symptoms, images, scheduledAt } = req.body;
      
      const query = `
        INSERT INTO vet_online_services 
        (vet_id, client_id, type, animal_type, animal_age, symptoms, images, scheduled_at)
        VALUES ('${vetId}', '${userId}', '${type}', 
                ${animalType ? `'${animalType}'` : 'NULL'},
                ${animalAge ? `'${animalAge}'` : 'NULL'},
                ${symptoms ? `'${symptoms}'` : 'NULL'},
                '${JSON.stringify(images || [])}',
                ${scheduledAt ? `'${scheduledAt}'` : 'NULL'})
        RETURNING *
      `;
      
      const result = await db.execute(sql.raw(query));
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error creating consultation:", error);
      res.status(500).json({ message: "Konsültasyon oluşturulamadı" });
    }
  });

  // Get user's consultations
  app.get("/api/vet-online/my-consultations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      if (!userId) {
        return res.status(401).json({ message: "Giriş yapmalısınız" });
      }

      const query = `
        SELECT c.*, 
               u.first_name as vet_first_name, u.last_name as vet_last_name, 
               u.profile_image_url as vet_image
        FROM vet_online_services c
        INNER JOIN users u ON c.vet_id = u.id
        WHERE c.client_id = '${userId}'
        ORDER BY c.created_at DESC
      `;
      
      const result = await db.execute(sql.raw(query));
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching consultations:", error);
      res.status(500).json({ message: "Konsültasyonlar getirilemedi" });
    }
  });

  // Vet: Get pending consultations
  app.get("/api/vet-online/vet-consultations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      if (!userId) {
        return res.status(401).json({ message: "Giriş yapmalısınız" });
      }

      const query = `
        SELECT c.*, 
               u.first_name as client_first_name, u.last_name as client_last_name,
               u.profile_image_url as client_image, u.phone as client_phone
        FROM vet_online_services c
        INNER JOIN users u ON c.client_id = u.id
        WHERE c.vet_id = '${userId}'
        ORDER BY c.created_at DESC
      `;
      
      const result = await db.execute(sql.raw(query));
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching vet consultations:", error);
      res.status(500).json({ message: "Konsültasyonlar getirilemedi" });
    }
  });

  // Update consultation status
  app.patch("/api/vet-online/consultations/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      if (!userId) {
        return res.status(401).json({ message: "Giriş yapmalısınız" });
      }

      const { id } = req.params;
      const { status, diagnosis, prescription, notes, price } = req.body;
      
      const updates: string[] = [];
      if (status) updates.push(`status = '${status}'`);
      if (diagnosis) updates.push(`diagnosis = '${diagnosis}'`);
      if (prescription) updates.push(`prescription = '${prescription}'`);
      if (notes) updates.push(`notes = '${notes}'`);
      if (price) updates.push(`price = ${price}`);
      if (status === 'completed') updates.push(`completed_at = NOW()`);
      updates.push(`updated_at = NOW()`);
      
      const query = `
        UPDATE vet_online_services 
        SET ${updates.join(', ')}
        WHERE id = '${id}' AND (vet_id = '${userId}' OR client_id = '${userId}')
        RETURNING *
      `;
      
      const result = await db.execute(sql.raw(query));
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
      const user = req.user as any;
      const userId = getUserId(user);
      if (!userId) {
        return res.status(401).json({ message: "Giriş yapmalısınız" });
      }

      const { id } = req.params;
      const { rating, review } = req.body;
      
      const query = `
        UPDATE vet_online_services 
        SET rating = ${rating}, review = ${review ? `'${review}'` : 'NULL'}, updated_at = NOW()
        WHERE id = '${id}' AND client_id = '${userId}'
        RETURNING *
      `;
      
      const result = await db.execute(sql.raw(query));
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
      const user = req.user as any;
      const userId = getUserId(user);
      if (!userId) {
        return res.status(401).json({ message: "Giriş yapmalısınız" });
      }

      const { 
        animalType, animalCount, animalWeight,
        originCity, originDistrict, originAddress,
        destinationCity, destinationDistrict, destinationAddress,
        preferredDate, flexibleDate, specialRequirements 
      } = req.body;
      
      const query = `
        INSERT INTO transport_requests 
        (user_id, animal_type, animal_count, animal_weight,
         origin_city, origin_district, origin_address,
         destination_city, destination_district, destination_address,
         preferred_date, flexible_date, special_requirements)
        VALUES ('${userId}', '${animalType}', ${animalCount}, 
                ${animalWeight || 'NULL'},
                '${originCity}', ${originDistrict ? `'${originDistrict}'` : 'NULL'}, 
                ${originAddress ? `'${originAddress}'` : 'NULL'},
                '${destinationCity}', ${destinationDistrict ? `'${destinationDistrict}'` : 'NULL'},
                ${destinationAddress ? `'${destinationAddress}'` : 'NULL'},
                ${preferredDate ? `'${preferredDate}'` : 'NULL'},
                ${flexibleDate !== undefined ? flexibleDate : true},
                ${specialRequirements ? `'${specialRequirements}'` : 'NULL'})
        RETURNING *
      `;
      
      const result = await db.execute(sql.raw(query));
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
      
      let conditions = "r.status = 'pending'";
      if (originCity) conditions += ` AND r.origin_city ILIKE '%${originCity}%'`;
      if (destinationCity) conditions += ` AND r.destination_city ILIKE '%${destinationCity}%'`;
      if (animalType) conditions += ` AND r.animal_type ILIKE '%${animalType}%'`;
      
      const query = `
        SELECT r.*, u.first_name, u.last_name, u.city as user_city
        FROM transport_requests r
        INNER JOIN users u ON r.user_id = u.id
        WHERE ${conditions}
        ORDER BY r.created_at DESC
      `;
      
      const result = await db.execute(sql.raw(query));
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching transport requests:", error);
      res.status(500).json({ message: "Talepler getirilemedi" });
    }
  });

  // Get my transport requests
  app.get("/api/transport/my-requests", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      if (!userId) {
        return res.status(401).json({ message: "Giriş yapmalısınız" });
      }

      const query = `
        SELECT r.*, 
               (SELECT COUNT(*) FROM transport_quotes WHERE request_id = r.id) as quote_count
        FROM transport_requests r
        WHERE r.user_id = '${userId}'
        ORDER BY r.created_at DESC
      `;
      
      const result = await db.execute(sql.raw(query));
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching my requests:", error);
      res.status(500).json({ message: "Talepler getirilemedi" });
    }
  });

  // Submit quote for transport request
  app.post("/api/transport/quotes", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      if (!userId) {
        return res.status(401).json({ message: "Giriş yapmalısınız" });
      }

      const { requestId, price, estimatedDuration, vehicleType, vehicleCapacity, insuranceIncluded, notes, expiresAt } = req.body;
      
      const query = `
        INSERT INTO transport_quotes 
        (request_id, transporter_id, price, estimated_duration, vehicle_type, 
         vehicle_capacity, insurance_included, notes, expires_at)
        VALUES ('${requestId}', '${userId}', ${price}, 
                ${estimatedDuration || 'NULL'}, 
                ${vehicleType ? `'${vehicleType}'` : 'NULL'},
                ${vehicleCapacity ? `'${vehicleCapacity}'` : 'NULL'},
                ${insuranceIncluded || false},
                ${notes ? `'${notes}'` : 'NULL'},
                ${expiresAt ? `'${expiresAt}'` : 'NULL'})
        RETURNING *
      `;
      
      const result = await db.execute(sql.raw(query));
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error submitting quote:", error);
      res.status(500).json({ message: "Teklif gönderilemedi" });
    }
  });

  // Get quotes for a request
  app.get("/api/transport/requests/:id/quotes", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      if (!userId) {
        return res.status(401).json({ message: "Giriş yapmalısınız" });
      }

      const { id } = req.params;
      
      const query = `
        SELECT q.*, 
               u.first_name, u.last_name, u.profile_image_url,
               ts.vehicle_types, ts.service_regions, ts.rating, ts.completed_transports
        FROM transport_quotes q
        INNER JOIN users u ON q.transporter_id = u.id
        LEFT JOIN transport_services ts ON u.id = ts.user_id
        WHERE q.request_id = '${id}'
        ORDER BY q.price ASC
      `;
      
      const result = await db.execute(sql.raw(query));
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ message: "Teklifler getirilemedi" });
    }
  });

  // Accept a quote
  app.post("/api/transport/quotes/:id/accept", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      if (!userId) {
        return res.status(401).json({ message: "Giriş yapmalısınız" });
      }

      const { id } = req.params;
      
      // Get the quote and update request status
      const updateQuote = `
        UPDATE transport_quotes SET is_accepted = true WHERE id = '${id}' RETURNING request_id
      `;
      const quoteResult = await db.execute(sql.raw(updateQuote));
      
      if (quoteResult.rows.length === 0) {
        return res.status(404).json({ message: "Teklif bulunamadı" });
      }
      
      const requestId = (quoteResult.rows[0] as any).request_id;
      
      // Update request status
      const updateRequest = `
        UPDATE transport_requests 
        SET status = 'accepted', accepted_quote_id = '${id}', updated_at = NOW()
        WHERE id = '${requestId}' AND user_id = '${userId}'
        RETURNING *
      `;
      
      const result = await db.execute(sql.raw(updateRequest));
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
      
      let conditions = "l.status = 'active'";
      if (category) conditions += ` AND l.category ILIKE '%${category}%'`;
      if (minQuantity) conditions += ` AND l.available_stock >= ${minQuantity}`;
      if (maxPrice) conditions += ` AND l.price_per_unit <= ${maxPrice}`;
      
      const query = `
        SELECT l.*, 
               u.first_name, u.last_name, u.city as seller_city,
               s.display_name as store_name, s.logo as store_logo, s.verified_at as store_verified
        FROM b2b_listings l
        INNER JOIN users u ON l.seller_id = u.id
        LEFT JOIN stores s ON l.store_id = s.id
        WHERE ${conditions}
        ${city ? `AND u.city ILIKE '%${city}%'` : ''}
        ORDER BY l.created_at DESC
      `;
      
      const result = await db.execute(sql.raw(query));
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
      
      // Increment view count
      await db.execute(sql.raw(`
        UPDATE b2b_listings SET view_count = view_count + 1 WHERE id = '${id}'
      `));
      
      const query = `
        SELECT l.*, 
               u.first_name, u.last_name, u.city as seller_city, u.phone as seller_phone,
               s.display_name as store_name, s.logo as store_logo, s.verified_at as store_verified
        FROM b2b_listings l
        INNER JOIN users u ON l.seller_id = u.id
        LEFT JOIN stores s ON l.store_id = s.id
        WHERE l.id = '${id}'
      `;
      
      const result = await db.execute(sql.raw(query));
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
      const user = req.user as any;
      const userId = getUserId(user);
      if (!userId) {
        return res.status(401).json({ message: "Giriş yapmalısınız" });
      }

      const { 
        storeId, title, description, category, brand, unit, 
        minQuantity, maxQuantity, pricePerUnit, bulkDiscounts,
        availableStock, images, specifications, deliveryOptions 
      } = req.body;
      
      const query = `
        INSERT INTO b2b_listings 
        (seller_id, store_id, title, description, category, brand, unit,
         min_quantity, max_quantity, price_per_unit, bulk_discounts,
         available_stock, images, specifications, delivery_options)
        VALUES ('${userId}', ${storeId ? `'${storeId}'` : 'NULL'}, 
                '${title}', ${description ? `'${description}'` : 'NULL'},
                '${category}', ${brand ? `'${brand}'` : 'NULL'}, '${unit}',
                ${minQuantity}, ${maxQuantity || 'NULL'}, ${pricePerUnit},
                '${JSON.stringify(bulkDiscounts || [])}',
                ${availableStock || 'NULL'},
                '${JSON.stringify(images || [])}',
                '${JSON.stringify(specifications || {})}',
                '${JSON.stringify(deliveryOptions || [])}')
        RETURNING *
      `;
      
      const result = await db.execute(sql.raw(query));
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error creating B2B listing:", error);
      res.status(500).json({ message: "Ürün oluşturulamadı" });
    }
  });

  // Create B2B order
  app.post("/api/b2b/orders", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      if (!userId) {
        return res.status(401).json({ message: "Giriş yapmalısınız" });
      }

      const { listingId, quantity, deliveryAddress, deliveryCity, deliveryNotes } = req.body;
      
      // Get listing details
      const listingQuery = `SELECT * FROM b2b_listings WHERE id = '${listingId}' AND status = 'active'`;
      const listingResult = await db.execute(sql.raw(listingQuery));
      
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
      
      const query = `
        INSERT INTO b2b_orders 
        (listing_id, buyer_id, seller_id, quantity, unit_price, total_price,
         delivery_address, delivery_city, delivery_notes)
        VALUES ('${listingId}', '${userId}', '${listing.seller_id}',
                ${quantity}, ${unitPrice}, ${totalPrice},
                ${deliveryAddress ? `'${deliveryAddress}'` : 'NULL'},
                ${deliveryCity ? `'${deliveryCity}'` : 'NULL'},
                ${deliveryNotes ? `'${deliveryNotes}'` : 'NULL'})
        RETURNING *
      `;
      
      const result = await db.execute(sql.raw(query));
      
      // Update listing order count
      await db.execute(sql.raw(`
        UPDATE b2b_listings SET order_count = order_count + 1 WHERE id = '${listingId}'
      `));
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error creating B2B order:", error);
      res.status(500).json({ message: "Sipariş oluşturulamadı" });
    }
  });

  // Get my B2B orders (as buyer)
  app.get("/api/b2b/my-orders", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      if (!userId) {
        return res.status(401).json({ message: "Giriş yapmalısınız" });
      }

      const query = `
        SELECT o.*, 
               l.title as product_title, l.images as product_images,
               u.first_name as seller_first_name, u.last_name as seller_last_name
        FROM b2b_orders o
        INNER JOIN b2b_listings l ON o.listing_id = l.id
        INNER JOIN users u ON o.seller_id = u.id
        WHERE o.buyer_id = '${userId}'
        ORDER BY o.created_at DESC
      `;
      
      const result = await db.execute(sql.raw(query));
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching my orders:", error);
      res.status(500).json({ message: "Siparişler getirilemedi" });
    }
  });

  // Get orders for my listings (as seller)
  app.get("/api/b2b/seller-orders", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      if (!userId) {
        return res.status(401).json({ message: "Giriş yapmalısınız" });
      }

      const query = `
        SELECT o.*, 
               l.title as product_title,
               u.first_name as buyer_first_name, u.last_name as buyer_last_name,
               u.phone as buyer_phone
        FROM b2b_orders o
        INNER JOIN b2b_listings l ON o.listing_id = l.id
        INNER JOIN users u ON o.buyer_id = u.id
        WHERE o.seller_id = '${userId}'
        ORDER BY o.created_at DESC
      `;
      
      const result = await db.execute(sql.raw(query));
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching seller orders:", error);
      res.status(500).json({ message: "Siparişler getirilemedi" });
    }
  });

  // Update order status
  app.patch("/api/b2b/orders/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      if (!userId) {
        return res.status(401).json({ message: "Giriş yapmalısınız" });
      }

      const { id } = req.params;
      const { status, estimatedDelivery } = req.body;
      
      const updates: string[] = [`updated_at = NOW()`];
      if (status) {
        updates.push(`status = '${status}'`);
        if (status === 'delivered') updates.push(`delivered_at = NOW()`);
      }
      if (estimatedDelivery) updates.push(`estimated_delivery = '${estimatedDelivery}'`);
      
      const query = `
        UPDATE b2b_orders 
        SET ${updates.join(', ')}
        WHERE id = '${id}' AND seller_id = '${userId}'
        RETURNING *
      `;
      
      const result = await db.execute(sql.raw(query));
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
      
      let conditions = "p.status = 'active'";
      if (type) conditions += ` AND p.product_type ILIKE '%${type}%'`;
      if (certified === 'true') conditions += ` AND p.is_certified = true`;
      if (minQuantity) conditions += ` AND p.available_quantity >= ${minQuantity}`;
      
      const query = `
        SELECT p.*, 
               u.first_name, u.last_name, u.city as seller_city,
               s.display_name as store_name, s.logo as store_logo
        FROM wholesale_products p
        INNER JOIN users u ON p.seller_id = u.id
        LEFT JOIN stores s ON p.store_id = s.id
        WHERE ${conditions}
        ${city ? `AND u.city ILIKE '%${city}%'` : ''}
        ORDER BY p.is_certified DESC, p.rating DESC, p.created_at DESC
      `;
      
      const result = await db.execute(sql.raw(query));
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
      
      const query = `
        SELECT p.*, 
               u.first_name, u.last_name, u.city as seller_city, u.phone as seller_phone,
               s.display_name as store_name, s.logo as store_logo, s.verified_at as store_verified
        FROM wholesale_products p
        INNER JOIN users u ON p.seller_id = u.id
        LEFT JOIN stores s ON p.store_id = s.id
        WHERE p.id = '${id}'
      `;
      
      const result = await db.execute(sql.raw(query));
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
      const user = req.user as any;
      const userId = getUserId(user);
      if (!userId) {
        return res.status(401).json({ message: "Giriş yapmalısınız" });
      }

      const { 
        storeId, productType, title, description, origin, unit,
        minOrder, pricePerUnit, bulkPricing, availableQuantity,
        images, certifications, isCertified, deliveryZones 
      } = req.body;
      
      const query = `
        INSERT INTO wholesale_products 
        (seller_id, store_id, product_type, title, description, origin, unit,
         min_order, price_per_unit, bulk_pricing, available_quantity,
         images, certifications, is_certified, delivery_zones)
        VALUES ('${userId}', ${storeId ? `'${storeId}'` : 'NULL'},
                '${productType}', '${title}', ${description ? `'${description}'` : 'NULL'},
                ${origin ? `'${origin}'` : 'NULL'}, '${unit}',
                ${minOrder}, ${pricePerUnit},
                '${JSON.stringify(bulkPricing || [])}',
                ${availableQuantity || 'NULL'},
                '${JSON.stringify(images || [])}',
                '${JSON.stringify(certifications || [])}',
                ${isCertified || false},
                '${JSON.stringify(deliveryZones || [])}')
        RETURNING *
      `;
      
      const result = await db.execute(sql.raw(query));
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error creating wholesale product:", error);
      res.status(500).json({ message: "Ürün oluşturulamadı" });
    }
  });

  // Create wholesale order
  app.post("/api/wholesale/orders", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      if (!userId) {
        return res.status(401).json({ message: "Giriş yapmalısınız" });
      }

      const { productId, quantity, deliveryAddress, deliveryCity, deliveryNotes } = req.body;
      
      // Get product details
      const productQuery = `SELECT * FROM wholesale_products WHERE id = '${productId}' AND status = 'active'`;
      const productResult = await db.execute(sql.raw(productQuery));
      
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
      
      const query = `
        INSERT INTO wholesale_orders 
        (product_id, buyer_id, seller_id, quantity, unit_price, total_price,
         delivery_address, delivery_city, delivery_notes)
        VALUES ('${productId}', '${userId}', '${product.seller_id}',
                ${quantity}, ${unitPrice}, ${totalPrice},
                '${deliveryAddress}', '${deliveryCity}',
                ${deliveryNotes ? `'${deliveryNotes}'` : 'NULL'})
        RETURNING *
      `;
      
      const result = await db.execute(sql.raw(query));
      
      // Update product order count
      await db.execute(sql.raw(`
        UPDATE wholesale_products SET order_count = order_count + 1 WHERE id = '${productId}'
      `));
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error creating wholesale order:", error);
      res.status(500).json({ message: "Sipariş oluşturulamadı" });
    }
  });

  // Get my wholesale orders
  app.get("/api/wholesale/my-orders", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      if (!userId) {
        return res.status(401).json({ message: "Giriş yapmalısınız" });
      }

      const query = `
        SELECT o.*, 
               p.title as product_title, p.product_type, p.images as product_images,
               u.first_name as seller_first_name, u.last_name as seller_last_name
        FROM wholesale_orders o
        INNER JOIN wholesale_products p ON o.product_id = p.id
        INNER JOIN users u ON o.seller_id = u.id
        WHERE o.buyer_id = '${userId}'
        ORDER BY o.created_at DESC
      `;
      
      const result = await db.execute(sql.raw(query));
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching my orders:", error);
      res.status(500).json({ message: "Siparişler getirilemedi" });
    }
  });

  // Rate wholesale order
  app.post("/api/wholesale/orders/:id/rate", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      if (!userId) {
        return res.status(401).json({ message: "Giriş yapmalısınız" });
      }

      const { id } = req.params;
      const { rating, review } = req.body;
      
      // Update order with rating
      const updateOrder = `
        UPDATE wholesale_orders 
        SET buyer_rating = ${rating}, buyer_review = ${review ? `'${review}'` : 'NULL'}, updated_at = NOW()
        WHERE id = '${id}' AND buyer_id = '${userId}' AND status = 'delivered'
        RETURNING product_id
      `;
      
      const result = await db.execute(sql.raw(updateOrder));
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Sipariş bulunamadı veya değerlendirilemez" });
      }
      
      // Update product rating
      const productId = (result.rows[0] as any).product_id;
      const updateRating = `
        UPDATE wholesale_products p
        SET rating = (
          SELECT AVG(buyer_rating) FROM wholesale_orders 
          WHERE product_id = '${productId}' AND buyer_rating IS NOT NULL
        ),
        review_count = (
          SELECT COUNT(*) FROM wholesale_orders 
          WHERE product_id = '${productId}' AND buyer_rating IS NOT NULL
        )
        WHERE id = '${productId}'
      `;
      await db.execute(sql.raw(updateRating));
      
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
      
      let conditions = "s.is_enabled = true";
      if (status) conditions += ` AND s.status = '${status}'`;
      if (category) conditions += ` AND s.category ILIKE '%${category}%'`;
      
      const query = `
        SELECT s.*, 
               u.first_name, u.last_name, u.profile_image_url
        FROM farm_tv_streams s
        INNER JOIN users u ON s.streamer_id = u.id
        WHERE ${conditions}
        ORDER BY 
          CASE s.status 
            WHEN 'live' THEN 1 
            WHEN 'scheduled' THEN 2 
            ELSE 3 
          END,
          s.scheduled_at ASC
      `;
      
      const result = await db.execute(sql.raw(query));
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching streams:", error);
      res.status(500).json({ message: "Yayınlar getirilemedi" });
    }
  });

  // Get single stream
  app.get("/api/farm-tv/streams/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Increment view count
      await db.execute(sql.raw(`
        UPDATE farm_tv_streams SET total_views = total_views + 1 WHERE id = '${id}'
      `));
      
      const query = `
        SELECT s.*, 
               u.first_name, u.last_name, u.profile_image_url
        FROM farm_tv_streams s
        INNER JOIN users u ON s.streamer_id = u.id
        WHERE s.id = '${id}'
      `;
      
      const result = await db.execute(sql.raw(query));
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Yayın bulunamadı" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching stream:", error);
      res.status(500).json({ message: "Yayın getirilemedi" });
    }
  });

  // Create stream (infrastructure - not publicly accessible until enabled)
  app.post("/api/farm-tv/streams", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      if (!userId) {
        return res.status(401).json({ message: "Giriş yapmalısınız" });
      }

      // Check if Farm TV is enabled for this user
      const { title, description, category, scheduledAt } = req.body;
      
      // Generate unique stream key
      const streamKey = `farm_${userId}_${Date.now()}`;
      
      const query = `
        INSERT INTO farm_tv_streams 
        (streamer_id, title, description, category, stream_key, scheduled_at, is_enabled)
        VALUES ('${userId}', '${title}', 
                ${description ? `'${description}'` : 'NULL'},
                ${category ? `'${category}'` : 'NULL'},
                '${streamKey}',
                ${scheduledAt ? `'${scheduledAt}'` : 'NULL'},
                false)
        RETURNING *
      `;
      
      const result = await db.execute(sql.raw(query));
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error creating stream:", error);
      res.status(500).json({ message: "Yayın oluşturulamadı" });
    }
  });

  // Send gift to stream
  app.post("/api/farm-tv/streams/:id/gift", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      if (!userId) {
        return res.status(401).json({ message: "Giriş yapmalısınız" });
      }

      const { id } = req.params;
      const { giftType, giftName, quantity, tokenValue, message } = req.body;
      
      const query = `
        INSERT INTO farm_tv_gifts 
        (stream_id, sender_id, gift_type, gift_name, quantity, token_value, message)
        VALUES ('${id}', '${userId}', '${giftType}', '${giftName}',
                ${quantity || 1}, ${tokenValue}, ${message ? `'${message}'` : 'NULL'})
        RETURNING *
      `;
      
      const result = await db.execute(sql.raw(query));
      
      // Update stream gift stats
      await db.execute(sql.raw(`
        UPDATE farm_tv_streams 
        SET total_gifts = total_gifts + ${quantity || 1},
            total_earnings = total_earnings + ${tokenValue * (quantity || 1)}
        WHERE id = '${id}'
      `));
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error sending gift:", error);
      res.status(500).json({ message: "Hediye gönderilemedi" });
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
  
  console.log("Advanced feature routes registered successfully");
}
