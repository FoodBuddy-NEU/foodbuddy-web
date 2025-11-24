import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserProfileForm from '@/components/UserProfileForm';
import { UserProfile } from '@/types/userProfile';
import { updateUserProfile } from '@/lib/userProfile';
import { getAuth } from 'firebase/auth';

// Mock the userProfile module
jest.mock('@/lib/userProfile', () => ({
  updateUserProfile: jest.fn(),
  addToUserArray: jest.fn(),
  removeFromUserArray: jest.fn(),
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn();

describe('UserProfileForm', () => {
  const mockProfile: UserProfile = {
    userId: 'test-user-123',
    username: 'TestUser',
    email: 'test@example.com',
    avatarUrl: 'https://example.com/avatar.jpg',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    cravings: ['Ramen'],
    favoriteCuisines: ['Japanese'],
    favoriteRestaurants: [],
    dietaryRestrictions: ['Vegetarian'],
    allergies: ['Peanuts'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();

    // Mock Firebase Auth
    const mockAuth = {
      currentUser: {
        reload: jest.fn(),
      },
    };
    (getAuth as jest.Mock).mockReturnValue(mockAuth);
  });

  it('renders user profile form with existing data', () => {
    render(<UserProfileForm profile={mockProfile} />);

    expect(screen.getByDisplayValue('TestUser')).toBeInTheDocument();
    // Email is now masked, so we check for the masked version
    expect(screen.getByDisplayValue('tes***@example.com')).toBeInTheDocument();
    // Avatar URL is displayed in img src, not in an input field
    expect(screen.getByAltText('Avatar preview')).toHaveAttribute(
      'src',
      'https://example.com/avatar.jpg'
    );
  });

  it('displays selected cravings', () => {
    render(<UserProfileForm profile={mockProfile} />);

    const ramenButton = screen.getByRole('button', { name: 'Ramen' });
    expect(ramenButton).toHaveClass('bg-blue-500');
  });

  it('displays selected cuisines', () => {
    render(<UserProfileForm profile={mockProfile} />);

    const japaneseButton = screen.getByRole('button', { name: 'Japanese' });
    expect(japaneseButton).toHaveClass('bg-green-500');
  });

  it('displays selected dietary restrictions', () => {
    render(<UserProfileForm profile={mockProfile} />);

    const vegetarianButton = screen.getByRole('button', { name: 'Vegetarian' });
    expect(vegetarianButton).toHaveClass('bg-orange-500');
  });

  it('displays selected allergies', () => {
    render(<UserProfileForm profile={mockProfile} />);

    const peanutsButton = screen.getByRole('button', { name: 'Peanuts' });
    expect(peanutsButton).toHaveClass('bg-red-500');
  });

  it('allows toggling craving selection', () => {
    render(<UserProfileForm profile={mockProfile} />);

    const pizzaButton = screen.getByRole('button', { name: 'Pizza' });

    // Initially not selected
    expect(pizzaButton).not.toHaveClass('bg-blue-500');

    // Click to select
    fireEvent.click(pizzaButton);
    expect(pizzaButton).toHaveClass('bg-blue-500');

    // Click to deselect
    fireEvent.click(pizzaButton);
    expect(pizzaButton).not.toHaveClass('bg-blue-500');
  });

  it('allows adding custom craving', () => {
    render(<UserProfileForm profile={mockProfile} />);

    const input = screen.getByPlaceholderText('Add custom craving...');
    const addButton = screen.getAllByRole('button', { name: 'Add' })[0];

    fireEvent.change(input, { target: { value: 'Custom Food' } });
    fireEvent.click(addButton);

    expect(screen.getByText('Custom Food')).toBeInTheDocument();
  });

  it('allows removing custom craving', () => {
    const profileWithCustom = {
      ...mockProfile,
      cravings: ['Ramen', 'Custom Food'],
    };

    render(<UserProfileForm profile={profileWithCustom} />);

    const removeButton = screen.getByText('✕');
    fireEvent.click(removeButton);

    expect(screen.queryByText('Custom Food')).not.toBeInTheDocument();
  });

  it('updates username field', () => {
    render(<UserProfileForm profile={mockProfile} />);

    const usernameInput = screen.getByDisplayValue('TestUser');
    fireEvent.change(usernameInput, { target: { value: 'NewUsername' } });

    expect(screen.getByDisplayValue('NewUsername')).toBeInTheDocument();
  });

  it('saves profile successfully', async () => {
    (updateUserProfile as jest.Mock).mockResolvedValue(undefined);

    render(<UserProfileForm profile={mockProfile} />);

    const saveButton = screen.getByRole('button', { name: 'Save Profile' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalledWith(
        'test-user-123',
        expect.objectContaining({
          username: 'TestUser',
          cravings: ['Ramen'],
          favoriteCuisines: ['Japanese'],
          dietaryRestrictions: ['Vegetarian'],
          allergies: ['Peanuts'],
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
    });
  });

  it('handles save error', async () => {
    (updateUserProfile as jest.Mock).mockRejectedValue(new Error('Save failed'));

    render(<UserProfileForm profile={mockProfile} />);

    const saveButton = screen.getByRole('button', { name: 'Save Profile' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to update profile. Please try again.')).toBeInTheDocument();
    });
  });

  it('disables email field', () => {
    render(<UserProfileForm profile={mockProfile} />);

    const emailInput = screen.getByDisplayValue('tes***@example.com');
    expect(emailInput).toBeDisabled();
  });

  it('calls onUpdate callback after successful save', async () => {
    const onUpdateMock = jest.fn();
    (updateUserProfile as jest.Mock).mockResolvedValue(undefined);

    render(<UserProfileForm profile={mockProfile} onUpdate={onUpdateMock} />);

    const saveButton = screen.getByRole('button', { name: 'Save Profile' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onUpdateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user-123',
          username: 'TestUser',
        })
      );
    });
  });

  describe('Email Verification Flow', () => {
    it('shows change email button', () => {
      render(<UserProfileForm profile={mockProfile} />);

      const changeEmailButton = screen.getByRole('button', { name: 'Change Email' });
      expect(changeEmailButton).toBeInTheDocument();
    });

    it('opens email change interface when clicking change email', () => {
      render(<UserProfileForm profile={mockProfile} />);

      const changeEmailButton = screen.getByRole('button', { name: 'Change Email' });
      fireEvent.click(changeEmailButton);

      expect(screen.getByPlaceholderText('Enter current email')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Verify Current Email' })).toBeInTheDocument();
    });

    it('validates current email - step 1', async () => {
      render(<UserProfileForm profile={mockProfile} />);

      const changeEmailButton = screen.getByRole('button', { name: 'Change Email' });
      fireEvent.click(changeEmailButton);

      const currentEmailInput = screen.getByPlaceholderText('Enter current email');
      const verifyButton = screen.getByRole('button', { name: 'Verify Current Email' });

      // Enter wrong email
      fireEvent.change(currentEmailInput, { target: { value: 'wrong@example.com' } });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByText(/Email does not match/i)).toBeInTheDocument();
      });

      // Enter correct email
      fireEvent.change(currentEmailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter new email')).toBeInTheDocument();
      });
    });

    it('sends verification code to new email - step 2', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<UserProfileForm profile={mockProfile} />);

      const changeEmailButton = screen.getByRole('button', { name: 'Change Email' });
      fireEvent.click(changeEmailButton);

      // Step 1: Verify current email
      const currentEmailInput = screen.getByPlaceholderText('Enter current email');
      fireEvent.change(currentEmailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: 'Verify Current Email' }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter new email')).toBeInTheDocument();
      });

      // Step 2: Enter new email and send code
      const newEmailInput = screen.getByPlaceholderText('Enter new email');
      fireEvent.change(newEmailInput, { target: { value: 'newemail@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: 'Send Verification Code' }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/send-verification', expect.any(Object));
        expect(screen.getByPlaceholderText('Enter 6-digit code')).toBeInTheDocument();
      });
    });

    it('validates verification code and updates email - step 3', async () => {
      const mockReload = jest.fn();
      const mockAuth = {
        currentUser: {
          reload: mockReload,
        },
      };
      (getAuth as jest.Mock).mockReturnValue(mockAuth);

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      const onUpdateMock = jest.fn();
      render(<UserProfileForm profile={mockProfile} onUpdate={onUpdateMock} />);

      // Open modal and go through all steps
      fireEvent.click(screen.getByRole('button', { name: 'Change Email' }));

      // Step 1
      fireEvent.change(screen.getByPlaceholderText('Enter current email'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Verify Current Email' }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter new email')).toBeInTheDocument();
      });

      // Step 2
      fireEvent.change(screen.getByPlaceholderText('Enter new email'), {
        target: { value: 'newemail@example.com' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Send Verification Code' }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter 6-digit code')).toBeInTheDocument();
      });

      // Step 3
      fireEvent.change(screen.getByPlaceholderText('Enter 6-digit code'), {
        target: { value: '123456' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Verify & Update' }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/auth/verify-and-update-email',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              userId: 'test-user-123',
              newEmail: 'newemail@example.com',
              verificationCode: '123456',
            }),
          })
        );
      });

      await waitFor(() => {
        expect(mockReload).toHaveBeenCalled();
        expect(onUpdateMock).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'newemail@example.com',
          })
        );
        expect(screen.getByText('Email updated successfully!')).toBeInTheDocument();
      });
    });

    it('handles verification code error', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Invalid code' }),
        });

      render(<UserProfileForm profile={mockProfile} />);

      // Navigate to step 3
      fireEvent.click(screen.getByRole('button', { name: 'Change Email' }));

      fireEvent.change(screen.getByPlaceholderText('Enter current email'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Verify Current Email' }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter new email')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('Enter new email'), {
        target: { value: 'newemail@example.com' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Send Verification Code' }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter 6-digit code')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('Enter 6-digit code'), {
        target: { value: 'wrong' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Verify & Update' }));

      await waitFor(() => {
        expect(screen.getByText(/Invalid verification code/i)).toBeInTheDocument();
      });
    });

    it('cancels email change flow', async () => {
      render(<UserProfileForm profile={mockProfile} />);

      fireEvent.click(screen.getByRole('button', { name: 'Change Email' }));
      expect(screen.getByPlaceholderText('Enter current email')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Enter current email')).not.toBeInTheDocument();
      });
    });
  });
});
