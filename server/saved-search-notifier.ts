import { Resend } from "resend";
import { db } from "./db";
import { savedSearches, users, listings, searchNotificationLogs, notifications, categories } from "@shared/schema";
import { eq, and, gt, desc, sql, or, ilike, inArray } from "drizzle-orm";

interface SavedSearchFilter {
  minPrice?: string;
  maxPrice?: string;
  city?: string;
  district?: string;
  categorySlug?: string;
  gender?: string;
  ageCategory?: string;
  breed?: string;
  healthStatus?: string;
  vaccinated?: string;
  neutered?: string;
  pedigree?: string;
  characterTraits?: string[];
  searchQuery?: string;
}

export class SavedSearchNotifier {
  private resend: Resend | null = null;
  private fromEmail: string;
  private isProduction: boolean;
  private checkIntervalMs = 60 * 60 * 1000; // 1 hour
  private notificationCooldownMs = 24 * 60 * 60 * 1000; // 24 hours between notifications

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@sahibindenhayvan.com';
    this.isProduction = process.env.NODE_ENV === 'production' || !!apiKey;
  }

  async start() {
    console.log('🔔 Saved Search Notifier: Starting...');
    
    // Initial check
    await this.checkAndNotify();
    
    // Schedule periodic checks
    setInterval(() => {
      this.checkAndNotify().catch(error => {
        console.error('❌ Saved search notification check failed:', error);
      });
    }, this.checkIntervalMs);
    
    console.log(`🔔 Saved Search Notifier: Running (check every ${this.checkIntervalMs / 60000} minutes)`);
  }

  async checkAndNotify() {
    try {
      // Get saved searches with notifications enabled
      const cooldownTime = new Date(Date.now() - this.notificationCooldownMs);
      
      const activeSearches = await db
        .select({
          search: savedSearches,
          user: {
            id: users.id,
            email: users.email,
            username: users.username,
            firstName: users.firstName,
          },
        })
        .from(savedSearches)
        .innerJoin(users, eq(savedSearches.userId, users.id))
        .where(
          and(
            eq(savedSearches.notifyEnabled, true),
            or(
              sql`${savedSearches.lastNotifiedAt} IS NULL`,
              sql`${savedSearches.lastNotifiedAt} < ${cooldownTime}`
            )
          )
        );

      console.log(`🔔 Found ${activeSearches.length} saved searches with notifications enabled`);

      for (const { search, user } of activeSearches) {
        try {
          await this.processSearch(search, user);
        } catch (error) {
          console.error(`❌ Failed to process saved search ${search.id}:`, error);
        }
      }

      // Cagiran taraf (zamanlanmis gorev ucu) kac kayit islendigini bilmeli.
      return activeSearches.length;
    } catch (error) {
      console.error('❌ Saved search notification check failed:', error);
      return 0;
    }
  }

  private async processSearch(
    search: typeof savedSearches.$inferSelect,
    user: { id: string; email: string | null; username: string | null; firstName: string | null }
  ) {
    const filters = search.filters as SavedSearchFilter;
    
    // Get listings created since last notification
    const sinceDate = search.lastNotifiedAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default 7 days
    
    // Build query conditions based on filters
    const conditions: any[] = [
      eq(listings.status, 'active'),
      gt(listings.createdAt, sinceDate),
    ];

    if (filters.categorySlug) {
      // Find category IDs matching the slug
      const matchingCategories = await db
        .select({ id: categories.id })
        .from(categories)
        .where(ilike(categories.slug, `%${filters.categorySlug}%`));
      
      if (matchingCategories.length > 0) {
        conditions.push(inArray(listings.categoryId, matchingCategories.map(c => c.id)));
      }
    }

    if (filters.city) {
      conditions.push(eq(listings.city, filters.city));
    }

    if (filters.district) {
      conditions.push(eq(listings.district, filters.district));
    }

    if (filters.minPrice) {
      const minPrice = parseFloat(filters.minPrice);
      if (!isNaN(minPrice)) {
        conditions.push(sql`CAST(${listings.price} AS DECIMAL) >= ${minPrice}`);
      }
    }

    if (filters.maxPrice) {
      const maxPrice = parseFloat(filters.maxPrice);
      if (!isNaN(maxPrice)) {
        conditions.push(sql`CAST(${listings.price} AS DECIMAL) <= ${maxPrice}`);
      }
    }

    if (filters.gender) {
      conditions.push(eq(listings.gender, filters.gender));
    }

    if (filters.breed) {
      // Türkçe arama — aksansız yazım da eşleşmeli (bkz. scripts/sql/turkce-arama.sql)
      conditions.push(
        sql`public.tr_normalize(coalesce(${listings.breed}, '')) LIKE public.tr_normalize(${`%${filters.breed}%`})`
      );
    }

    if (filters.searchQuery) {
      // Türkçe arama — kayıtlı aramanın metni aksansız yazılmış olabilir
      conditions.push(
        sql`(
          public.tr_normalize(${listings.title}) LIKE public.tr_normalize(${`%${filters.searchQuery}%`})
          OR public.tr_normalize(${listings.description}) LIKE public.tr_normalize(${`%${filters.searchQuery}%`})
        )`
      );
    }

    // Find matching listings
    const matchingListings = await db
      .select({
        id: listings.id,
        title: listings.title,
        price: listings.price,
        city: listings.city,
        images: listings.images,
        createdAt: listings.createdAt,
      })
      .from(listings)
      .where(and(...conditions))
      .orderBy(desc(listings.createdAt))
      .limit(10);

    if (matchingListings.length === 0) {
      console.log(`📭 No new listings for saved search "${search.name}"`);
      return;
    }

    console.log(`📬 Found ${matchingListings.length} new listings for saved search "${search.name}"`);

    // Check which listings have already been notified
    const existingLogs = await db
      .select()
      .from(searchNotificationLogs)
      .where(eq(searchNotificationLogs.savedSearchId, search.id))
      .orderBy(desc(searchNotificationLogs.createdAt))
      .limit(1);

    const previouslyNotifiedIds = existingLogs[0]?.matchedListingIds || [];
    const newListings = matchingListings.filter(l => !previouslyNotifiedIds.includes(l.id));

    if (newListings.length === 0) {
      console.log(`📭 No new unique listings for saved search "${search.name}"`);
      return;
    }

    // Send notification
    if (user.email) {
      await this.sendNotificationEmail(user, search, newListings);
    }

    // Create in-app notification
    await db.insert(notifications).values({
      userId: user.id,
      type: "saved_search_match",
      title: `${newListings.length} Yeni İlan Bulundu`,
      message: `"${search.name}" aramanız için ${newListings.length} yeni ilan bulundu.`,
      link: `/ilanlar?${this.buildSearchUrl(filters)}`,
      relatedId: search.id,
      isRead: false,
    });

    // Log notification
    await db.insert(searchNotificationLogs).values({
      savedSearchId: search.id,
      userId: user.id,
      matchedListingIds: newListings.map(l => l.id),
      emailSent: !!user.email && !!this.resend,
      sentAt: new Date(),
    });

    // Update last notified time
    await db
      .update(savedSearches)
      .set({ lastNotifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(savedSearches.id, search.id));
  }

  private async sendNotificationEmail(
    user: { email: string | null; firstName: string | null; username: string | null },
    search: typeof savedSearches.$inferSelect,
    newListings: Array<{
      id: string;
      title: string;
      price: string | null;
      city: string | null;
      images: string[] | null;
    }>
  ) {
    if (!user.email) return;
    if (!this.resend) {
      console.log('📧 [DEV] Would send saved search notification email:');
      console.log(`   To: ${user.email}`);
      console.log(`   Search: ${search.name}`);
      console.log(`   Listings: ${newListings.length}`);
      return;
    }

    const appUrl = process.env.APP_URL || process.env.VITE_APP_URL || 'https://sahibindenhayvan.com';
    const userName = user.firstName || user.username;
    const filters = search.filters as SavedSearchFilter;
    const searchUrl = `${appUrl}/ilanlar?${this.buildSearchUrl(filters)}`;

    const listingsHtml = newListings.slice(0, 5).map(listing => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${listing.images?.[0] ? `<img src="${listing.images[0]}" alt="" style="width: 80px; height: 60px; object-fit: cover; border-radius: 4px;">` : ''}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <a href="${appUrl}/ilan/${listing.id}" style="color: #0066CC; text-decoration: none; font-weight: bold;">
            ${listing.title}
          </a>
          <br>
          <span style="color: #666; font-size: 12px;">${listing.city || ''}</span>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #0066CC;">
          ${listing.price ? `${parseFloat(listing.price).toLocaleString('tr-TR')} ₺` : 'Fiyat Belirtilmemiş'}
        </td>
      </tr>
    `).join('');

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: user.email,
        subject: `${newListings.length} Yeni İlan Bulundu - ${search.name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Kayıtlı Arama Bildirimi</title>
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #0066CC; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Sahibindenhayvan.com</h1>
            </div>
            
            <div style="padding: 30px; background-color: #f5f5f5;">
              <h2 style="color: #333;">Merhaba ${userName},</h2>
              
              <p style="color: #666; line-height: 1.6;">
                <strong>"${search.name}"</strong> kayıtlı aramanız için 
                <strong>${newListings.length}</strong> yeni ilan bulundu!
              </p>
              
              <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; margin: 20px 0;">
                <tbody>
                  ${listingsHtml}
                </tbody>
              </table>
              
              ${newListings.length > 5 ? `
                <p style="color: #666; text-align: center;">
                  ... ve ${newListings.length - 5} ilan daha
                </p>
              ` : ''}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${searchUrl}" 
                   style="background-color: #0066CC; color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                  Tüm İlanları Gör
                </a>
              </div>
              
              <p style="color: #999; font-size: 12px; text-align: center;">
                Bu bildirimi kapatmak için 
                <a href="${appUrl}/panel/kayitli-aramalar" style="color: #0066CC;">kayıtlı aramalar</a> 
                sayfasından ayarlarınızı değiştirebilirsiniz.
              </p>
            </div>
            
            <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
              <p>© 2025 Sahibindenhayvan.com - Tüm hakları saklıdır.</p>
            </div>
          </body>
          </html>
        `,
      });
      
      console.log(`✅ Saved search notification email sent to ${user.email}`);
    } catch (error) {
      console.error('❌ Failed to send saved search notification email:', error);
    }
  }

  private buildSearchUrl(filters: SavedSearchFilter): string {
    const params = new URLSearchParams();
    
    if (filters.categorySlug) params.set('kategori', filters.categorySlug);
    if (filters.city) params.set('sehir', filters.city);
    if (filters.district) params.set('ilce', filters.district);
    if (filters.minPrice) params.set('minFiyat', filters.minPrice);
    if (filters.maxPrice) params.set('maxFiyat', filters.maxPrice);
    if (filters.gender) params.set('cinsiyet', filters.gender);
    if (filters.breed) params.set('irk', filters.breed);
    if (filters.searchQuery) params.set('ara', filters.searchQuery);
    
    return params.toString();
  }
}

// Export singleton instance
export const savedSearchNotifier = new SavedSearchNotifier();
