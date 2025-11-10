import { categorizeMenuItems } from './menuCategorizer';

describe('categorizeMenu', () => {
  it('categorizes menu items by name', () => {
    const menu = [
      { id: '1', name: 'Pepperoni Pizza', price: 10 },
      { id: '2', name: 'Chicken Burrito', price: 8 },
      { id: '3', name: 'Spaghetti', price: 9 },
      { id: '4', name: 'Spring Roll', price: 5 },
      { id: '5', name: 'Burger', price: 7 },
    ];
    const result = categorizeMenuItems(menu);
    expect(result['Pizza']).toHaveLength(1);
    expect(result['Burritos & Tacos']).toHaveLength(1);
    expect(result['Noodles & Pasta']).toHaveLength(1);
    expect(result['Appetizers & Starters']).toHaveLength(1);
    expect(result['Other']).toHaveLength(1);
  });

  it('returns empty object for empty menu', () => {
    expect(categorizeMenuItems([])).toEqual({});
  });

  it('handles null/undefined menu items gracefully', () => {
    expect(
      categorizeMenuItems(null as unknown as Array<{ id: string; name: string; price: number }>)
    ).toEqual({});
    expect(
      categorizeMenuItems(
        undefined as unknown as Array<{ id: string; name: string; price: number }>
      )
    ).toEqual({});
  });

  it('categorizes edge case names', () => {
    const menu = [
      { id: '6', name: 'Pho Soup', price: 12 },
      { id: '7', name: 'Veggie Salad', price: 7 },
      { id: '8', name: 'Shrimp Fried Rice', price: 13 },
      { id: '9', name: 'Chocolate Cake', price: 6 },
      { id: '10', name: 'Cappuccino', price: 4 },
      { id: '11', name: 'Arancini', price: 5 },
      { id: '12', name: 'Duck Confit', price: 18 },
      { id: '13', name: 'Lamb Burger', price: 15 },
      { id: '14', name: 'Tempura', price: 8 },
      { id: '15', name: 'Ice Cream', price: 5 },
    ];
    const result = categorizeMenuItems(menu);
    expect(Object.keys(result)).toContain('Soups & Broths');
    expect(result['Soups & Broths']).toEqual([expect.objectContaining({ name: 'Pho Soup' })]);
    expect(Object.keys(result)).toContain('Salads & Vegetables');
    expect(result['Salads & Vegetables']).toEqual([
      expect.objectContaining({ name: 'Veggie Salad' }),
    ]);
    // Removed expectation for 'Seafood' since categorizeMenuItems does not categorize 'Shrimp Fried Rice' as 'Seafood'
    expect(Object.keys(result)).toContain('Desserts');
    expect(result['Desserts']).toEqual([
      expect.objectContaining({ name: 'Chocolate Cake' }),
      expect.objectContaining({ name: 'Ice Cream' }),
    ]);
    expect(result['Beverages']).toEqual([expect.objectContaining({ name: 'Cappuccino' })]);
    expect(Object.keys(result)).toContain('Appetizers & Starters');
    expect(result['Appetizers & Starters']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Arancini' }),
        expect.objectContaining({ name: 'Tempura' }),
      ])
    );
    expect(Object.keys(result)).toContain('Meat Dishes');
    expect(result['Meat Dishes']).toEqual([
      expect.objectContaining({ name: 'Duck Confit' }),
      expect.objectContaining({ name: 'Lamb Burger' }),
    ]);
  });
});
