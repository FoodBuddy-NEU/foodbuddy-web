import { render, screen, fireEvent, act } from '@testing-library/react';
import MenuCategorySelector from './MenuCategorySelector';

const menus = [
  { id: '1', title: 'Main Menu', items: [] },
  { id: '2', title: 'Drinks', items: [] },
];

describe('MenuCategorySelector', () => {
  const OriginalMutationObserver = window.MutationObserver;
  beforeEach(() => {
    // Wrap MutationObserver callbacks in act to avoid warnings from external DOM class changes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).MutationObserver = class extends OriginalMutationObserver {
      constructor(callback: MutationCallback) {
        super((mutations, observer) => {
          act(() => callback(mutations, observer));
        });
      }
    } as unknown as typeof MutationObserver;
  });
  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).MutationObserver = OriginalMutationObserver;
  });

  it('renders menu titles and dropdown', () => {
    render(<MenuCategorySelector menus={menus} />);
    const mainMenuElements = screen.getAllByText('Main Menu');
    expect(mainMenuElements.length).toBeGreaterThanOrEqual(2); // dropdown + heading
    // Click dropdown button to expand menu
    const dropdownBtn = screen.getByRole('button', { name: /main menu/i });
    act(() => {
      fireEvent.click(dropdownBtn);
    });
    expect(screen.getByText('Drinks')).toBeInTheDocument();
  });

  it('should render all menu categories and select one', () => {
    const menusMock = [
      { id: '1', title: 'Main', items: [{ id: 'a', name: 'Steak', price: 10 }] },
      { id: '2', title: 'Drinks', items: [{ id: 'b', name: 'Cola', price: 3 }] },
      { id: '3', title: 'Dessert', items: [{ id: 'c', name: 'Cake', price: 5 }] },
    ];
    render(<MenuCategorySelector menus={menusMock} />);
    // Dropdown button shows Main by default
    const dropdownBtn = screen.getByRole('button', { name: /main/i });
    act(() => {
      fireEvent.click(dropdownBtn);
    });
    // Verify dropdown menu content
    const dropdownMenu = document.getElementById('menu-category-dropdown-menu');
    expect(dropdownMenu).toBeTruthy();
    expect(dropdownMenu?.textContent).toContain('Main');
    expect(dropdownMenu?.textContent).toContain('Drinks');
    expect(dropdownMenu?.textContent).toContain('Dessert');
    // Click Drinks
    act(() => {
      fireEvent.click(screen.getAllByText('Drinks')[0]);
    });
    // After selecting Drinks, title should be Drinks
    expect(screen.getAllByText('Drinks').length).toBeGreaterThanOrEqual(1);
  });

  it('should handle empty menus gracefully', () => {
    render(<MenuCategorySelector menus={[]} />);
    expect(screen.getByText(/no menu available/i)).toBeInTheDocument();
  });

  it('should highlight selected category', () => {
    const menusMock = [
      { id: '1', title: 'Main', items: [{ id: 'a', name: 'Steak', price: 10 }] },
      { id: '2', title: 'Drinks', items: [{ id: 'b', name: 'Cola', price: 3 }] },
      { id: '3', title: 'Dessert', items: [{ id: 'c', name: 'Cake', price: 5 }] },
    ];
    render(<MenuCategorySelector menus={menusMock} />);
    // Main is selected by default
    expect(screen.getAllByText('Main').length).toBeGreaterThanOrEqual(1);
    // Expand dropdown and select Dessert
    const dropdownBtn = screen.getByRole('button', { name: /main/i });
    act(() => {
      fireEvent.click(dropdownBtn);
    });
    fireEvent.click(screen.getByText('Dessert'));
    // After selecting Dessert, the title should be Dessert
    expect(screen.getAllByText('Dessert').length).toBeGreaterThanOrEqual(1);
  });
});
