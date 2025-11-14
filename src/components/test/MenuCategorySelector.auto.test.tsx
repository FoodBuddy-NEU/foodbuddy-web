import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MenuCategorySelector from '../MenuCategorySelector';

describe('MenuCategorySelector auto-categorization', () => {
  it("auto-categorizes when there's a single 'Main Menu'", () => {
    const menus = [
      {
        id: 'm1',
        title: 'Main Menu',
        items: [
          { id: 'i1', name: 'Pepperoni Pizza', price: 10 },
          { id: 'i2', name: 'Cappuccino', price: 4 },
        ],
      },
    ];
    render(<MenuCategorySelector menus={menus} />);
    const dropdownBtn = screen.getByRole('button');
    fireEvent.click(dropdownBtn);

    const dropdownMenu = document.getElementById('menu-category-dropdown-menu');
    expect(dropdownMenu?.textContent).toContain('Pizza');
    expect(dropdownMenu?.textContent).toContain('Beverages');
  });
});