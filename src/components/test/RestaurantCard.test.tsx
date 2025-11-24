'use client';

import React from 'react';
import { render, screen } from '@testing-library/react';
import RestaurantCard from '../RestaurantCard';
import type { Restaurant } from '@/types/restaurant';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { [key: string]: unknown }) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />;
  },
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock BookmarkButton component
jest.mock('../BookmarkButton', () => {
  return function MockBookmarkButton() {
    return <div data-testid="bookmark-button">Bookmark</div>;
  };
});

describe('RestaurantCard Component', () => {
  const mockRestaurant: Restaurant & { id: string | number } = {
    id: 'r1',
    name: 'Test Restaurant',
    address: '123 Test St, Boston, MA',
    phone: '(617) 555-0123',
    distance: 1.5,
    priceRange: '$$',
    rating: 4.5,
    foodTypes: ['Italian', 'Pasta'],
    tags: ['dine-in', 'vegetarian-friendly'],
    deals: [],
    menus: [],
    reviews: [],
  };

  it('should render restaurant name', () => {
    render(<RestaurantCard restaurant={mockRestaurant} />);
    expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
  });

  it('should render restaurant address', () => {
    render(<RestaurantCard restaurant={mockRestaurant} />);
    expect(screen.getByText('123 Test St, Boston, MA')).toBeInTheDocument();
  });

  it('should render restaurant rating', () => {
    render(<RestaurantCard restaurant={mockRestaurant} />);
    expect(screen.getByText(/Rating 4\.5★/)).toBeInTheDocument();
  });

  it('should render food types', () => {
    render(<RestaurantCard restaurant={mockRestaurant} />);
    expect(screen.getByText(/Italian, Pasta/)).toBeInTheDocument();
  });

  it('should render price range', () => {
    render(<RestaurantCard restaurant={mockRestaurant} />);
    expect(screen.getByText('$$')).toBeInTheDocument();
  });

  it('should render tags', () => {
    render(<RestaurantCard restaurant={mockRestaurant} />);
    expect(screen.getByText('dine-in')).toBeInTheDocument();
    expect(screen.getByText('vegetarian-friendly')).toBeInTheDocument();
  });

  it('should render distance when provided', () => {
    render(<RestaurantCard restaurant={mockRestaurant} distance="2.5 mi" />);
    expect(screen.getByText('2.5 mi')).toBeInTheDocument();
  });

  it('should not render distance when not provided', () => {
    render(<RestaurantCard restaurant={mockRestaurant} />);
    expect(screen.queryByText(/\d+\.\d+ mi/)).not.toBeInTheDocument();
  });

  it('should render bookmark button', () => {
    render(<RestaurantCard restaurant={mockRestaurant} />);
    expect(screen.getByTestId('bookmark-button')).toBeInTheDocument();
  });

  it('should have link to restaurant details', () => {
    render(<RestaurantCard restaurant={mockRestaurant} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/restaurants/r1');
  });

  it('should render restaurant image', () => {
    const restaurantWithImage: Restaurant & { id: string | number } = {
      ...mockRestaurant,
      images: [
        {
          url: 'https://example.com/image.jpg',
          alt: 'Restaurant image',
        },
      ],
    };

    render(<RestaurantCard restaurant={restaurantWithImage} />);
    const img = screen.getByAltText('Restaurant image');
    expect(img).toBeInTheDocument();
  });

  it('should not render image if images array is empty', () => {
    const restaurantNoImage = { ...mockRestaurant, images: [] };
    render((<RestaurantCard restaurant={restaurantNoImage} />) as React.ReactElement);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('should not render image if images is undefined', () => {
    const restaurantNoImage = { ...mockRestaurant };
    delete restaurantNoImage.images;
    render((<RestaurantCard restaurant={restaurantNoImage} />) as React.ReactElement);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('should handle missing tags gracefully', () => {
    const restaurantNoTags = { ...mockRestaurant, tags: undefined };
    render((<RestaurantCard restaurant={restaurantNoTags} />) as React.ReactElement);
    expect(screen.queryByText('dine-in')).not.toBeInTheDocument();
    expect(screen.queryByText('vegetarian-friendly')).not.toBeInTheDocument();
  });

  it('should handle missing foodTypes gracefully', () => {
    const restaurantNoFoodTypes = { ...mockRestaurant, foodTypes: [] };
    render((<RestaurantCard restaurant={restaurantNoFoodTypes} />) as React.ReactElement);
    expect(screen.queryByText(/Italian, Pasta/)).not.toBeInTheDocument();
  });

  it('should handle missing rating gracefully', () => {
    const restaurantNoRating: Restaurant & { id: string | number } = {
      ...mockRestaurant,
      rating: 0,
    };
    render((<RestaurantCard restaurant={restaurantNoRating} />) as React.ReactElement);
    // Rating of 0 should still render but differently
    expect(screen.queryByText(/4\.5/)).not.toBeInTheDocument();
  });

  it('should handle missing priceRange gracefully', () => {
    const restaurantNoPrice: Restaurant & { id: string | number } = {
      ...mockRestaurant,
      priceRange: '$',
    };
    render((<RestaurantCard restaurant={restaurantNoPrice} />) as React.ReactElement);
    expect(screen.queryByText('$$')).not.toBeInTheDocument();
  });
});
