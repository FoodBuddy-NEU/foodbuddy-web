import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PreOrder from '@/components/PreOrder';

// Mock fetch for tax rate API
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ taxRate: 0.0925 }),
  })
) as jest.Mock;

const mockRestaurant = {
  id: 'r1',
  name: 'Test Restaurant',
  address: '123 Main St, Boston, MA 02115',
  menus: [
    {
      id: 'menu1',
      title: 'Appetizers',
      items: [
        { id: 'item1', name: 'Spring Rolls', price: 8.99 },
        { id: 'item2', name: 'Soup', price: 5.99 },
      ],
    },
    {
      id: 'menu2',
      title: 'Main Course',
      items: [
        { id: 'item3', name: 'Pasta', price: 15.99 },
        { id: 'item4', name: 'Steak', price: 24.99 },
      ],
    },
  ],
};

const mockMembers = [
  { id: 'u1', username: 'Alice', allergies: ['peanuts'], dietaryRestrictions: ['vegetarian'] },
  { id: 'u2', username: 'Bob', allergies: [], dietaryRestrictions: [] },
  { id: 'u3', username: 'Charlie', allergies: ['shellfish'], dietaryRestrictions: [] },
];

const mockOnClose = jest.fn();
const mockOnSave = jest.fn();

describe('PreOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  test('renders restaurant name and address', () => {
    render(
      <PreOrder
        restaurant={mockRestaurant}
        members={mockMembers}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/Pre-Order for Test Restaurant/)).toBeInTheDocument();
    expect(screen.getByText('123 Main St, Boston, MA 02115')).toBeInTheDocument();
  });

  test('renders menu categories', () => {
    render(
      <PreOrder
        restaurant={mockRestaurant}
        members={mockMembers}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Appetizers')).toBeInTheDocument();
    expect(screen.getByText('Main Course')).toBeInTheDocument();
  });

  test('renders menu items from first category by default', () => {
    render(
      <PreOrder
        restaurant={mockRestaurant}
        members={mockMembers}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Spring Rolls')).toBeInTheDocument();
    expect(screen.getByText('$8.99')).toBeInTheDocument();
    expect(screen.getByText('Soup')).toBeInTheDocument();
  });

  test('switches menu category when clicked', () => {
    render(
      <PreOrder
        restaurant={mockRestaurant}
        members={mockMembers}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Main Course'));

    expect(screen.getByText('Pasta')).toBeInTheDocument();
    expect(screen.getByText('$15.99')).toBeInTheDocument();
    expect(screen.getByText('Steak')).toBeInTheDocument();
  });

  test('displays allergy alerts for members with allergies', () => {
    render(
      <PreOrder
        restaurant={mockRestaurant}
        members={mockMembers}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Allergy Alert')).toBeInTheDocument();
    expect(screen.getByText('Alice:')).toBeInTheDocument();
    expect(screen.getByText(/peanuts/)).toBeInTheDocument();
    expect(screen.getByText('Charlie:')).toBeInTheDocument();
    expect(screen.getByText(/shellfish/)).toBeInTheDocument();
  });

  test('does not show allergy alert when no members have allergies', () => {
    const membersWithoutAllergies = [
      { id: 'u1', username: 'Alice', allergies: [], dietaryRestrictions: [] },
    ];

    render(
      <PreOrder
        restaurant={mockRestaurant}
        members={membersWithoutAllergies}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('Allergy Alert')).not.toBeInTheDocument();
  });

  test('shows member selection modal when clicking menu item', () => {
    render(
      <PreOrder
        restaurant={mockRestaurant}
        members={mockMembers}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Spring Rolls'));

    expect(screen.getByText(/Who is ordering Spring Rolls/)).toBeInTheDocument();
    expect(screen.getByText('Select All')).toBeInTheDocument();
  });

  test('can select members and add item to order', async () => {
    render(
      <PreOrder
        restaurant={mockRestaurant}
        members={mockMembers}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Spring Rolls'));

    // Select Alice
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    // Click Add button
    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => {
      // Item should appear in order
      expect(screen.getByText(/For: Alice/)).toBeInTheDocument();
    });
  });

  test('shows empty order message when no items', () => {
    render(
      <PreOrder
        restaurant={mockRestaurant}
        members={mockMembers}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Click on menu items to add to order')).toBeInTheDocument();
  });

  test('renders tip selector buttons', () => {
    render(
      <PreOrder
        restaurant={mockRestaurant}
        members={mockMembers}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('15%')).toBeInTheDocument();
    expect(screen.getByText('18%')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  test('can change tip percentage', () => {
    render(
      <PreOrder
        restaurant={mockRestaurant}
        members={mockMembers}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('20%'));

    expect(screen.getByText(/Tip \(20%\)/)).toBeInTheDocument();
  });

  test('renders Cancel and Save Order buttons', () => {
    render(
      <PreOrder
        restaurant={mockRestaurant}
        members={mockMembers}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save Order')).toBeInTheDocument();
  });

  test('Cancel button calls onClose', () => {
    render(
      <PreOrder
        restaurant={mockRestaurant}
        members={mockMembers}
        onClose={mockOnClose}
      />
    );

    // Click the Cancel button in the footer (not the modal)
    const cancelButtons = screen.getAllByText('Cancel');
    fireEvent.click(cancelButtons[0]);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('Save Order button is disabled when no items', () => {
    render(
      <PreOrder
        restaurant={mockRestaurant}
        members={mockMembers}
        onClose={mockOnClose}
      />
    );

    const saveButton = screen.getByText('Save Order');
    expect(saveButton).toBeDisabled();
  });

  test('shows Add Custom Item button', () => {
    render(
      <PreOrder
        restaurant={mockRestaurant}
        members={mockMembers}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('+ Add Custom Item')).toBeInTheDocument();
  });

  test('shows custom item form when clicking Add Custom Item', () => {
    render(
      <PreOrder
        restaurant={mockRestaurant}
        members={mockMembers}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('+ Add Custom Item'));

    expect(screen.getByText('Add Custom Item')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Item name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Price')).toBeInTheDocument();
  });

  test('can add custom item with name and price', async () => {
    render(
      <PreOrder
        restaurant={mockRestaurant}
        members={mockMembers}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('+ Add Custom Item'));

    fireEvent.change(screen.getByPlaceholderText('Item name'), { target: { value: 'Special Dish' } });
    fireEvent.change(screen.getByPlaceholderText('Price'), { target: { value: '12.50' } });

    // Select a member
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    // Click Add
    const addButtons = screen.getAllByText('Add');
    fireEvent.click(addButtons[addButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('Special Dish')).toBeInTheDocument();
      expect(screen.getByText('Custom')).toBeInTheDocument();
    });
  });

  test('fetches tax rate on mount', async () => {
    render(
      <PreOrder
        restaurant={mockRestaurant}
        members={mockMembers}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/tax-rate?zipCode=02115');
    });
  });

  test('uses initial order values when provided', () => {
    const initialOrder = {
      items: [
        { id: 'test1', name: 'Test Item', price: 10, assignedTo: ['u1'], isCustom: false },
      ],
      tipPercent: 20,
      taxRate: 0.0725,
    };

    render(
      <PreOrder
        restaurant={mockRestaurant}
        members={mockMembers}
        onClose={mockOnClose}
        initialOrder={initialOrder}
      />
    );

    expect(screen.getByText('Test Item')).toBeInTheDocument();
    expect(screen.getByText(/Tip \(20%\)/)).toBeInTheDocument();
    expect(screen.getByText(/Tax \(7.25%\)/)).toBeInTheDocument();
  });

  test('calls onSave with order data', async () => {
    render(
      <PreOrder
        restaurant={mockRestaurant}
        members={mockMembers}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Add an item
    fireEvent.click(screen.getByText('Spring Rolls'));
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => {
      const saveButton = screen.getByText('Save Order');
      expect(saveButton).not.toBeDisabled();
    });

    fireEvent.click(screen.getByText('Save Order'));

    expect(mockOnSave).toHaveBeenCalled();
    expect(mockOnSave.mock.calls[0][0]).toHaveLength(1);
    expect(mockOnSave.mock.calls[0][0][0].name).toBe('Spring Rolls');
  });

  test('can remove item from order', async () => {
    render(
      <PreOrder
        restaurant={mockRestaurant}
        members={mockMembers}
        onClose={mockOnClose}
      />
    );

    // Add an item
    fireEvent.click(screen.getByText('Spring Rolls'));
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => {
      expect(screen.getByText(/For: Alice/)).toBeInTheDocument();
    });

    // Remove item
    fireEvent.click(screen.getByText('✕'));

    await waitFor(() => {
      expect(screen.queryByText(/For: Alice/)).not.toBeInTheDocument();
    });
  });

  test('Select All/Deselect All toggles member selection', () => {
    render(
      <PreOrder
        restaurant={mockRestaurant}
        members={mockMembers}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Spring Rolls'));

    // Click Select All
    fireEvent.click(screen.getByText('Select All'));

    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(cb => {
      expect(cb).toBeChecked();
    });

    // Click Deselect All
    fireEvent.click(screen.getByText('Deselect All'));

    checkboxes.forEach(cb => {
      expect(cb).not.toBeChecked();
    });
  });

  test('displays subtotal, tax, tip, and total', async () => {
    const initialOrder = {
      items: [
        { id: 'test1', name: 'Test Item', price: 10, assignedTo: ['u1'], isCustom: false },
      ],
      tipPercent: 18,
      taxRate: 0.1,
    };

    render(
      <PreOrder
        restaurant={mockRestaurant}
        members={mockMembers}
        onClose={mockOnClose}
        initialOrder={initialOrder}
      />
    );

    expect(screen.getByText('Subtotal:')).toBeInTheDocument();
    // Use getAllByText since prices appear in multiple places
    expect(screen.getAllByText('$10.00').length).toBeGreaterThan(0);
    expect(screen.getByText(/Tax \(10.00%\)/)).toBeInTheDocument();
    expect(screen.getByText('$1.00')).toBeInTheDocument();
    expect(screen.getByText(/Tip \(18%\)/)).toBeInTheDocument();
    expect(screen.getByText('$1.80')).toBeInTheDocument();
    expect(screen.getByText('Total:')).toBeInTheDocument();
    // Use getAllByText since $12.80 appears both in total and per-person breakdown
    expect(screen.getAllByText('$12.80').length).toBeGreaterThan(0);
  });

  test('shows per person breakdown when items exist', async () => {
    const initialOrder = {
      items: [
        { id: 'test1', name: 'Test Item', price: 10, assignedTo: ['u1'], isCustom: false },
      ],
      tipPercent: 0,
      taxRate: 0,
    };

    render(
      <PreOrder
        restaurant={mockRestaurant}
        members={mockMembers}
        onClose={mockOnClose}
        initialOrder={initialOrder}
      />
    );

    expect(screen.getByText('Per Person:')).toBeInTheDocument();
    // Use getAllByText to handle multiple occurrences of member names
    expect(screen.getAllByText(/Alice/).length).toBeGreaterThan(0);
  });

  test('handles restaurant without menus', () => {
    const restaurantNoMenus = {
      id: 'r2',
      name: 'Simple Place',
      address: '456 Oak Ave, Boston, MA 02116',
      menus: undefined,
    };

    render(
      <PreOrder
        restaurant={restaurantNoMenus}
        members={mockMembers}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/Pre-Order for Simple Place/)).toBeInTheDocument();
    expect(screen.getByText('+ Add Custom Item')).toBeInTheDocument();
  });

  test('can change tip with custom input', () => {
    render(
      <PreOrder
        restaurant={mockRestaurant}
        members={mockMembers}
        onClose={mockOnClose}
      />
    );

    const tipInput = screen.getByRole('spinbutton');
    fireEvent.change(tipInput, { target: { value: '22' } });

    expect(screen.getByText(/Tip \(22%\)/)).toBeInTheDocument();
  });

  test('extracts zip code from address for tax rate', async () => {
    render(
      <PreOrder
        restaurant={mockRestaurant}
        members={mockMembers}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('zipCode=02115'));
    });
  });

  test('uses default zip code when address has no zip', async () => {
    const restaurantNoZip = {
      id: 'r3',
      name: 'No Zip Restaurant',
      address: '789 Pine St, Berkeley, CA',
      menus: [],
    };

    render(
      <PreOrder
        restaurant={restaurantNoZip}
        members={mockMembers}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/tax-rate?zipCode=94704');
    });
  });
});
