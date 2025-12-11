import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UsernameModal from '../UsernameModal';

jest.mock('@/lib/userProfile', () => ({
  updateUserProfile: jest.fn(async () => {}),
}));

describe('UsernameModal', () => {
  const onComplete = jest.fn();
  const { updateUserProfile } = jest.requireMock('@/lib/userProfile') as { updateUserProfile: jest.Mock };

  beforeEach(() => {
    onComplete.mockReset();
    updateUserProfile.mockReset();
  });


  test('successful save calls update and onComplete', async () => {
    render(<UsernameModal userId="u1" onComplete={onComplete} />);
    fireEvent.change(screen.getByPlaceholderText(/enter your username/i), { target: { value: 'user.name_1' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalledWith('u1', { username: 'user.name_1' });
      expect(onComplete).toHaveBeenCalledWith('user.name_1');
    });
  });
});