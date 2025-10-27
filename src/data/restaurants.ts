import type { Restaurant } from "@/types/restaurant";

export const restaurants: Restaurant[] = [
  {
    id: "r1",
    name: "84 Viet",
    address: "84 Beacon St, Boston, MA 02108",
    phone: "(617) 555-0184",
    priceRange: "$$",
    rating: 3.9,
    foodTypes: ["Chinese"],
    tags: ["solo-friendly", "healthy"],
    deals: [
      {
        id: "d1",
        title: "Student 10% Off",
        description: "Valid with student ID",
        validFrom: "Oct 10",
        validTo: "Oct 23",
      },
    ],
    menus: [
      {
        id: "m1",
        title: "Main Menu",
        items: [
          { id: "i1", name: "Beef Noodles", price: 10.99 },
          { id: "i2", name: "Veggie Dumplings", price: 7.99 },
          { id: "i3", name: "Pork Fried Rice", price: 9.49 },
          { id: "i4", name: "Spicy Dan Dan Noodles", price: 11.29 },
          { id: "i5", name: "Scallion Pancakes", price: 6.99 },
          { id: "i6", name: "Cucumber Salad", price: 5.49 },
          { id: "i7", name: "Wonton Soup", price: 8.99 },
        ],
      },
    ],
    reviews: [
      { userName: "Alice", rating: 5, comment: "Great noodles and fast service." },
      { userName: "Ben", rating: 4, comment: "Tasty dumplings. Portion could be bigger." },
    ],
  },
  {
    id: "r2",
    name: "Red Garden",
    address: "123 Newbury St, Boston, MA 02116",
    phone: "(617) 555-0123",
    priceRange: "$$",
    rating: 4.4,
    foodTypes: ["Vegetarian"],
    tags: ["healthy", "vegan-friendly"],
    deals: [{ id: "d2", title: "10% Off Lunch", description: "Weekdays only", validFrom: "Oct 12", validTo: "Oct 31" }],
    menus: [
      {
        id: "m2",
        title: "Main Menu",
        items: [
          { id: "i3", name: "Quinoa Salad", price: 12.5 },
          { id: "i4", name: "Tofu Bowl", price: 13.0 },
        ],
      },
    ],
  },
  {
    id: "r3",
    name: "Green Garden",
    address: "456 Commonwealth Ave, Boston, MA 02215",
    phone: "(617) 555-0456",
    priceRange: "$$",
    rating: 4.2,
    foodTypes: ["Vegetarian"],
    tags: ["healthy", "vegan-friendly"],
    deals: [{ id: "d3", title: "10% Off Lunch", description: "Weekdays only", validFrom: "Oct 12", validTo: "Oct 31" }],
    menus: [
      {
        id: "m3",
        title: "Main Menu",
        items: [
          { id: "i4", name: "Quinoa Salad", price: 12.5 },
          { id: "i5", name: "Tofu Bowl", price: 13.0 },
        ],
      },
    ],
  },
  {
    id: "r4",
    name: "Sushi World",
    address: "789 Boylston St, Boston, MA 02199",
    phone: "(617) 555-0789",
    priceRange: "$$$",
    rating: 4.8,
    foodTypes: ["Japanese"],
    tags: ["popular", "date-night"],
    deals: [{ id: "d4", title: "Free Miso Soup", description: "With any sushi set" }],
    menus: [
      {
        id: "m4",
        title: "Sushi",
        items: [
          { id: "i6", name: "Salmon Nigiri (6 pcs)", price: 18.99 },
          { id: "i7", name: "California Roll", price: 9.5 },
        ],
      },
    ],
  },
  {
    id: "r5",
    name: "Pasta Palace",
    address: "321 Huntington Ave, Boston, MA 02115",
    phone: "(617) 555-0321",
    priceRange: "$$",
    rating: 4.0,
    foodTypes: ["Italian"],
    tags: ["family-friendly"],
    deals: [{ id: "d5", title: "Kids Eat Free", description: "With adult entree", validFrom: "Nov 1", validTo: "Nov 30" }],
    menus: [
      {
        id: "m5",
        title: "Pasta",
        items: [
          { id: "i8", name: "Spaghetti Bolognese", price: 14.25 },
          { id: "i9", name: "Classic Lasagna", price: 15.75 },
        ],
      },
    ],
  },
  {
    id: "r6",
    name: "Taco Town",
    address: "987 Mass Ave, Boston, MA 02118",
    phone: "(617) 555-0987",
    priceRange: "$",
    rating: 4.5,
    foodTypes: ["Mexican"],
    tags: ["budget", "late-night"],
    deals: [{ id: "d6", title: "Taco Tuesday 2-for-1", description: "Select tacos only" }],
    menus: [
      {
        id: "m6",
        title: "Tacos",
        items: [
          { id: "i10", name: "Al Pastor Taco", price: 3.5 },
          { id: "i11", name: "Veggie Taco", price: 3.25 },
        ],
      },
    ],
  },
  {
    id: "r7",
    name: "Cafe Breeze",
    address: "654 Tremont St, Boston, MA 02118",
    phone: "(617) 555-0654",
    priceRange: "$",
    rating: 4.1,
    foodTypes: ["Cafe"],
    tags: ["breakfast", "coffee"],
    deals: [{ id: "d7", title: "BOGO Coffee", description: "Buy one, get one free" }],
    menus: [
      {
        id: "m7",
        title: "Breakfast",
        items: [
          { id: "i12", name: "Avocado Toast", price: 8.0 },
          { id: "i13", name: "Cappuccino", price: 4.25 },
        ],
      },
    ],
  },
];