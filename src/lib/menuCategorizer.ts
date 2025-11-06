import type { Menu, MenuItem } from '@/types/restaurant';

/**
 * Categorize menu items based on their names
 * Returns an object with category names as keys and MenuItem arrays as values
 */
export function categorizeMenuItems(items: MenuItem[]): Record<string, MenuItem[]> {
  const categories: Record<string, MenuItem[]> = {};

  items.forEach((item) => {
    let category = 'Other';
    const name = item.name.toLowerCase();

    // Pizza (check first to avoid conflicts with other keywords)
    if (name.includes('pizza')) {
      category = 'Pizza';
    }
    // Burritos & Tacos (check before other categories)
    else if (
      name.includes('burrito') ||
      name.includes('wrap') ||
      name.includes('tacos') ||
      name.includes('taco') ||
      name.includes('quesadilla')
    ) {
      category = 'Burritos & Tacos';
    }
    // Noodles & Pasta (check before rice to avoid conflicts)
    else if (
      name.includes('noodle') ||
      name.includes('spaghetti') ||
      name.includes('pasta') ||
      name.includes('fettuccine') ||
      name.includes('penne') ||
      name.includes('chow mein') ||
      name.includes('ramen')
    ) {
      category = 'Noodles & Pasta';
    }
    // Appetizers & Starters
    else if (
      name.includes('roll') ||
      name.includes('egg roll') ||
      name.includes('spring roll') ||
      name.includes('appetizer') ||
      name.includes('starter') ||
      name.includes('wing') ||
      name.includes('fried') ||
      name.includes('arancini') ||
      name.includes('breadstick') ||
      name.includes('pot sticker') ||
      name.includes('tempura') ||
      name.includes('gyoza') ||
      name.includes('dumpling')
    ) {
      category = 'Appetizers & Starters';
    }
    // Soups & Broths
    else if (
      name.includes('pho') ||
      name.includes('soup') ||
      name.includes('broth') ||
      name.includes('ramen')
    ) {
      category = 'Soups & Broths';
    }
    // Salads & Vegetables
    else if (
      name.includes('salad') ||
      name.includes('vegetable') ||
      name.includes('veggie') ||
      name.includes('veggies') ||
      name.includes('greens')
    ) {
      category = 'Salads & Vegetables';
    }
    // Main Courses - Meat
    else if (
      name.includes('beef') ||
      name.includes('chicken') ||
      name.includes('pork') ||
      name.includes('duck') ||
      name.includes('turkey') ||
      name.includes('lamb')
    ) {
      category = 'Meat Dishes';
    }
    // Seafood
    else if (
      name.includes('shrimp') ||
      name.includes('fish') ||
      name.includes('tuna') ||
      name.includes('salmon') ||
      name.includes('calamari') ||
      name.includes('seafood') ||
      name.includes('crab') ||
      name.includes('lobster')
    ) {
      category = 'Seafood';
    }
    // Rice Dishes
    else if (
      name.includes('rice') ||
      name.includes('fried rice') ||
      name.includes('risotto') ||
      name.includes('bowl')
    ) {
      category = 'Rice & Bowls';
    }
    // Beverages
    else if (
      name.includes('coffee') ||
      name.includes('latte') ||
      name.includes('cappuccino') ||
      name.includes('tea') ||
      name.includes('juice') ||
      name.includes('smoothie') ||
      name.includes('drink') ||
      name.includes('shake') ||
      name.includes('soda')
    ) {
      category = 'Beverages';
    }
    // Desserts
    else if (
      name.includes('dessert') ||
      name.includes('cake') ||
      name.includes('ice cream') ||
      name.includes('chocolate') ||
      name.includes('cheesecake') ||
      name.includes('pudding') ||
      name.includes('tart') ||
      name.includes('pastry')
    ) {
      category = 'Desserts';
    }

    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(item);
  });

  return categories;
}

/**
 * Convert categorized items back to Menu array format
 */
export function convertToMenus(
  categorized: Record<string, MenuItem[]>,
  baseId: string
): Menu[] {
  return Object.entries(categorized).map(([category, items], index) => ({
    id: `${baseId}-${category.toLowerCase().replace(/\s+/g, '-')}`,
    title: category,
    items,
  }));
}

/**
 * Process a single menu and split into categories
 */
export function processMenuCategories(menu: Menu, baseId: string): Menu[] {
  const categorized = categorizeMenuItems(menu.items);
  return convertToMenus(categorized, baseId);
}

/**
 * Process all menus in a restaurant
 */
export function processRestaurantMenus(menus: Menu[]): Menu[] {
  let processedMenus: Menu[] = [];
  let idCounter = 0;

  menus.forEach((menu) => {
    const baseId = `menu-${idCounter}`;
    const categorizedMenus = processMenuCategories(menu, baseId);
    processedMenus = [...processedMenus, ...categorizedMenus];
    idCounter++;
  });

  return processedMenus;
}
