# FoodBuddy Testing Guide

## Overview

This document describes the testing infrastructure for the FoodBuddy application, including unit tests, integration tests, and CI/CD pipelines.

## Test Structure

```
src/__tests__/
├── cloudinary-fetch.test.ts          # Unit tests for Cloudinary API
├── homepage.test.tsx                 # Homepage rendering tests
└── restaurant-images.integration.test.ts  # Integration tests for image fetching
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Coverage

### Cloudinary Image Fetching (`cloudinary-fetch.test.ts`)

Tests the core functionality of fetching and filtering images from Cloudinary:

- **Folder-based fetching**: Verifies images are fetched from the correct restaurant folder
- **Prefix filtering**: Tests that only images with allowed prefixes are returned
  - `tables_` - Restaurant dining tables
  - `foods_` - Food dishes
  - `menu1_`, `menu2_`, `menu3_` - Menu pages
  - `menu_` - Generic menu images
  - `food1_`, `food_` - Food images with variations
  - `happyhour_` - Happy hour promotions
- **Error handling**: Tests for network errors and empty results
- **URL validation**: Verifies secure URLs are constructed correctly

### Homepage Rendering (`homepage.test.tsx`)

Tests the homepage UI components and branding:

- **Logo display**: Tests that the FoodBuddy logo is displayed correctly
- **Branding text**: Verifies "Find restaurants near NEU-Oak" text
- **Responsive layout**: Tests Tailwind CSS responsive classes
- **Metadata**: Validates page title and description
- **Controls**: Tests filter and sort functionality

### Integration Tests (`restaurant-images.integration.test.ts`)

Tests the complete flow of image fetching and display:

- **Multi-restaurant scenarios**: Tests image fetching for different restaurants
  - Bobby G's Pizzeria (5 images)
  - 84 Viet (5 images)
- **Data validation**: Verifies public_id and URL formats
- **Error scenarios**: Tests handling of missing images and API errors
- **Edge cases**: Tests restaurants with no images

## CI/CD Pipeline

The project uses GitHub Actions for automated testing and building.

### Workflow: `ci.yml`

Runs on push and pull requests to `main` and `Add-restaurant-picture` branches.

#### Jobs:

1. **Test Job**
   - Runs on Node.js 18.x and 20.x
   - Installs dependencies
   - Runs linter (ESLint)
   - Runs test suite with coverage
   - Uploads coverage to Codecov

2. **Build Job** (runs after tests pass)
   - Installs dependencies
   - Builds Next.js application
   - Uploads build artifacts

3. **Type Check Job**
   - Runs TypeScript type checking
   - Validates no compilation errors

## Test Commands in CI

The CI pipeline runs these commands:

```bash
npm ci                          # Clean install dependencies
npm run lint                    # Run ESLint
npm test -- --coverage         # Run tests with coverage
npm run build                   # Build Next.js app
npx tsc --noEmit               # TypeScript check
```

## Dependencies

Testing dependencies installed:

- **jest**: Testing framework
- **@testing-library/react**: React component testing utilities
- **@testing-library/jest-dom**: Custom Jest matchers for DOM
- **@types/jest**: TypeScript types for Jest
- **ts-jest**: TypeScript preprocessor for Jest

## Mock Strategy

### Cloudinary Mock

The tests mock the Cloudinary SDK to avoid making actual API calls:

```typescript
jest.mock('@/lib/cloudinary', () => ({
  __esModule: true,
  default: {
    api: {
      resources_by_asset_folder: jest.fn(),
    },
  },
}));
```

This allows tests to:
- Control API responses
- Test error scenarios
- Verify correct parameters are passed
- Run tests without API credentials

### Next.js Image Mock

The Image component is mocked to render as a standard `<img>` tag:

```typescript
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));
```

## Image Prefix Patterns

The application uses these prefixes to categorize restaurant images:

| Prefix | Purpose |
|--------|---------|
| `tables_` | Dining area photos |
| `foods_` | Food dish photos |
| `food_` | Alternative food naming |
| `food1_` | Numbered food photos |
| `menu_` | Generic menu images |
| `menu1_` | First menu page |
| `menu2_` | Second menu page |
| `menu3_` | Third menu page |
| `happyhour_` | Happy hour promotions |

## Expected Test Results

When running tests, you should see:

```
PASS  src/__tests__/cloudinary-fetch.test.ts
PASS  src/__tests__/homepage.test.tsx
PASS  src/__tests__/restaurant-images.integration.test.ts

Tests:       30+ passed
Coverage:    > 80% across test files
```

## Adding New Tests

When adding new features:

1. Create a new test file in `src/__tests__/`
2. Use the naming convention: `{feature}.test.ts(x)`
3. Mock external dependencies (API calls, Next.js components)
4. Run `npm run test:watch` during development
5. Ensure coverage remains above 80%

## Debugging Tests

To debug a specific test:

```bash
node --inspect-brk ./node_modules/.bin/jest --runInBand --testNamePattern="test name"
```

Then open `chrome://inspect` in Chrome DevTools.

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cloudinary API Documentation](https://cloudinary.com/documentation/image_upload_api)
