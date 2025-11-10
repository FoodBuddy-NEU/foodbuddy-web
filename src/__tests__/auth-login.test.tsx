import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '@/app/login/loginPage';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/lib/firebaseClient', () => ({ auth: {} }));

// Define FirebaseError inside the mock factory and export it
jest.mock('firebase/app', () => {
  class FirebaseError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.name = 'FirebaseError';
      this.code = code;
    }
  }
  return { FirebaseError };
});

// Define auth functions and provider inside the mock factory and export them
jest.mock('firebase/auth', () => {
  const signInWithEmailAndPassword = jest.fn();
  const signInWithPopup = jest.fn();
  const GoogleAuthProvider = jest.fn().mockImplementation(() => ({}));
  return { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider };
});

// Import mocked exports to control behavior
import { FirebaseError } from 'firebase/app';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

// Create typed local mock handles
const mockEmailLogin = signInWithEmailAndPassword as unknown as jest.Mock;
const mockPopupLogin = signInWithPopup as unknown as jest.Mock;
const mockGoogleProvider = GoogleAuthProvider as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

test('logs in with email/password and redirects to home', async () => {
  mockEmailLogin.mockResolvedValue({ user: { uid: 'uid123' } });

  render(<LoginPage />);

  fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'user@example.com' } });
  fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'secret' } });

  fireEvent.click(screen.getByRole('button', { name: /log in/i }));

  expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
    expect.any(Object),
    'user@example.com',
    'secret'
  );
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'));
});

test('shows error message on email/password login failure', async () => {
  mockEmailLogin.mockRejectedValue(
    new FirebaseError('auth/invalid-credential', 'Invalid credentials')
  );

  render(<LoginPage />);

  fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'bad@example.com' } });
  fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrong' } });

  fireEvent.click(screen.getByRole('button', { name: /log in/i }));

  expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  expect(mockPush).not.toHaveBeenCalled();
});

test('logs in with Google and redirects to home', async () => {
  mockPopupLogin.mockResolvedValue({ user: { uid: 'uid456' } });

  render(<LoginPage />);

  fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

  expect(mockGoogleProvider).toHaveBeenCalled();
  expect(signInWithPopup).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'));
});

test('shows error message on Google login failure', async () => {
  mockPopupLogin.mockRejectedValue(new FirebaseError('auth/popup-blocked', 'Popup blocked'));

  render(<LoginPage />);

  fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

  expect(await screen.findByText('Popup blocked')).toBeInTheDocument();
  expect(mockPush).not.toHaveBeenCalled();
});
