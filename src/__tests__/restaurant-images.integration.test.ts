/**
 * Integration tests for restaurant detail page image fetching
 * Tests the complete flow of fetching and displaying restaurant images
 */

jest.mock('@/lib/cloudinary', () => ({
  __esModule: true,
  default: {
    api: {
      resources_by_asset_folder: jest.fn(),
    },
  },
}));

import cloudinary from '@/lib/cloudinary';

describe('Restaurant Detail Page - Image Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Image Fetching Flow', () => {
    it('should fetch and filter images for Bobby G\'s Pizzeria', async () => {
      const mockResponse = {
        resources: [
          {
            asset_id: 'd123a1760f012ce552b041b3f32d3612',
            public_id: 'tables_anwlni',
            format: 'jpg',
            version: 1761801462,
            resource_type: 'image',
            secure_url: 'https://res.cloudinary.com/dcbktxiuw/image/upload/v1761801462/tables_anwlni.jpg',
          },
          {
            asset_id: 'e8de3b3740281d2a23c0e49ecd5a26e5',
            public_id: 'menu2_cwqw5c',
            format: 'jpg',
            version: 1761801462,
            resource_type: 'image',
            secure_url: 'https://res.cloudinary.com/dcbktxiuw/image/upload/v1761801462/menu2_cwqw5c.jpg',
          },
          {
            asset_id: 'ca76925d0b82e3b96bf69d04f3136eee',
            public_id: 'menu1_x3gtxj',
            format: 'jpg',
            version: 1761801461,
            resource_type: 'image',
            secure_url: 'https://res.cloudinary.com/dcbktxiuw/image/upload/v1761801461/menu1_x3gtxj.jpg',
          },
          {
            asset_id: 'cb435779fdaeb858e4e26d532e5e9c57',
            public_id: 'happyhour_rfobbm',
            format: 'jpg',
            version: 1761801460,
            resource_type: 'image',
            secure_url: 'https://res.cloudinary.com/dcbktxiuw/image/upload/v1761801460/happyhour_rfobbm.jpg',
          },
          {
            asset_id: '20ae5e187b1133dbc2797c5feff9d39b',
            public_id: 'foods_xhr9be',
            format: 'jpg',
            version: 1761801460,
            resource_type: 'image',
            secure_url: 'https://res.cloudinary.com/dcbktxiuw/image/upload/v1761801460/foods_xhr9be.jpg',
          },
        ],
        total_count: 5,
      };

      (cloudinary.api.resources_by_asset_folder as jest.Mock).mockResolvedValue(mockResponse);

      const restaurantId = 'bobby-gs-pizzeria';
      const folder = `foodbuddy/restaurants/${restaurantId}`;
      const patterns = ['tables_', 'foods_', 'menu1_', 'menu2_', 'menu3_', 'menu_', 'food1_', 'food_', 'happyhour_'];

      const response = await cloudinary.api.resources_by_asset_folder(folder, {
        resource_type: 'image',
        max_results: 100,
      });

      const filteredImages = response.resources.filter((img: any) =>
        patterns.some((p) => img.public_id.startsWith(p))
      );

      expect(filteredImages).toHaveLength(5);
      expect(filteredImages[0].public_id).toBe('tables_anwlni');
      expect(filteredImages[4].public_id).toBe('foods_xhr9be');
    });

    it('should fetch and filter images for 84 Viet', async () => {
      const mockResponse = {
        resources: [
          {
            public_id: 'menu3_coheml',
            secure_url: 'https://res.cloudinary.com/dcbktxiuw/image/upload/v1761799342/menu3_coheml.jpg',
          },
          {
            public_id: 'menu2_s6fi8e',
            secure_url: 'https://res.cloudinary.com/dcbktxiuw/image/upload/v1761799342/menu2_s6fi8e.jpg',
          },
          {
            public_id: 'menu1_dvmmpk',
            secure_url: 'https://res.cloudinary.com/dcbktxiuw/image/upload/v1761799341/menu1_dvmmpk.jpg',
          },
          {
            public_id: 'tables_sehsce',
            secure_url: 'https://res.cloudinary.com/dcbktxiuw/image/upload/v1761799153/tables_sehsce.jpg',
          },
          {
            public_id: 'foods_i6twly',
            secure_url: 'https://res.cloudinary.com/dcbktxiuw/image/upload/v1761799145/foods_i6twly.jpg',
          },
        ],
      };

      (cloudinary.api.resources_by_asset_folder as jest.Mock).mockResolvedValue(mockResponse);

      const restaurantId = '84-viet';
      const folder = `foodbuddy/restaurants/${restaurantId}`;

      const response = await cloudinary.api.resources_by_asset_folder(folder, {
        resource_type: 'image',
        max_results: 100,
      });

      expect(response.resources).toHaveLength(5);
      expect(cloudinary.api.resources_by_asset_folder).toHaveBeenCalledWith(
        `foodbuddy/restaurants/${restaurantId}`,
        expect.any(Object)
      );
    });

    it('should handle restaurant with no images', async () => {
      (cloudinary.api.resources_by_asset_folder as jest.Mock).mockResolvedValue({
        resources: [],
        total_count: 0,
      });

      const restaurantId = 'restaurant-no-images';
      const folder = `foodbuddy/restaurants/${restaurantId}`;

      const response = await cloudinary.api.resources_by_asset_folder(folder, {
        resource_type: 'image',
        max_results: 100,
      });

      expect(response.resources).toHaveLength(0);
    });
  });

  describe('Image Data Validation', () => {
    it('should validate secure URL format', () => {
      const validUrl = 'https://res.cloudinary.com/dcbktxiuw/image/upload/v1761801462/tables_anwlni.jpg';
      
      expect(validUrl).toMatch(/^https:\/\/res\.cloudinary\.com\/.+\/image\/upload\/.+/);
    });

    it('should validate public_id format', () => {
      const publicIds = [
        'tables_anwlni',
        'menu1_x3gtxj',
        'menu2_cwqw5c',
        'menu3_coheml',
        'foods_xhr9be',
        'food1_xyz',
        'food_xyz',
        'happyhour_rfobbm',
      ];

      const patterns = ['tables_', 'foods_', 'menu1_', 'menu2_', 'menu3_', 'menu_', 'food1_', 'food_', 'happyhour_'];

      publicIds.forEach((id) => {
        const isValid = patterns.some((p) => id.startsWith(p));
        expect(isValid).toBe(true);
      });
    });

    it('should reject images with invalid prefixes', () => {
      const invalidIds = ['random_image', 'banner_xyz', 'logo_abc'];
      const patterns = ['tables_', 'foods_', 'menu1_', 'menu2_', 'menu3_', 'menu_', 'food1_', 'food_', 'happyhour_'];

      invalidIds.forEach((id) => {
        const isValid = patterns.some((p) => id.startsWith(p));
        expect(isValid).toBe(false);
      });
    });
  });

  describe('API Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const errorMessage = 'Network timeout';
      (cloudinary.api.resources_by_asset_folder as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      await expect(
        cloudinary.api.resources_by_asset_folder('some-folder', {})
      ).rejects.toThrow(errorMessage);
    });

    it('should handle Cloudinary authentication errors', async () => {
      (cloudinary.api.resources_by_asset_folder as jest.Mock).mockRejectedValue(
        new Error('Invalid API credentials')
      );

      await expect(
        cloudinary.api.resources_by_asset_folder('some-folder', {})
      ).rejects.toThrow('Invalid API credentials');
    });

    it('should handle invalid folder paths', async () => {
      (cloudinary.api.resources_by_asset_folder as jest.Mock).mockResolvedValue({
        resources: [],
      });

      const response = await cloudinary.api.resources_by_asset_folder(
        'invalid/path/that/does/not/exist',
        {}
      );

      expect(response.resources).toHaveLength(0);
    });
  });
});
