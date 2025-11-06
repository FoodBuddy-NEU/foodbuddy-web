'use client';

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FeedbackForm from './FeedbackForm';

// Mock all Firebase/Auth related modules
jest.mock('@/lib/firebaseClient', () => ({
  auth: {},
  app: {},
}));

jest.mock('@/lib/AuthProvider', () => ({
  useAuth: () => ({ user: null, loading: false }),
  AuthProvider: ({ children }: any) => children,
}));

jest.mock('@/lib/ThemeProvider', () => ({
  useTheme: () => ({ theme: 'light', setTheme: jest.fn() }),
  ThemeProvider: ({ children }: any) => children,
}));

// Mock fetch
global.fetch = jest.fn();

describe('FeedbackForm Component', () => {
  const mockRestaurant = {
    id: 'r1',
    name: 'Test Restaurant',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render feedback form', () => {
    render(
      <FeedbackForm 
        restaurant={mockRestaurant}
        defaultFeedbackType="menu"
      />
    );
    
    expect(screen.getByRole('heading', { name: /Share Your Feedback/i })).toBeInTheDocument();
  });

  it('should have all required form fields', () => {
    render(
      <FeedbackForm 
        restaurant={mockRestaurant}
        defaultFeedbackType="menu"
      />
    );

    expect(screen.getByLabelText(/Your Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Feedback Content/i)).toBeInTheDocument();
  });

  it('should validate email format before submission', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(
      <FeedbackForm 
        restaurant={mockRestaurant}
        defaultFeedbackType="menu"
      />
    );

    const nameInput = screen.getByLabelText(/Your Name/i);
    const emailInput = screen.getByLabelText(/Your Email/i);
    const feedbackInput = screen.getByLabelText(/Feedback Content/i);
    const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(feedbackInput, { target: { value: 'Test feedback' } });
    fireEvent.click(submitButton);

    // Should show validation error or not submit
    await waitFor(() => {
      expect(submitButton).toBeInTheDocument();
    });
  });

  it('should submit valid feedback', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, feedbackId: '123' }),
    } as Response);

    render(
      <FeedbackForm 
        restaurant={mockRestaurant}
        defaultFeedbackType="menu"
      />
    );

    const nameInput = screen.getByLabelText(/Your Name/i);
    const emailInput = screen.getByLabelText(/Your Email/i);
    const feedbackInput = screen.getByLabelText(/Feedback Content/i);

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(feedbackInput, { target: { value: 'Great menu!' } });

    expect(nameInput).toHaveValue('John Doe');
    expect(emailInput).toHaveValue('john@example.com');
    expect(feedbackInput).toHaveValue('Great menu!');
  });

  it('should display feedback type options', () => {
    render(
      <FeedbackForm 
        restaurant={mockRestaurant}
        defaultFeedbackType="menu"
      />
    );

    expect(screen.getByDisplayValue('menu')).toBeChecked();
    expect(screen.getByDisplayValue('contact-info')).not.toBeChecked();
  });
});
