import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import UnifiedFeedbackButton from '../UnifiedFeedbackButton';

jest.mock('@/lib/AuthProvider', () => ({
  useAuth: () => ({ user: { email: 'user@example.com', displayName: 'Alice' }, loading: false }),
}));

jest.mock('@/lib/ThemeProvider', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: jest.fn() }),
}));

describe('UnifiedFeedbackButton', () => {
  const restaurant = { id: 'r1', name: 'Testaurant' };

  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const openModal = () => {
    render(<UnifiedFeedbackButton restaurant={restaurant} />);
    fireEvent.click(screen.getByRole('button', { name: /feedback/i }));
  };

  
  test('validation errors for missing fields', async () => {
    openModal();
    fireEvent.click(screen.getByRole('button', { name: /submit feedback/i }));
    expect(await screen.findByText(/please enter feedback content/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/feedback details/i), { target: { value: 'Some issue' } });
    fireEvent.change(screen.getByLabelText(/your email/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /submit feedback/i }));
    expect(await screen.findByText(/please enter your email/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/your email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /submit feedback/i }));
    expect(await screen.findByText(/please enter your name/i)).toBeInTheDocument();
  });


  test('failed submission shows error message', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

    openModal();
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText(/your email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/feedback details/i), { target: { value: 'Issue' } });

    fireEvent.click(screen.getByRole('button', { name: /submit feedback/i }));
    expect(await screen.findByText(/failed to submit feedback/i)).toBeInTheDocument();
  });

});