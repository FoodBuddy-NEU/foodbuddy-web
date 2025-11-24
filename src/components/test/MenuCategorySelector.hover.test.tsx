import { render, screen, fireEvent, act } from '@testing-library/react';
import MenuCategorySelector from '../MenuCategorySelector';

const menus = [
  { id: '1', title: 'Main', items: [{ id: 'a', name: 'Steak', price: 10 }] },
  { id: '2', title: 'Drinks', items: [{ id: 'b', name: 'Cola', price: 3 }] },
];

describe('MenuCategorySelector hover styles', () => {
  it('applies hover styles in light mode and resets on leave', () => {
    // Ensure light mode
    act(() => {
      document.documentElement.classList.remove('dark');
    });
    render(<MenuCategorySelector menus={menus} />);

    const btn = screen.getByRole('button', { name: /main/i });
    act(() => {
      fireEvent.click(btn);
    });

    const drinksItem = screen.getAllByText('Drinks')[0];
    fireEvent.mouseEnter(drinksItem);
    expect((drinksItem as HTMLButtonElement).style.backgroundColor).toBe('rgb(232, 232, 232)');

    fireEvent.mouseLeave(drinksItem);
    // Default (unselected) returns to white
    expect((drinksItem as HTMLButtonElement).style.backgroundColor).toBe('white');
  });

  it('applies hover styles in dark mode and resets on leave', () => {
    act(() => {
      document.documentElement.classList.add('dark');
    });
    render(<MenuCategorySelector menus={menus} />);

    const btn = screen.getByRole('button', { name: /main/i });
    act(() => {
      fireEvent.click(btn);
    });

    const drinksItem = screen.getAllByText('Drinks')[0];
    fireEvent.mouseEnter(drinksItem);
    expect((drinksItem as HTMLButtonElement).style.backgroundColor).toBe('rgb(45, 45, 45)');

    fireEvent.mouseLeave(drinksItem);
    expect((drinksItem as HTMLButtonElement).style.backgroundColor).toBe('rgb(30, 30, 30)');
    // Cleanup
    act(() => {
      document.documentElement.classList.remove('dark');
    });
  });
});
