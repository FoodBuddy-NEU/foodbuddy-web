import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserProfileForm from '../UserProfileForm';

jest.mock('@/lib/userProfile', () => ({
  updateUserProfile: jest.fn(async () => {}),
}));

jest.mock('firebase/auth', () => ({
  getAuth: () => ({ currentUser: null }),
}));

const baseProfile = {
  userId: 'u1',
  username: 'user',
  email: 'abc@example.com',
  createdAt: new Date(),
  updatedAt: new Date(),
  cravings: [],
  favoriteCuisines: [],
  favoriteRestaurants: [],
  dietaryRestrictions: [],
  allergies: [],
};

describe('UserProfileForm', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'cloud';
  });


  test('masks email with <=3 local chars', () => {
    render(<UserProfileForm profile={{ ...baseProfile, email: 'ab@x.com' }} />);
    expect(screen.getByDisplayValue('a***@x.com')).toBeInTheDocument();
  });



  test('avatar upload rejects oversize and non-image', async () => {
    render(<UserProfileForm profile={baseProfile} />);
    const label = screen.getByText(/upload photo/i).closest('label') as HTMLLabelElement;
    const input = label.querySelector('input[type="file"]') as HTMLInputElement;

    const bigFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'big.png', { type: 'image/png' });
    await waitFor(() => fireEvent.change(input, { target: { files: [bigFile] } }));
    expect(screen.getByText(/less than 5mb/i)).toBeInTheDocument();

    const badType = new File([new ArrayBuffer(10)], 'doc.txt', { type: 'text/plain' });
    await waitFor(() => fireEvent.change(input, { target: { files: [badType] } }));
    expect(screen.getByText(/upload an image file/i)).toBeInTheDocument();
  });

  

  test('save requires avatar and calls update', async () => {
    const onUpdate = jest.fn();
    const { updateUserProfile } = jest.requireMock('@/lib/userProfile') as { updateUserProfile: jest.Mock };

    render(<UserProfileForm profile={baseProfile} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole('button', { name: /save profile/i }));
    expect(screen.getByText(/select a profile picture/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Lazy Pizza'));
    fireEvent.click(screen.getByRole('button', { name: /save profile/i }));

    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalled();
      expect(screen.getByText(/updated successfully/i)).toBeInTheDocument();
      expect(onUpdate).toHaveBeenCalled();
    });
  });

});