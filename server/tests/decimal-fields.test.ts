import { describe, it, expect, beforeAll } from '@jest/globals';
import { insertListingSchema, insertAuctionSchema, insertBidSchema, insertTransportServiceSchema } from '@shared/schema';

describe('Decimal Field Validation Tests', () => {
  describe('Listing Price Field', () => {
    it('should accept string price', () => {
      const result = insertListingSchema.safeParse({
        title: 'Test',
        categoryId: 'cat-test',
        sellerId: 'user-test',
        description: 'Test description',
        price: '1500.50',
        city: 'Istanbul',
        district: 'Kadıköy',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.price).toBe('1500.50');
      }
    });

    it('should accept number price and transform to string', () => {
      const result = insertListingSchema.safeParse({
        title: 'Test',
        categoryId: 'cat-test',
        sellerId: 'user-test',
        description: 'Test description',
        price: 1500.50,
        city: 'Istanbul',
        district: 'Kadıköy',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.price).toBe('1500.5');
        expect(typeof result.data.price).toBe('string');
      }
    });

    it('should accept integer price', () => {
      const result = insertListingSchema.safeParse({
        title: 'Test',
        categoryId: 'cat-test',
        sellerId: 'user-test',
        description: 'Test description',
        price: 5000,
        city: 'Istanbul',
        district: 'Kadıköy',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.price).toBe('5000');
      }
    });

    it('should accept zero price', () => {
      const result = insertListingSchema.safeParse({
        title: 'Test',
        categoryId: 'cat-test',
        sellerId: 'user-test',
        description: 'Test description',
        price: 0,
        city: 'Istanbul',
        district: 'Kadıköy',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.price).toBe('0');
      }
    });

    it('should accept large decimal values', () => {
      const result = insertListingSchema.safeParse({
        title: 'Test',
        categoryId: 'cat-test',
        sellerId: 'user-test',
        description: 'Test description',
        price: 99999999.99,
        city: 'Istanbul',
        district: 'Kadıköy',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Auction Price Fields', () => {
    const baseAuction = {
      listingId: 'listing-test',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 86400000).toISOString(),
    };

    it('should accept string startPrice', () => {
      const result = insertAuctionSchema.safeParse({
        ...baseAuction,
        startPrice: '1000.00',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.startPrice).toBe('1000.00');
      }
    });

    it('should accept number startPrice', () => {
      const result = insertAuctionSchema.safeParse({
        ...baseAuction,
        startPrice: 1000,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.startPrice).toBe('1000');
        expect(typeof result.data.startPrice).toBe('string');
      }
    });

    it('should accept optional buyNowPrice as number', () => {
      const result = insertAuctionSchema.safeParse({
        ...baseAuction,
        startPrice: 1000,
        buyNowPrice: 5000,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.buyNowPrice).toBe('5000');
      }
    });

    it('should accept optional minIncrement as string', () => {
      const result = insertAuctionSchema.safeParse({
        ...baseAuction,
        startPrice: 1000,
        minIncrement: '50.00',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minIncrement).toBe('50.00');
      }
    });

    it('should work without optional fields', () => {
      const result = insertAuctionSchema.safeParse({
        ...baseAuction,
        startPrice: 1000,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Bid Amount Field', () => {
    it('should accept string amount', () => {
      const result = insertBidSchema.safeParse({
        auctionId: 'auction-test',
        bidderId: 'user-test',
        amount: '1500.00',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe('1500.00');
      }
    });

    it('should accept number amount', () => {
      const result = insertBidSchema.safeParse({
        auctionId: 'auction-test',
        bidderId: 'user-test',
        amount: 1500,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe('1500');
        expect(typeof result.data.amount).toBe('string');
      }
    });

    it('should accept decimal amount', () => {
      const result = insertBidSchema.safeParse({
        auctionId: 'auction-test',
        bidderId: 'user-test',
        amount: 1500.75,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe('1500.75');
      }
    });
  });

  describe('Transport Service Price Fields', () => {
    const baseService = {
      userId: 'user-test',
      companyName: 'Test Transport',
      phone: '+905551234567',
    };

    it('should accept optional pricePerKm as number', () => {
      const result = insertTransportServiceSchema.safeParse({
        ...baseService,
        pricePerKm: 5.50,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pricePerKm).toBe('5.5');
      }
    });

    it('should accept optional pricePerKm as string', () => {
      const result = insertTransportServiceSchema.safeParse({
        ...baseService,
        pricePerKm: '5.50',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pricePerKm).toBe('5.50');
      }
    });

    it('should accept optional minPrice as number', () => {
      const result = insertTransportServiceSchema.safeParse({
        ...baseService,
        minPrice: 100,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minPrice).toBe('100');
      }
    });

    it('should work without optional price fields', () => {
      const result = insertTransportServiceSchema.safeParse(baseService);
      expect(result.success).toBe(true);
    });

    it('should accept both price fields together', () => {
      const result = insertTransportServiceSchema.safeParse({
        ...baseService,
        pricePerKm: 5.50,
        minPrice: 100,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pricePerKm).toBe('5.5');
        expect(result.data.minPrice).toBe('100');
      }
    });
  });

  describe('Array Field Defaults', () => {
    it('should provide default empty array for images', () => {
      const result = insertListingSchema.safeParse({
        title: 'Test',
        categoryId: 'cat-test',
        sellerId: 'user-test',
        description: 'Test description',
        price: 1000,
        city: 'Istanbul',
        district: 'Kadıköy',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.images).toEqual([]);
      }
    });

    it('should provide default empty array for healthDocuments', () => {
      const result = insertListingSchema.safeParse({
        title: 'Test',
        categoryId: 'cat-test',
        sellerId: 'user-test',
        description: 'Test description',
        price: 1000,
        city: 'Istanbul',
        district: 'Kadıköy',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.healthDocuments).toEqual([]);
      }
    });

    it('should provide default arrays for transport service', () => {
      const result = insertTransportServiceSchema.safeParse({
        userId: 'user-test',
        companyName: 'Test Transport',
        phone: '+905551234567',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.serviceAreas).toEqual([]);
        expect(result.data.vehicleTypes).toEqual([]);
        expect(result.data.animalTypes).toEqual([]);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small decimal values', () => {
      const result = insertListingSchema.safeParse({
        title: 'Test',
        categoryId: 'cat-test',
        sellerId: 'user-test',
        description: 'Test description',
        price: 0.01,
        city: 'Istanbul',
        district: 'Kadıköy',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.price).toBe('0.01');
      }
    });

    it('should handle scientific notation', () => {
      const result = insertListingSchema.safeParse({
        title: 'Test',
        categoryId: 'cat-test',
        sellerId: 'user-test',
        description: 'Test description',
        price: 1e3,
        city: 'Istanbul',
        district: 'Kadıköy',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.price).toBe('1000');
      }
    });

    it('should handle negative prices (if allowed)', () => {
      const result = insertListingSchema.safeParse({
        title: 'Test',
        categoryId: 'cat-test',
        sellerId: 'user-test',
        description: 'Test description',
        price: -100,
        city: 'Istanbul',
        district: 'Kadıköy',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.price).toBe('-100');
      }
    });
  });
});
