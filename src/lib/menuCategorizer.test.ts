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
});
