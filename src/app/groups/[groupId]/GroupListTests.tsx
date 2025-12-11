import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GroupListPage from './page';

type FirestoreDocData = { name?: string; memberIds?: string[]; restaurantName?: string; diningTime?: string };
type MockDoc = { id: string; data: () => FirestoreDocData };

jest.mock('@/lib/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/chat', () => ({ createGroup: jest.fn(async () => 'gNew') }));
jest.mock('@/lib/userProfile', () => ({ getUserProfile: jest.fn(async () => null) }));

jest.mock('firebase/firestore', () => {
  const collection = jest.fn(() => ({}));
  const where = jest.fn(() => ({}));
  const query = jest.fn(() => ({}));
  let docs: MockDoc[] = [];
  const setDocs = (next: typeof docs) => { docs = next; };
  const getDocs = jest.fn(async () => ({ docs }));
  return { collection, where, query, getDocs, __setDocs: setDocs };
});

const { useAuth } = jest.requireMock('@/lib/AuthProvider') as { useAuth: jest.Mock };
const { createGroup } = jest.requireMock('@/lib/chat') as { createGroup: jest.Mock };
const { __setDocs } = jest.requireMock('firebase/firestore') as { __setDocs: (d: MockDoc[]) => void };

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ user: { uid: 'u1' }, loading: false });
  __setDocs([
    { id: 'a', data: () => ({ name: 'Alpha', memberIds: ['u1'], restaurantName: undefined, diningTime: undefined }) },
    { id: 'b', data: () => ({ name: 'Beta', memberIds: ['u1'], restaurantName: 'R', diningTime: '2025-01-02T12:00:00.000Z' }) },
    { id: 'c', data: () => ({ name: 'Gamma', memberIds: ['u1'], restaurantName: 'R2', diningTime: 'not-a-date' }) },
  ]);
});

test('requires sign-in', () => {
  useAuth.mockReturnValue({ user: null, loading: false });
  render(<GroupListPage />);
  expect(screen.getByText(/Please sign in/i)).toBeInTheDocument();
});

test('filters by restaurant and time has/no', async () => {
  render(<GroupListPage />);
  await screen.findByText('Your Groups');

  const selects = document.querySelectorAll('select');
  const restaurantSelect = selects[0] as HTMLSelectElement;
  const timeSelect = selects[1] as HTMLSelectElement;

  fireEvent.change(restaurantSelect, { target: { value: 'No Restaurant' } });
  expect(screen.getByText('Alpha')).toBeInTheDocument();
  expect(screen.queryByText('Beta')).toBeNull();

  fireEvent.change(restaurantSelect, { target: { value: 'Any Restaurant' } });
  fireEvent.change(timeSelect, { target: { value: 'has' } });
  expect(screen.getByText('Beta')).toBeInTheDocument();
  fireEvent.change(timeSelect, { target: { value: 'no' } });
  expect(screen.queryByText('Beta')).toBeNull();
});

test('time match range filters correctly', async () => {
  render(<GroupListPage />);
  await screen.findByText('Your Groups');

  const selects = document.querySelectorAll('select');
  const timeFilter = selects[1] as HTMLSelectElement;
  fireEvent.change(timeFilter, { target: { value: 'match' } });

  const startDate = document.querySelector('input[type="date"]') as HTMLInputElement;
  const dateInputs = document.querySelectorAll('input[type="date"]');
  const endDate = dateInputs[1] as HTMLInputElement;

  const startTime = document.querySelectorAll('select')[2] as HTMLSelectElement;
  const endTime = document.querySelectorAll('select')[3] as HTMLSelectElement;

  fireEvent.change(startDate, { target: { value: '2025-01-02' } });
  fireEvent.change(endDate, { target: { value: '2025-01-02' } });
  fireEvent.change(startTime, { target: { value: '00:00' } });
  fireEvent.change(endTime, { target: { value: '23:30' } });

  expect(screen.getByText('Beta')).toBeInTheDocument();
  expect(screen.queryByText('Alpha')).toBeNull();
});

test('search mismatch shows message', async () => {
  render(<GroupListPage />);
  await screen.findByText('Your Groups');
  const search = screen.getByPlaceholderText(/Search groups by name/i);
  fireEvent.change(search, { target: { value: 'zzz' } });
  expect(screen.getByText(/No groups match/i)).toBeInTheDocument();
});

test('create group success and failure branches', async () => {
  const origPrompt = window.prompt;
  const origAlert = window.alert;
  window.prompt = jest.fn(() => '');
  window.alert = jest.fn();

  render(<GroupListPage />);
  fireEvent.click(screen.getByText('+ Create'));
  expect(createGroup).not.toHaveBeenCalled();

  (window.prompt as jest.Mock).mockReturnValue('New Group');
  fireEvent.click(screen.getByText('+ Create'));
  await waitFor(() => expect(createGroup).toHaveBeenCalledWith('New Group', 'u1'));

  (createGroup as jest.Mock).mockRejectedValueOnce(new Error('fail'));
  fireEvent.click(screen.getByText('+ Create'));
  await waitFor(() => expect(window.alert).toHaveBeenCalled());

  window.prompt = origPrompt;
  window.alert = origAlert;
});

test('invalid diningTime shows N/A', async () => {
  render(<GroupListPage />);
  await screen.findByText('Your Groups');
  expect(screen.getAllByText(/N\/A/).length).toBeGreaterThan(0);
});