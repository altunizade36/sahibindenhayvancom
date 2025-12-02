import { db } from "./db";
import { notifications, users, listings, stores, userSettings } from "@shared/schema";
import { eq } from "drizzle-orm";

export type NotificationType = 
  | "new_message" 
  | "listing_approved" 
  | "listing_rejected" 
  | "new_favorite" 
  | "price_drop" 
  | "auction_outbid" 
  | "auction_won" 
  | "auction_ending" 
  | "system"
  | "store_approved"
  | "store_rejected"
  | "new_follower"
  | "new_review";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  relatedId?: string;
}

export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    const userSettingsResult = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, params.userId))
      .limit(1);
    
    const settings = userSettingsResult[0];
    
    const shouldSendInApp = !settings || settings.pushNotifications !== false;
    
    if (shouldSendInApp) {
      await db.insert(notifications).values({
        userId: params.userId,
        type: params.type as any,
        title: params.title,
        message: params.message,
        link: params.link || null,
        relatedId: params.relatedId || null,
      });
    }
    
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

export async function notifyNewMessage(
  recipientId: string, 
  senderName: string, 
  messagePreview: string,
  conversationId?: string
): Promise<void> {
  await createNotification({
    userId: recipientId,
    type: "new_message",
    title: "Yeni Mesaj",
    message: `${senderName}: ${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? '...' : ''}`,
    link: "/mesajlar",
    relatedId: conversationId,
  });
}

export async function notifyListingApproved(
  userId: string, 
  listingTitle: string,
  listingId: string
): Promise<void> {
  await createNotification({
    userId,
    type: "listing_approved",
    title: "İlanınız Onaylandı",
    message: `"${listingTitle}" ilanınız onaylandı ve yayında.`,
    link: `/ilan/${listingId}`,
    relatedId: listingId,
  });
}

export async function notifyListingRejected(
  userId: string, 
  listingTitle: string,
  reason?: string
): Promise<void> {
  await createNotification({
    userId,
    type: "listing_rejected",
    title: "İlanınız Reddedildi",
    message: reason 
      ? `"${listingTitle}" ilanınız reddedildi. Sebep: ${reason}` 
      : `"${listingTitle}" ilanınız reddedildi.`,
    link: "/panel/ilanlarim",
  });
}

export async function notifyNewFavorite(
  listingOwnerId: string, 
  favoritersName: string, 
  listingTitle: string,
  listingId: string
): Promise<void> {
  await createNotification({
    userId: listingOwnerId,
    type: "new_favorite",
    title: "İlanınız Favorilere Eklendi",
    message: `${favoritersName} "${listingTitle}" ilanınızı favorilerine ekledi.`,
    link: `/ilan/${listingId}`,
    relatedId: listingId,
  });
}

export async function notifyPriceDrop(
  userId: string, 
  listingTitle: string, 
  oldPrice: number, 
  newPrice: number,
  listingId: string
): Promise<void> {
  const discount = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
  await createNotification({
    userId,
    type: "price_drop",
    title: "Fiyat Düştü!",
    message: `"${listingTitle}" ilanında %${discount} indirim! Yeni fiyat: ${newPrice.toLocaleString('tr-TR')} TL`,
    link: `/ilan/${listingId}`,
    relatedId: listingId,
  });
}

export async function notifyAuctionOutbid(
  userId: string, 
  auctionTitle: string, 
  newBid: number,
  auctionId: string
): Promise<void> {
  await createNotification({
    userId,
    type: "auction_outbid",
    title: "Teklifiniz Geçildi",
    message: `"${auctionTitle}" açık artırmasında teklifiniz ${newBid.toLocaleString('tr-TR')} TL ile geçildi.`,
    link: `/acik-artirma/${auctionId}`,
    relatedId: auctionId,
  });
}

export async function notifyAuctionWon(
  userId: string, 
  auctionTitle: string, 
  winningBid: number,
  auctionId: string
): Promise<void> {
  await createNotification({
    userId,
    type: "auction_won",
    title: "Açık Artırmayı Kazandınız!",
    message: `"${auctionTitle}" açık artırmasını ${winningBid.toLocaleString('tr-TR')} TL ile kazandınız!`,
    link: `/acik-artirma/${auctionId}`,
    relatedId: auctionId,
  });
}

export async function notifyAuctionEnding(
  userId: string, 
  auctionTitle: string,
  auctionId: string,
  minutesLeft: number
): Promise<void> {
  await createNotification({
    userId,
    type: "auction_ending",
    title: "Açık Artırma Bitiyor",
    message: `"${auctionTitle}" açık artırması ${minutesLeft} dakika içinde sona erecek!`,
    link: `/acik-artirma/${auctionId}`,
    relatedId: auctionId,
  });
}

export async function notifyStoreApproved(
  userId: string, 
  storeName: string,
  storeSlug: string
): Promise<void> {
  await createNotification({
    userId,
    type: "system",
    title: "Mağazanız Onaylandı",
    message: `"${storeName}" mağazanız onaylandı ve yayında!`,
    link: `/magaza/${storeSlug}`,
  });
}

export async function notifyStoreRejected(
  userId: string, 
  storeName: string,
  reason?: string
): Promise<void> {
  await createNotification({
    userId,
    type: "system",
    title: "Mağaza Başvurunuz Reddedildi",
    message: reason 
      ? `"${storeName}" mağaza başvurunuz reddedildi. Sebep: ${reason}` 
      : `"${storeName}" mağaza başvurunuz reddedildi.`,
    link: "/magazam",
  });
}

export async function notifyNewStoreFollower(
  storeOwnerId: string, 
  followerName: string, 
  storeName: string
): Promise<void> {
  await createNotification({
    userId: storeOwnerId,
    type: "system",
    title: "Yeni Takipçi",
    message: `${followerName} "${storeName}" mağazanızı takip etmeye başladı.`,
    link: "/magazam",
  });
}

export async function notifyNewStoreReview(
  storeOwnerId: string, 
  reviewerName: string, 
  storeName: string,
  rating: number,
  storeSlug: string
): Promise<void> {
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
  await createNotification({
    userId: storeOwnerId,
    type: "system",
    title: "Yeni Değerlendirme",
    message: `${reviewerName} "${storeName}" mağazanıza ${stars} puan verdi.`,
    link: `/magaza/${storeSlug}`,
  });
}

export async function notifySystemMessage(
  userId: string, 
  title: string, 
  message: string,
  link?: string
): Promise<void> {
  await createNotification({
    userId,
    type: "system",
    title,
    message,
    link,
  });
}

export async function notifyBulkPriceDrop(
  listingId: string,
  listingTitle: string,
  oldPrice: number,
  newPrice: number,
  excludeUserId?: string
): Promise<void> {
  try {
    const { favorites } = await import("@shared/schema");
    
    const favoriters = await db
      .select({ userId: favorites.userId })
      .from(favorites)
      .where(eq(favorites.listingId, listingId));
    
    const notificationPromises = favoriters
      .filter(f => f.userId !== excludeUserId)
      .map(f => notifyPriceDrop(f.userId, listingTitle, oldPrice, newPrice, listingId));
    
    await Promise.all(notificationPromises);
  } catch (error) {
    console.error("Failed to send bulk price drop notifications:", error);
  }
}
