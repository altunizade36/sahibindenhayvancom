import { describe, it, expect } from '@jest/globals';

describe('Schema Regression Test Suite', () => {
  const baseURL = 'http://localhost:5000';
  let authToken: string;
  let userId: string;
  let testListingId: string;
  let testCategoryId: string;

  describe('1. User Authentication Flow', () => {
    it('should register a new user successfully', async () => {
      const response = await fetch(`${baseURL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: `regtest_${Date.now()}`,
          email: `regtest_${Date.now()}@example.com`,
          password: 'Test123!',
          fullName: 'Regression Test User',
          phone: '+905559876543',
        }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.token).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.id).toBeDefined();
      
      authToken = data.token;
      userId = data.user.id;
    });

    it('should login with existing credentials', async () => {
      const response = await fetch(`${baseURL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'testuser1@example.com',
          password: 'test123',
        }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.token).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const response = await fetch(`${baseURL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        }),
      });
      
      expect(response.status).toBe(401);
    });

    it('should get current user with valid token', async () => {
      const response = await fetch(`${baseURL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(userId);
    });
  });

  describe('2. Category System', () => {
    it('should fetch all categories', async () => {
      const response = await fetch(`${baseURL}/api/categories`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(400);
      
      // Save a category for later tests
      testCategoryId = data[0].id;
    });

    it('should fetch category tree', async () => {
      const response = await fetch(`${baseURL}/api/categories/tree`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data[0]).toHaveProperty('children');
    });

    it('should fetch category statistics', async () => {
      const response = await fetch(`${baseURL}/api/categories/stats`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('categoryId');
      expect(data[0]).toHaveProperty('count');
    });
  });

  describe('3. Listing CRUD with Decimal Fields', () => {
    it('should create listing with number price', async () => {
      const response = await fetch(`${baseURL}/api/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Regression Test Golden Retriever',
          categoryId: testCategoryId,
          price: 7500, // Number format
          age: '3',
          gender: 'male',
          breed: 'Golden Retriever',
          healthStatus: 'healthy',
          vaccinated: true,
          city: 'Istanbul',
          district: 'Kadıköy',
          description: 'Test listing for decimal field validation',
        }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBeDefined();
      expect(data.price).toBeDefined();
      expect(typeof data.price).toBe('string'); // Should be transformed to string
      
      testListingId = data.id;
    });

    it('should create listing with string price', async () => {
      const response = await fetch(`${baseURL}/api/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Test Listing String Price',
          categoryId: testCategoryId,
          price: '5000.50', // String format
          age: '2',
          gender: 'female',
          city: 'Ankara',
          district: 'Çankaya',
          description: 'Test listing with string price',
        }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.price).toBe('5000.50');
    });

    it('should create listing with decimal price', async () => {
      const response = await fetch(`${baseURL}/api/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Test Listing Decimal Price',
          categoryId: testCategoryId,
          price: 3499.99, // Decimal format
          age: '1',
          city: 'Izmir',
          district: 'Karşıyaka',
          description: 'Test listing with decimal price',
        }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.price).toBeDefined();
      expect(parseFloat(data.price)).toBeCloseTo(3499.99, 2);
    });

    it('should fetch listing detail', async () => {
      const response = await fetch(`${baseURL}/api/listings/${testListingId}`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(testListingId);
      expect(data.title).toContain('Regression Test');
    });

    it('should update listing', async () => {
      const response = await fetch(`${baseURL}/api/listings/${testListingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          price: 8000, // Update price
          description: 'Updated description',
        }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.price).toBe('8000');
    });
  });

  describe('4. Advanced Search Filters', () => {
    it('should filter by price range', async () => {
      const response = await fetch(`${baseURL}/api/listings?minPrice=1000&maxPrice=5000`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.listings).toBeDefined();
      expect(data.total).toBeGreaterThan(0);
    });

    it('should filter by age range', async () => {
      const response = await fetch(`${baseURL}/api/listings?minAge=2&maxAge=5`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.listings).toBeDefined();
    });

    it('should filter by gender', async () => {
      const response = await fetch(`${baseURL}/api/listings?gender=male`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.listings).toBeDefined();
      expect(data.total).toBeGreaterThan(0);
    });

    it('should filter by health status', async () => {
      const response = await fetch(`${baseURL}/api/listings?healthStatus=healthy`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.listings).toBeDefined();
    });

    it('should filter by vaccination', async () => {
      const response = await fetch(`${baseURL}/api/listings?vaccinated=true`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.listings).toBeDefined();
    });

    it('should combine multiple filters', async () => {
      const response = await fetch(
        `${baseURL}/api/listings?minPrice=1000&maxPrice=10000&gender=male&vaccinated=true&minAge=1&maxAge=10`
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.listings).toBeDefined();
    });
  });

  describe('5. Hot Listings & Recommendations', () => {
    it('should fetch hot listings', async () => {
      const response = await fetch(`${baseURL}/api/listings/hot`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data.length).toBeLessThanOrEqual(12);
    });

    it('should fetch similar listings', async () => {
      const response = await fetch(`${baseURL}/api/listings/${testListingId}/similar`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeLessThanOrEqual(4);
    });
  });

  describe('6. Favorites System', () => {
    let favoriteId: string;

    it('should add listing to favorites', async () => {
      const response = await fetch(`${baseURL}/api/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ listingId: testListingId }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBeDefined();
      favoriteId = data.id;
    });

    it('should fetch user favorites', async () => {
      const response = await fetch(`${baseURL}/api/favorites`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.some((f: any) => f.listingId === testListingId)).toBe(true);
    });

    it('should remove from favorites', async () => {
      const response = await fetch(`${baseURL}/api/favorites/${favoriteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      
      expect(response.status).toBe(200);
    });
  });

  describe('7. Blog System', () => {
    it('should fetch blog posts', async () => {
      const response = await fetch(`${baseURL}/api/blog?limit=10`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.posts).toBeDefined();
      expect(data.total).toBeGreaterThan(0);
      expect(Array.isArray(data.posts)).toBe(true);
    });

    it('should fetch single blog post', async () => {
      // First get a blog post ID
      const listResponse = await fetch(`${baseURL}/api/blog?limit=1`);
      const listData = await listResponse.json();
      const blogId = listData.posts[0].id;
      
      const response = await fetch(`${baseURL}/api/blog/${blogId}`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(blogId);
      expect(data.title).toBeDefined();
    });

    it('should filter blog by category', async () => {
      const response = await fetch(`${baseURL}/api/blog?category=genel-bakım`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.posts).toBeDefined();
    });
  });

  describe('8. Data Consistency Checks', () => {
    it('should have correct listing count', async () => {
      const response = await fetch(`${baseURL}/api/listings?limit=1`);
      const data = await response.json();
      expect(data.total).toBeGreaterThan(500); // We seeded 500 + created some in tests
    });

    it('should have balanced category distribution', async () => {
      const response = await fetch(`${baseURL}/api/categories/stats`);
      const data = await response.json();
      expect(data.length).toBeGreaterThan(300); // Most categories should have listings
    });

    it('should have test users created', async () => {
      // Try logging in with test users
      const response = await fetch(`${baseURL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'testuser50@example.com',
          password: 'test123',
        }),
      });
      expect(response.status).toBe(200);
    });
  });

  describe('9. Cleanup Test Listing', () => {
    it('should delete test listing', async () => {
      const response = await fetch(`${baseURL}/api/listings/${testListingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      
      expect(response.status).toBe(200);
    });

    it('should confirm listing deleted', async () => {
      const response = await fetch(`${baseURL}/api/listings/${testListingId}`);
      expect(response.status).toBe(404);
    });
  });
});
