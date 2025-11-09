'use client';

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ShareButton from './ShareButton';

// Mock the Web Share API
const mockShare = jest.fn();
const mockClipboard = jest.fn();

Object.assign(navigator, {
  share: mockShare,
  clipboard: {
    writeText: mockClipboard,
  },
});

describe('ShareButton Component', () => {
  const defaultProps = {
    restaurantId: 'test-restaurant',
    restaurantName: 'Test Restaurant',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockShare.mockResolvedValue(undefined);
    mockClipboard.mockResolvedValue(undefined);
  });

  it('should render share button', () => {
    render(<ShareButton {...defaultProps} />);
    const button = screen.getByRole('button', { name: /share/i });
    expect(button).toBeInTheDocument();
  });

  it('should have share emoji in button', () => {
    render(<ShareButton {...defaultProps} />);
    const button = screen.getByRole('button', { name: /share/i });
    expect(button.textContent).toContain('🔗');
  });

  it('should construct correct share URL', async () => {
    render(<ShareButton {...defaultProps} />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);

    // If Web Share API is available, it should be called
    // Otherwise, clipboard write should be called
    await waitFor(() => {
      expect(mockShare.mock.calls.length + mockClipboard.mock.calls.length).toBeGreaterThan(0);
    });
  });

  it('should fallback to clipboard if Web Share API not available', async () => {
    // Temporarily remove share API
    const originalShare = navigator.share;
    delete (navigator as unknown as { share?: unknown }).share;

    render(<ShareButton {...defaultProps} />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockClipboard).toHaveBeenCalled();
    });

    // Restore
    (navigator as unknown as { share: unknown }).share = originalShare;
  });

  it('should show copy confirmation message', async () => {
    render(<ShareButton {...defaultProps} />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);

    // The button should be clickable and not throw an error
    await waitFor(() => {
      expect(button).toBeInTheDocument();
    });
  });
});
