import { render, screen, fireEvent } from '@testing-library/react';
import FeedbackButton from './FeedbackButton';

jest.mock('@/lib/ThemeProvider', () => ({
  useTheme: () => ({ theme: 'light', setTheme: jest.fn() }),
}));

jest.mock('./FeedbackForm', () => ({
  __esModule: true,
  default: () => <div data-testid="feedback-form">Form</div>,
}));

describe('FeedbackButton', () => {
  const restaurant = { id: 'r1', name: 'Test' };

  it('shows correct label for contact type and toggles form', () => {
    render(<FeedbackButton restaurant={restaurant} type="contact" />);
    const button = screen.getByRole('button', { name: /not working\? please tell us!/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.getByTestId('feedback-form')).toBeInTheDocument();

    const hide = screen.getByRole('button', { name: /hide/i });
    fireEvent.click(hide);
    expect(screen.getByRole('button', { name: /not working\? please tell us!/i })).toBeInTheDocument();
  });

  it('shows correct label for menu type', () => {
    render(<FeedbackButton restaurant={restaurant} type="menu" />);
    expect(screen.getByRole('button', { name: /incorrect\? please tell us!/i })).toBeInTheDocument();
  });

  it('applies light theme styles when form visible', () => {
    render(<FeedbackButton restaurant={restaurant} type="menu" />);
    fireEvent.click(screen.getByRole('button'));
    const header = screen.getByText(/send feedback/i);
    const container = header.parentElement?.parentElement as HTMLDivElement | null;
    expect(container).toBeTruthy();
    expect(container).toHaveStyle({ backgroundColor: 'rgb(240, 244, 248)' });
  });
});