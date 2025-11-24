import { render, screen } from '@testing-library/react';
import Page from './page';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/lib/firebaseClient', () => ({ auth: {} }));
jest.mock('firebase/auth', () => ({ createUserWithEmailAndPassword: jest.fn() }));

describe('Signup page wrapper', () => {
  it('renders the SignupPage default export', () => {
    render(<Page />);
    expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });
});
