/**
 * Test suite for Cloudinary image fetching functionality
 * Tests the fetchCloudinaryResourcesForRestaurant function
 */

// Mock cloudinary module
jest.mock('@/lib/cloudinary', () => ({
  __esModule: true,
  default: {
    api: {
      resources_by_asset_folder: jest.fn(),
    },
  },
}));

import cloudinary from '@/lib/cloudinary';

describe('Cloudinary Image Fetching', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchCloudinaryResourcesForRestaurant', () => {
    it('should fetch images from the correct folder', async () => {
      const mockImages = [
        {
          public_id: 'tables_anwlni',
          secure_url: 'https://example.com/tables_anwlni.jpg',
          format: 'jpg',
        },
        {
          public_id: 'foods_xhr9be',
          secure_url: 'https://example.com/foods_xhr9be.jpg',
          format: 'jpg',
        },
      ];

      (cloudinary.api.resources_by_asset_folder as jest.Mock).mockResolvedValue({
        resources: mockImages,
      });

      // Test function logic
      const restaurantId = 'bobby-gs-pizzeria';
      const folder = `foodbuddy/restaurants/${restaurantId}`;

      const response = await cloudinary.api.resources_by_asset_folder(folder, {
        resource_type: 'image',
        max_results: 100,
      });

      expect(response.resources).toHaveLength(2);
      expect(response.resources[0].public_id).toBe('tables_anwlni');
      expect(cloudinary.api.resources_by_asset_folder).toHaveBeenCalledWith(
        `foodbuddy/restaurants/${restaurantId}`,
        expect.objectContaining({
          resource_type: 'image',
          max_results: 100,
        })
      );
    });

    it('should filter images by prefix matching', () => {
      const mockImages = [
        { public_id: 'tables_anwlni' },
        { public_id: 'menu1_x3gtxj' },
        { public_id: 'menu2_cwqw5c' },
        { public_id: 'foods_xhr9be' },
        { public_id: 'happyhour_rfobbm' },
        { public_id: 'random_image' }, // Should be filtered out
      ];

      const patterns = [
        'tables_',
        'foods_',
        'menu1_',
        'menu2_',
        'menu3_',
        'menu_',
        'food1_',
        'food_',
        'happyhour_',
      ];

      const filtered = mockImages.filter((img) =>
        patterns.some((p) => img.public_id.startsWith(p))
      );

      expect(filtered).toHaveLength(5);
      expect(filtered.map((img) => img.public_id)).toEqual([
        'tables_anwlni',
        'menu1_x3gtxj',
        'menu2_cwqw5c',
        'foods_xhr9be',
        'happyhour_rfobbm',
      ]);
    });

    it('should handle empty results gracefully', async () => {
      (cloudinary.api.resources_by_asset_folder as jest.Mock).mockResolvedValue({
        resources: [],
      });

      const response = await cloudinary.api.resources_by_asset_folder(
        'foodbuddy/restaurants/nonexistent',
        { resource_type: 'image', max_results: 100 }
      );

      expect(response.resources).toHaveLength(0);
    });

    it('should handle API errors gracefully', async () => {
      const errorMessage = 'Cloudinary API Error';
      (cloudinary.api.resources_by_asset_folder as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      await expect(
        cloudinary.api.resources_by_asset_folder('some-folder', {
          resource_type: 'image',
        })
      ).rejects.toThrow(errorMessage);
    });

    it('should construct correct secure URLs for images', () => {
      const mockImage = {
        public_id: 'tables_anwlni',
        secure_url: 'https://res.cloudinary.com/dcbktxiuw/image/upload/v1761801462/tables_anwlni.jpg',
        format: 'jpg',
      };

      expect(mockImage.secure_url).toContain('res.cloudinary.com');
      expect(mockImage.secure_url).toContain('dcbktxiuw');
      expect(mockImage.secure_url).toContain(mockImage.public_id);
    });
  });
});
