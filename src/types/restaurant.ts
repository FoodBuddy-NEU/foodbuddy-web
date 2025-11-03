export type Deal = {
  id: string;
  title: string;
  description?: string;
  validFrom?: string;
  validTo?: string;
  eligibility?: string;
  restrictions?: string;
  timeOfUse?: string;
  limits?: string;
  refundPolicy?: string;
  cashValue?: string;
  disclaimer?: string;
};

export type MenuItem = {
  id: string;
  name: string;
  price: number;
};

export type Menu = {
  id: string;
  title: string;
  items: MenuItem[];
};

export type Review = {
  userName: string;
  rating: number;
  comment: string;
};

export type Restaurant = {
  id: string;
  name: string;
  address: string;
  phone: string;
  distance: number; // Distance in miles from the user's location
  priceRange: "$" | "$$" | "$$$";
  rating: number;
  /** Optional images — either a full `url` or a Cloudinary `public_id`. */
  images?: Array<{ public_id?: string; url?: string; alt?: string }>;
  foodTypes: string[];
  tags?: string[];
  deals?: Deal[];
  menus?: Menu[];
  reviews?: Review[];
};