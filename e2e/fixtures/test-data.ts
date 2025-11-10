/**
 * Centralized test data for E2E tests
 * This ensures consistency across tests and makes it easy to update test data
 */

/**
 * Test restaurants - mirror production data
 */
export const TEST_RESTAURANTS = {
  pizza: {
    id: 'r1',
    name: 'Pizza Place',
    address: '123 Main St, Oakland, CA',
    phone: '555-0001',
    cuisine: 'Italian',
    rating: 4.5,
    distance: 0.5,
    priceRange: '$$',
  },
  burger: {
    id: 'r2',
    name: 'Burger King',
    address: '456 Oak Ave, Oakland, CA',
    phone: '555-0002',
    cuisine: 'American',
    rating: 4.0,
    distance: 1.2,
    priceRange: '$',
  },
  sushi: {
    id: 'r3',
    name: 'Sushi Spot',
    address: '789 Pine Rd, Oakland, CA',
    phone: '555-0003',
    cuisine: 'Japanese',
    rating: 4.8,
    distance: 2.1,
    priceRange: '$$$',
  },
};

/**
 * Test user accounts
 */
export const TEST_USER = {
  // Unauthenticated user
  guest: {
    email: 'guest@example.com',
    password: 'GuestPassword123!',
  },
  // Test user with bookmarks
  withBookmarks: {
    email: 'bookmarks@example.com',
    password: 'BookmarkPassword123!',
  },
  // Admin user
  admin: {
    email: 'admin@example.com',
    password: 'AdminPassword123!',
  },
};

/**
 * Test locations
 */
export const TEST_LOCATIONS = {
  userHome: {
    address: '5000 MacArthur Blvd, Oakland, CA',
    lat: 37.8,
    lng: -122.267,
  },
  userWork: {
    address: '1111 Broadway, Oakland, CA',
    lat: 37.792,
    lng: -122.272,
  },
  downtown: {
    address: '450 14th St, Oakland, CA',
    lat: 37.8044,
    lng: -122.271,
  },
};

/**
 * Test feedback data
 */
export const TEST_FEEDBACK = {
  positive: {
    restaurantId: 'r1',
    restaurantName: 'Pizza Palace',
    userName: 'Test User',
    userEmail: 'test@example.com',
    feedbackContent: 'Great place! Amazing pizza and friendly service.',
    feedbackType: 'menu',
    rating: 5,
  },
  negative: {
    restaurantId: 'r2',
    restaurantName: 'Burger King',
    userName: 'Critical User',
    userEmail: 'critic@example.com',
    feedbackContent: 'Food was cold and service was slow.',
    feedbackType: 'menu',
    rating: 2,
  },
  suggestion: {
    restaurantId: 'r3',
    restaurantName: 'Sushi Spot',
    userName: 'Suggestion User',
    userEmail: 'suggest@example.com',
    feedbackContent: 'Would be great if you added more vegetarian options.',
    feedbackType: 'contact-info',
    rating: 4,
  },
};

/**
 * API test data
 */
export const API_TEST_DATA = {
  // Valid distance API request
  validDistanceRequest: {
    restaurantAddresses: [
      TEST_RESTAURANTS.pizza.address,
      TEST_RESTAURANTS.burger.address,
      TEST_RESTAURANTS.sushi.address,
    ],
    userAddress: TEST_LOCATIONS.userHome.address,
  },

  // Invalid distance API request
  invalidDistanceRequest: {
    restaurantAddresses: [],
    userAddress: '',
  },

  // Valid feedback API request
  validFeedbackRequest: TEST_FEEDBACK.positive,

  // Invalid feedback API request
  invalidFeedbackRequest: {
    restaurantId: '',
    restaurantName: '',
    userName: '',
    userEmail: 'invalid-email',
    feedbackContent: '',
    feedbackType: 'menu',
  },
};

/**
 * Menu data
 */
export const TEST_MENUS = {
  pizzaMenu: {
    restaurantId: 'r1',
    categories: [
      {
        name: 'Main',
        items: [
          { name: 'Margherita Pizza', price: 12.99 },
          { name: 'Pepperoni Pizza', price: 14.99 },
        ],
      },
      {
        name: 'Sides',
        items: [
          { name: 'Garlic Bread', price: 5.99 },
          { name: 'Caesar Salad', price: 8.99 },
        ],
      },
    ],
  },

  burgerMenu: {
    restaurantId: 'r2',
    categories: [
      {
        name: 'Burgers',
        items: [
          { name: 'Classic Burger', price: 9.99 },
          { name: 'Deluxe Burger', price: 12.99 },
        ],
      },
      {
        name: 'Sides',
        items: [
          { name: 'French Fries', price: 3.99 },
          { name: 'Onion Rings', price: 4.99 },
        ],
      },
    ],
  },
};

/**
 * Common search terms
 */
export const SEARCH_TERMS = {
  partialMatch: 'pizza',
  fullMatch: 'Pizza Place',
  noResult: 'nonexistent-restaurant',
  specialChars: 'Restaurant @#$%',
  longSearch: 'a'.repeat(100),
};

/**
 * Filter options
 */
export const FILTER_OPTIONS = {
  cuisines: ['Italian', 'American', 'Japanese', 'Mexican', 'Chinese'],
  priceRanges: ['$', '$$', '$$$', '$$$$'],
  ratings: [4.5, 4.0, 3.5, 3.0],
  sortOptions: ['Distance', 'Rating', 'Price', 'Name'],
};

/**
 * Accessibility test data
 */
export const A11Y_TEST_DATA = {
  // Keyboard navigation keys
  keyboardKeys: {
    tab: 'Tab',
    enter: 'Enter',
    escape: 'Escape',
    arrow: 'ArrowDown',
  },

  // ARIA roles to check
  ariaRoles: ['button', 'link', 'textbox', 'heading', 'navigation'],

  // Common ARIA attributes
  ariaAttributes: ['aria-label', 'aria-describedby', 'aria-live', 'aria-expanded'],
};

/**
 * Performance thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
  pageLoadTime: 3000, // 3 seconds
  apiResponseTime: 1000, // 1 second
  interactiveTime: 2000, // 2 seconds
  interactionDelay: 100, // 100ms
};

/**
 * Timeout configurations
 */
export const TIMEOUTS = {
  short: 1000,
  medium: 5000,
  long: 10000,
  veryLong: 30000,
};

/**
 * Viewport sizes for responsive testing
 */
export const VIEWPORTS = {
  mobile: {
    name: 'iPhone SE',
    width: 375,
    height: 667,
    isMobile: true,
  },
  tablet: {
    name: 'iPad',
    width: 768,
    height: 1024,
    isMobile: false,
  },
  desktop: {
    name: 'Desktop',
    width: 1920,
    height: 1080,
    isMobile: false,
  },
  largeDesktop: {
    name: 'Large Desktop',
    width: 2560,
    height: 1440,
    isMobile: false,
  },
};

/**
 * HTTP status codes for mocking
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  networkError: 'Network error occurred',
  invalidInput: 'Invalid input',
  unauthorized: 'Unauthorized access',
  notFound: 'Resource not found',
  serverError: 'Server error occurred',
  timeout: 'Request timeout',
};

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  bookmarkAdded: 'Restaurant bookmarked',
  bookmarkRemoved: 'Bookmark removed',
  feedbackSubmitted: 'Feedback submitted successfully',
  settingsSaved: 'Settings saved',
  dataLoaded: 'Data loaded successfully',
};
