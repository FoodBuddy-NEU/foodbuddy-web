import { render, screen } from '@testing-library/react';
import GroupListPage from '@/app/groups/page';

jest.mock('@/lib/firebaseClient', () => ({ db: {} }));
jest.mock('firebase/firestore', () => {
  const collection = jest.fn(() => ({}));
  const orderBy = jest.fn(() => ({ field: 'name', dir: 'asc' }));
  const query = jest.fn(() => ({}));
  const getDocs = jest.fn(async () => ({
    docs: [
      { id: 'g1', data: () => ({ name: 'Alpha' }) },
      { id: 'g2', data: () => ({ name: 'Beta' }) },
    ],
  }));
  return { collection, orderBy, query, getDocs };
});
jest.mock('@/lib/AuthProvider', () => ({ useAuth: () => ({ user: { uid: 'u1' }, loading: false }) }));

test('renders groups and back link', async () => {
  render(<GroupListPage />);
  expect(await screen.findByText('Your Groups')).toBeInTheDocument();
  expect(await screen.findByText('Alpha')).toBeInTheDocument();
  expect(await screen.findByText('Beta')).toBeInTheDocument();
  const backLink = screen.getByText('← Back');
  expect(backLink).toHaveAttribute('href', '/');
});